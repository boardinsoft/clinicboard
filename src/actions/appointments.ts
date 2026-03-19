'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { appointmentSchema } from '@/lib/schemas/appointment.schema';
import { AppointmentStatus } from '@/lib/fhir/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Transiciones permitidas para citas (Appointment) basadas en FHIR R4.
 */
const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    proposed: ['pending', 'booked', 'noshow', 'cancelled'],
    pending: ['proposed', 'booked', 'noshow', 'cancelled'],
    booked: ['proposed', 'arrived', 'noshow', 'cancelled'],
    arrived: ['proposed', 'fulfilled', 'noshow', 'cancelled'],
    fulfilled: [], // Terminal
    cancelled: [], // Terminal
    noshow: [],    // Terminal
};

/**
 * Valida si una transición de estado es permitida.
 */
function validateTransition(current: AppointmentStatus, target: AppointmentStatus): { isValid: boolean; error?: string } {
    if (current === target) return { isValid: true };
    const allowed = VALID_TRANSITIONS[current] || [];
    if (allowed.includes(target)) {
        return { isValid: true };
    }
    return {
        isValid: false,
        error: `Transición de estado inválida: de '${current}' a '${target}'. Estados permitidos desde '${current}': [${allowed.join(', ')}]`
    };
}

/**
 * Valida reglas de negocio para horarios de citas.
 */
function validateAppointmentTimes(startTime: string, endTime: string): { isValid: boolean; error?: string } {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date(Date.now() - 5 * 60 * 1000); // 5 min buffer

    // 1. Fecha Futura
    if (start < now) {
        return { isValid: false, error: 'No se pueden agendar citas en el pasado.' };
    }

    // 2. Orden cronológico y duración
    const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMin < 15 || durationMin > 120) {
        return { isValid: false, error: 'La cita debe durar entre 15 y 120 minutos.' };
    }

    // 3. Horas de operación (8:00 - 20:00)
    const startHour = start.getHours();
    const endHour = end.getHours();
    const endMin = end.getMinutes();

    if (startHour < 8 || startHour >= 20) {
        return { isValid: false, error: 'La hora de inicio debe estar entre las 08:00 AM y las 07:45 PM.' };
    }
    if (endHour > 20 || (endHour === 20 && endMin > 0)) {
        return { isValid: false, error: 'La cita no puede terminar después de las 08:00 PM.' };
    }

    return { isValid: true };
}

/**
 * Verifica si hay solapamiento de horarios para un profesional.
 */
async function checkOverlap(supabase: SupabaseClient<Database>, practitionerId: string, startTime: string, endTime: string, currentId?: string) {
    let query = supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .eq('practitioner_id', practitionerId)
        .in('status', ['proposed', 'pending', 'booked', 'arrived'])
        .lt('start_time', endTime)
        .gt('end_time', startTime);

    if (currentId) {
        query = query.neq('id', currentId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error checking overlap:', error);
        return { error: 'Error al verificar disponibilidad' };
    }

    if (data && data.length > 0) {
        return { 
            hasOverlap: true, 
            message: 'El profesional ya tiene una cita programada en este horario.' 
        };
    }

    return { hasOverlap: false };
}

/**
 * createAppointment(data)
 * Guard auth, validate with appointmentSchema, fhir_id=uuid, status='proposed', 
 * insert with practitioner_id=user.id. revalidatePath('/appointments').
 */
export async function createAppointment(formData: {
    patient_id: string;
    start_time: string;
    end_time: string;
    appointment_type: string;
    description?: string;
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado. Sesión no encontrada.' };
    }

    const appointmentData = {
        ...formData,
        practitioner_id: user.id,
        status: 'proposed' as AppointmentStatus,
    };

    const validation = appointmentSchema.safeParse(appointmentData);

    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors };
    }

    // Checking business rules for times
    const timeVal = validateAppointmentTimes(validation.data.start_time, validation.data.end_time);
    if (!timeVal.isValid) {
        return { error: timeVal.error };
    }

    // Checking for overlap
    const overlapResult = await checkOverlap(
        supabase, 
        user.id, 
        validation.data.start_time, 
        validation.data.end_time
    );

    if (overlapResult.hasOverlap) {
        return { error: overlapResult.message };
    }

    const { data, error } = await supabase
        .from('appointments')
        .insert([{
            patient_id: validation.data.patient_id,
            practitioner_id: validation.data.practitioner_id,
            start_time: validation.data.start_time,
            end_time: validation.data.end_time,
            appointment_type: validation.data.appointment_type,
            description: validation.data.description,
            status: validation.data.status,
            fhir_id: crypto.randomUUID(), // fhir_id = uuid
        }])
        .select()
        .single();

    if (error) {
        console.error('Error in createAppointment:', error);
        return { error: error.message };
    }

    revalidatePath('/appointments');
    return { data };
}

/**
 * confirmAppointment(id)
 * Guard auth, update status='booked' if status was 'proposed' or 'pending', 
 * verify ownership.
 */
export async function confirmAppointment(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // First check what is the current status
    const { data: currentAppt, error: checkError } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', id)
        .single();
    
    if (checkError) {
        console.warn('Could not pre-check status (RLS?):', checkError.message);
    }

    const currentStatus = (currentAppt?.status as AppointmentStatus) || 'proposed';
    
    if (currentStatus === 'booked') {
        return { success: true, message: 'La cita ya estaba confirmada' };
    }

    const validation = validateTransition(currentStatus, 'booked');
    if (!validation.isValid) {
        return { error: validation.error };
    }

    const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'booked' })
        .eq('id', id)
        .eq('status', currentStatus)
        .select()
        .single();

    if (error) {
        console.error('Error in confirmAppointment:', error, 'ID:', id);
        return { 
            error: error.code === 'PGRST116' 
                ? `Estado actual (${currentAppt?.status || 'desconocido'}) no permite confirmar. Solo Propuestas o Pendientes.`
                : error.message 
        };
    }

    revalidatePath('/appointments');
    return { data };
}

/**
 * cancelAppointment(id, reason?)
 * Guard auth, update status='cancelled', save reason in description, 
 * verify ownership.
 */
export async function cancelAppointment(id: string, reason?: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // Check current status
    const { data: currentAppt } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', id)
        .single();

    const currentStatus = (currentAppt?.status as AppointmentStatus) || 'proposed';
    const validation = validateTransition(currentStatus, 'cancelled');
    if (!validation.isValid) {
        return { error: validation.error };
    }

    const { data, error } = await supabase
        .from('appointments')
        .update({
            status: 'cancelled',
            description: reason ? `Cancelación: ${reason}` : 'Cancelada sin motivo especificado'
        })
        .eq('id', id)
        .eq('status', currentStatus)
        .select()
        .single();

    if (error) {
        console.error('Error in cancelAppointment:', error);
        return { error: error.message };
    }

    revalidatePath('/appointments');
    return { data };
}

/**
 * markArrived(id)
 * Guard auth, update status='arrived', verify ownership.
 */
export async function markArrived(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // Check current status
    const { data: currentAppt } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', id)
        .single();

    const currentStatus = (currentAppt?.status as AppointmentStatus) || 'proposed';
    const validation = validateTransition(currentStatus, 'arrived');
    if (!validation.isValid) {
        return { error: validation.error };
    }

    const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'arrived' })
        .eq('id', id)
        .eq('practitioner_id', user.id)
        .eq('status', currentStatus)
        .select()
        .single();

    if (error) {
        console.error('Error in markArrived:', error);
        return { error: error.message };
    }

    revalidatePath('/appointments');
    return { data };
}

/**
 * fulfillAppointment(id)
 * Guard auth, update status='fulfilled', verify ownership.
 */
export async function fulfillAppointment(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // Check current status
    const { data: currentAppt } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', id)
        .single();

    const currentStatus = (currentAppt?.status as AppointmentStatus) || 'proposed';
    const validation = validateTransition(currentStatus, 'fulfilled');
    if (!validation.isValid) {
        return { error: validation.error };
    }

    const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'fulfilled' })
        .eq('id', id)
        .eq('practitioner_id', user.id)
        .eq('status', currentStatus)
        .select()
        .single();

    if (error) {
        console.error('Error in fulfillAppointment:', error);
        return { error: error.message };
    }

    revalidatePath('/appointments');
    return { data };
}

/**
 * markNoShow(id)
 * Guard auth, update status='noshow', verify ownership.
 */
export async function markNoShow(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // Check current status
    const { data: currentAppt } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', id)
        .single();

    const currentStatus = (currentAppt?.status as AppointmentStatus) || 'proposed';
    const validation = validateTransition(currentStatus, 'noshow');
    if (!validation.isValid) {
        return { error: validation.error };
    }

    const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'noshow' })
        .eq('id', id)
        .eq('practitioner_id', user.id)
        .eq('status', currentStatus)
        .select()
        .single();

    if (error) {
        console.error('Error in markNoShow:', error);
        return { error: error.message };
    }

    revalidatePath('/appointments');
    return { data };
}

/**
 * getAppointments(filters)
 * Read-only action to fetch appointments with patient join.
 */
export async function getAppointments(filters?: {
    date?: string;       // ISO date string (YYYY-MM-DD) — filtra citas del día
    status?: AppointmentStatus[];  // Array de estados FHIR a incluir
    patientId?: string;  // Filtrar por paciente específico
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: [] };
    }

    let query = supabase
        .from('appointments')
        .select(`
            *, 
            patient:patients(
                id, 
                name_given, 
                name_family, 
                gender, 
                birth_date, 
                telecom, 
                identifiers
            )
        `)
        .eq('practitioner_id', user.id);

    if (filters?.date) {
        // Usar offset -04:00 para Venezuela en lugar de Z (UTC)
        const startOfDay = `${filters.date}T00:00:00-04:00`;
        const endOfDay = `${filters.date}T23:59:59-04:00`;
        query = query.gte('start_time', startOfDay).lt('start_time', endOfDay);
    }

    if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
    }

    if (filters?.patientId) {
        query = query.eq('patient_id', filters.patientId);
    }

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) {
        console.error('Error in getAppointments:', error);
        return { data: [] };
    }

    return { data: data || [] };
}

/**
 * rescheduleAppointment(id, newStartTime, newEndTime)
 * Permite cambiar el horario de una cita existente.
 * Reinicia el estado a 'proposed'.
 */
export async function rescheduleAppointment(id: string, newStartTime: string, newEndTime: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Check current status
    const { data: currentAppt } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', id)
        .single();

    const currentStatus = (currentAppt?.status as AppointmentStatus) || 'proposed';
    
    // Reschedule typically goes back to 'proposed' or stays 'booked' if it was booked?
    // The previous code set it to 'proposed'. Let's follow that but validate.
    const validation = validateTransition(currentStatus, 'proposed');
    if (!validation.isValid && currentStatus !== 'proposed') {
        return { error: validation.error };
    }

    // Checking business rules for times
    const timeVal = validateAppointmentTimes(newStartTime, newEndTime);
    if (!timeVal.isValid) {
        return { error: timeVal.error };
    }

    // Checking for overlap
    const overlapResult = await checkOverlap(
        supabase, 
        user.id, 
        newStartTime, 
        newEndTime, 
        id
    );

    if (overlapResult.hasOverlap) {
        return { error: overlapResult.message };
    }

    const { data, error } = await supabase
        .from('appointments')
        .update({
            start_time: newStartTime,
            end_time: newEndTime,
            status: 'proposed'
        })
        .eq('id', id)
        .eq('practitioner_id', user.id)
        .eq('status', currentStatus)
        .select()
        .single();

    if (error) {
        console.error('Error in rescheduleAppointment:', error);
        return { error: error.message };
    }

    revalidatePath('/appointments');
    return { data };
}

/**
 * cleanupExpiredAppointments()
 * Cancela automáticamente citas en estado 'proposed' o 'pending' 
 * cuya hora de inicio sea anterior a la actual.
 */
export async function cleanupExpiredAppointments() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('appointments')
        .update({
            status: 'cancelled',
            description: 'Cancelación automática: La cita expiró sin ser confirmada o atendida.'
        })
        .eq('practitioner_id', user.id)
        .in('status', ['proposed', 'pending'])
        .lt('start_time', now)
        .select();

    if (error) {
        console.error('Error in cleanupExpiredAppointments:', error);
        return { error: error.message };
    }

    if (data && data.length > 0) {
        revalidatePath('/appointments');
    }

    return { count: data?.length || 0 };
}

/**
 * startConsultationFromAppointment(appointmentId)
 * 1. Valida que la cita esté en estado 'arrived' o 'booked'.
 * 2. Cambia el estado de la cita a 'fulfilled'.
 * 3. Crea un Encounter en estado 'in-progress' vinculado.
 * 4. Retorna el ID del encounter para redirección.
 */
export async function startConsultationFromAppointment(appointmentId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // 1. Validar cita
    const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

    if (apptError || !appt) return { error: 'Cita no encontrada' };

    const currentStatus = (appt.status as AppointmentStatus) || 'proposed';
    if (!['booked', 'arrived'].includes(currentStatus)) {
        return { error: `No se puede iniciar consulta desde una cita en estado '${currentStatus}'. Solo desde 'Confirmada' o 'En Espera'.` };
    }

    // 2. Marcar cita como cumplida (fulfilled)
    const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'fulfilled' })
        .eq('id', appointmentId);

    if (updateError) return { error: 'Error al actualizar estado de la cita' };

    // 3. Crear encuentro (Encounter)
    const { createEncounter } = await import('@/actions/encounters');
    
    const encounterResult = await createEncounter({
        patient_id: appt.patient_id,
        encounter_class: 'AMB',
        start_time: new Date().toISOString(),
        appointment_id: appointmentId,
        status: 'in-progress'
    });

    if (encounterResult.error) {
        // Rollback? No es crítico si ya se cumplió la cita.
        return { error: encounterResult.error };
    }

    revalidatePath('/appointments');
    revalidatePath('/history');

    return { 
        success: true, 
        encounterId: encounterResult.data?.id,
        patientId: appt.patient_id
    };
}
/**
 * createWalkInAppointment(patientId)
 * Creates an appointment with status 'arrived' directly, 
 * bypassing future date/overlap validations and assigning it to the queue.
 */
export async function createWalkInAppointment(payload: { 
    patient_id: string; 
    description?: string; 
    appointment_type?: string; 
}) {
    const { patient_id: patientId, description, appointment_type: appointmentType } = payload;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const now = new Date();
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + 30 * 60000).toISOString();

    // Calcular la posición en cola basada en el día local de Venezuela
    const { nowInVE, toISODate } = await import('@/lib/date-utils');
    const localToday = toISODate(nowInVE());
    const startOfLocalDay = `${localToday}T00:00:00-04:00`;
    
    const { data: lastInQueue } = await supabase
        .from('appointments')
        .select('queue_position')
        .eq('practitioner_id', user.id)
        .gte('start_time', startOfLocalDay)
        .order('queue_position', { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextPosition = (lastInQueue?.queue_position || 0) + 1;
    const { data, error } = await supabase
        .from('appointments')
        .insert([{
            patient_id: patientId,
            practitioner_id: user.id,
            status: 'arrived',
            start_time: startTime,
            end_time: endTime,
            description: description || 'Consulta por orden de llegada (Walk-In)',
            queue_position: nextPosition,
            appointment_type: appointmentType || 'walk-in'
        }])
        .select()
        .single();

    console.log('[createWalkInAppointment] Insert result:', { data, error });

    if (error) {
        console.error('Error in createWalkInAppointment:', error);
        return { error: error.message };
    }

    revalidatePath('/appointments');
    return { data };
}

/**
 * updateQueuePosition(appointmentId, newPosition)
 */
export async function updateQueuePosition(id: string, newPosition: number) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const { error } = await supabase
        .from('appointments')
        .update({ queue_position: newPosition })
        .eq('id', id)
        .eq('practitioner_id', user.id);

    if (error) {
        console.error('Error in updateQueuePosition:', error);
        return { error: error.message };
    }

    revalidatePath('/appointments');
    return { success: true };
}
