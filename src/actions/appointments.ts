'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { appointmentSchema } from '@/lib/schemas/appointment.schema';
import { AppointmentStatus } from '@/lib/fhir/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';

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
async function checkOverlap(supabase: SupabaseClient<Database>, practitionerId: string, clinicId: string, startTime: string, endTime: string, currentId?: string) {
    let query = supabase
        .from('appointments')
        .select('id, start_time, end_time')
        .eq('practitioner_id', practitionerId)
        .eq('clinic_id', clinicId)
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
 * Verifica que un paciente no tenga ya una cita activa ('proposed', 'pending', 'booked', 'arrived')
 * del mismo tipo con el mismo profesional.
 */
async function checkDuplicateType(
    supabase: SupabaseClient<Database>,
    practitionerId: string,
    clinicId: string,
    patientId: string,
    appointmentType: string
) {
    if (!appointmentType) return { hasDuplicate: false };

    const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_type')
        .eq('practitioner_id', practitionerId)
        .eq('clinic_id', clinicId)
        .eq('patient_id', patientId)
        .eq('appointment_type', appointmentType)
        .in('status', ['proposed', 'pending', 'booked', 'arrived']);

    if (error) {
        console.error('Error checking duplicate type:', error);
        return { error: 'Error al verificar duplicados.' };
    }

    if (data && data.length > 0) {
        return {
            hasDuplicate: true,
            message: `El paciente ya tiene una cita activa de tipo '${appointmentType}'. Complétala o cancélala antes de crear otra.`
        };
    }

    return { hasDuplicate: false };
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
    clinic_id: string;
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado. Perfil de profesional no encontrado.' };
    }

    if (!formData.clinic_id) {
        return { error: 'Clínica no especificada.' };
    }

    const appointmentData = {
        ...formData,
        practitioner_id: practitionerId,
        status: 'proposed' as AppointmentStatus,
    };

    const validation = appointmentSchema.safeParse(appointmentData);

    if (!validation.success) {
        return { error: z.flattenError(validation.error).fieldErrors };
    }

    // Checking business rules for times
    const timeVal = validateAppointmentTimes(validation.data.start_time, validation.data.end_time);
    if (!timeVal.isValid) {
        return { error: timeVal.error };
    }

    // Checking for overlap
    const overlapResult = await checkOverlap(
        supabase,
        practitionerId,
        validation.data.clinic_id!,
        validation.data.start_time,
        validation.data.end_time
    );

    if (overlapResult.hasOverlap) {
        return { error: overlapResult.message };
    }

    // Checking for duplicate active appointment of the same type
    if (validation.data.appointment_type) {
        const duplicateResult = await checkDuplicateType(
            supabase,
            practitionerId,
            validation.data.clinic_id!,
            validation.data.patient_id,
            validation.data.appointment_type
        );

        if (duplicateResult.hasDuplicate) {
            return { error: duplicateResult.message };
        }
    }

    const { data, error } = await supabase
        .from('appointments')
        .insert([{
            patient_id: validation.data.patient_id,
            practitioner_id: validation.data.practitioner_id,
            clinic_id: validation.data.clinic_id,
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
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    // First check what is the current status — scoped to this practitioner
    const { data: currentAppt, error: checkError } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', id)
        .eq('practitioner_id', practitionerId)
        .single();

    if (checkError || !currentAppt) {
        return { error: 'Cita no encontrada o sin permisos.' };
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
        .eq('practitioner_id', practitionerId)
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
 * cancelAppointment(id, reason)
 * Guard auth, update status='cancelled', save reason in description & cancellation_reason
 * verify ownership.
 */
export async function cancelAppointment(id: string, reason: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    // Check current status — scoped to this practitioner
    const { data: currentAppt } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', id)
        .eq('practitioner_id', practitionerId)
        .single();

    if (!currentAppt) {
        return { error: 'Cita no encontrada o sin permisos.' };
    }

    const currentStatus = (currentAppt?.status as AppointmentStatus) || 'proposed';
    const validation = validateTransition(currentStatus, 'cancelled');
    if (!validation.isValid) {
        return { error: validation.error };
    }

    if (!reason || reason.trim().length < 3) {
        return { error: 'Se requiere un motivo válido para cancelar (mínimo 3 caracteres).' };
    }

    const { data, error } = await supabase
        .from('appointments')
        .update({
            status: 'cancelled',
            description: `Cancelación: ${reason}`,
        })
        .eq('id', id)
        .eq('practitioner_id', practitionerId)
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
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
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
        .update({ 
            status: 'arrived',
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('practitioner_id', practitionerId)
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
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
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
        .eq('practitioner_id', practitionerId)
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
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

// Check current status
    const { data: currentAppt } = await supabase
        .from('appointments')
        .select('status, clinic_id, end_time')
        .eq('id', id)
        .single();

    const currentStatus = (currentAppt?.status as AppointmentStatus) || 'proposed';
    const validation = validateTransition(currentStatus, 'noshow');
    if (!validation.isValid) {
        return { error: validation.error };
    }

    if (currentAppt?.end_time) {
        const { isEligibleForNoShow } = await import('@/lib/appointments/appointment-rules');
        if (!isEligibleForNoShow(currentAppt.end_time)) {
             return { error: 'El tiempo de la cita no ha finalizado. No se puede marcar como inasistencia aún.' };
        }
    }

    const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'noshow' })
        .eq('id', id)
        .eq('practitioner_id', practitionerId)
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
    clinicId?: string;  // Filtrar por clínica
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { data: [] };

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
        .eq('practitioner_id', practitionerId);

    if (filters?.clinicId) {
        query = query.eq('clinic_id', filters.clinicId);
    }

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
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    // Check current status
    const { data: currentAppt } = await supabase
        .from('appointments')
        .select('status, clinic_id')
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
        practitionerId,
        currentAppt?.clinic_id || '',
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
        .eq('practitioner_id', practitionerId)
        .eq('clinic_id', currentAppt?.clinic_id || '')
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
 * Marca como 'noshow' citas 'booked' o 'arrived' que tengan más de 24 horas
 * desde su hora de finalización sin marcar asistencia.
 */
export async function cleanupExpiredAppointments() {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    const now = new Date().toISOString();

    // Calcular el umbral de 24 horas en el pasado
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Cancelar citas pendientes en el pasado
    const { data: cancelledData, error: cancelError } = await supabase
        .from('appointments')
        .update({
            status: 'cancelled',
            description: 'Cancelación automática: La cita expiró sin ser confirmada o atendida.',
        })
        .eq('practitioner_id', practitionerId)
        .in('status', ['proposed', 'pending'])
        .lt('start_time', now)
        .select();

    if (cancelError) {
        console.error('Error in cleanupExpiredAppointments (cancel):', cancelError);
        return { error: cancelError.message };
    }

    // 2. Marcar como No-Show citas 'booked' o 'arrived' que pasaron más de 24h desde su finalización
    const { data: noShowData, error: noShowError } = await supabase
        .from('appointments')
        .update({
            status: 'noshow'
        })
        .eq('practitioner_id', practitionerId)
        .in('status', ['booked', 'arrived'])
        .lt('end_time', twentyFourHoursAgo)
        .select();

    if (noShowError) {
        console.error('Error in cleanupExpiredAppointments (noshow):', noShowError);
        return { error: noShowError.message };
    }

    const totalModified = (cancelledData?.length || 0) + (noShowData?.length || 0);

    if (totalModified > 0) {
        revalidatePath('/appointments');
    }

    return { count: totalModified };
}

/**
 * startConsultationFromAppointment(appointmentId)
 * 1. Valida que la cita esté en estado 'arrived' o 'booked'.
 * 2. Verifica que la cita no tenga horario pasado (obliga a reprogramar).
 * 3. Cambia el estado de la cita a 'fulfilled'.
 * 4. Crea un Encounter en estado 'in-progress' vinculado.
 * 5. Retorna el ID del encounter para redirección.
 */
export async function startConsultationFromAppointment(appointmentId: string, delayReason?: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    // 1. Validar cita — scoped to this practitioner
    const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .eq('practitioner_id', practitionerId)
        .single();

    if (apptError || !appt) return { error: 'Cita no encontrada o sin permisos.' };

    if (!appt.clinic_id) return { error: 'La cita no tiene clínica asociada.' };

    const currentStatus = (appt.status as AppointmentStatus) || 'proposed';
    if (!['booked', 'arrived'].includes(currentStatus)) {
        return { error: `No se puede iniciar consulta desde una cita en estado '${currentStatus}'. Solo desde 'Confirmada' o 'En Espera'.` };
    }

    // 2. Validar que la cita no tenga horario pasado
    const { isPastAppointment } = await import('@/lib/appointments/appointment-rules');
    if (isPastAppointment(appt.start_time)) {
        return {
            error: 'No se puede iniciar consulta para una cita con horario pasado. Por favor, reprograme la cita antes de continuar.'
        };
    }

    // 3. Verificar idempotencia: si ya existe un encuentro para esta cita, retornarlo
    const { data: existingEncounter } = await supabase
        .from('encounters')
        .select('id, patient_id')
        .eq('appointment_id', appointmentId)
        .eq('practitioner_id', practitionerId)
        .not('status', 'eq', 'cancelled')
        .maybeSingle();

    if (existingEncounter) {
        revalidatePath('/appointments');
        return {
            success: true,
            encounterId: existingEncounter.id,
            patientId: existingEncounter.patient_id,
        };
    }

    // 4. Marcar cita como cumplida (fulfilled) - y agregar motivo de retraso si es necesario
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = { status: 'fulfilled' };
    if (delayReason) {
        updatePayload.description = `[Retraso de Consulta: ${delayReason}]` + (appt.description ? `\n\nMotivo original: ${appt.description}` : '');
    }

    const { error: updateError } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', appointmentId)
        .eq('practitioner_id', practitionerId);

    if (updateError) return { error: 'Error al actualizar estado de la cita.' };

    // 5. Crear encuentro (Encounter)
    const { createEncounter } = await import('@/actions/encounters');

    const encounterResult = await createEncounter({
        patient_id: appt.patient_id,
        encounter_class: 'AMB',
        start_time: new Date().toISOString(),
        appointment_id: appointmentId,
        status: 'in-progress',
        clinic_id: appt.clinic_id
    });

    if (encounterResult.error) {
        // Rollback: revertir la cita al estado anterior si el encuentro no pudo crearse
        await supabase
            .from('appointments')
            .update({ status: currentStatus })
            .eq('id', appointmentId)
            .eq('practitioner_id', practitionerId);
        return { error: typeof encounterResult.error === 'string' ? encounterResult.error : 'Error al crear el encuentro clínico.' };
    }

    revalidatePath('/appointments');
    revalidatePath('/history');

    return {
        success: true,
        encounterId: encounterResult.data?.encounter?.id,
        patientId: appt.patient_id,
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
    clinic_id: string;
}) {
    const { patient_id: patientId, description, appointment_type: appointmentType, clinic_id: clinicId } = payload;
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    if (!clinicId) return { error: 'Clínica no especificada.' };

    const now = new Date();
    // Round up to the nearest 15-minute interval to satisfy DB trigger and avoid "past time" error
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil((minutes + 1) / 15) * 15;
    now.setMinutes(roundedMinutes, 0, 0);

    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + 15 * 60000).toISOString();

    // Calcular la posición en cola basada en el día local de Venezuela
    const { nowInVE, toISODate } = await import('@/lib/date-utils');
    const localToday = toISODate(nowInVE());
    const startOfLocalDay = `${localToday}T00:00:00-04:00`;

    // Checking for duplicate active appointment of the same type
    if (appointmentType) {
        const duplicateResult = await checkDuplicateType(
            supabase,
            practitionerId,
            clinicId,
            patientId,
            appointmentType
        );

        if (duplicateResult.hasDuplicate) {
            return { error: duplicateResult.message };
        }
    }

    const { data: lastInQueue } = await supabase
        .from('appointments')
        .select('queue_position')
        .eq('practitioner_id', practitionerId)
        .eq('clinic_id', clinicId)
        .gte('start_time', startOfLocalDay)
        .order('queue_position', { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextPosition = (lastInQueue?.queue_position || 0) + 1;
    const { data, error } = await supabase
        .from('appointments')
        .insert([{
            patient_id: patientId,
            practitioner_id: practitionerId,
            clinic_id: clinicId,
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
 * updateQueuePosition(id, newPosition)
 */
export async function updateQueuePosition(id: string, newPosition: number) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    const { error } = await supabase
        .from('appointments')
        .update({ queue_position: newPosition })
        .eq('id', id)
        .eq('practitioner_id', practitionerId);

    if (error) {
        console.error('Error in updateQueuePosition:', error);
        return { error: error.message };
    }

    revalidatePath('/appointments');
    return { success: true };
}

/**
 * swapQueuePositions(id1, pos1, id2, pos2)
 * Swaps queue positions between two appointments atomically.
 * Uses a temporary position to avoid unique constraint violations.
 */
export async function swapQueuePositions(
    id1: string, pos1: number,
    id2: string, pos2: number
) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    const TEMP_POSITION = -1;

    // Step 1: Move id1 to a temporary position to avoid conflicts
    const { error: e1 } = await supabase
        .from('appointments')
        .update({ queue_position: TEMP_POSITION })
        .eq('id', id1)
        .eq('practitioner_id', practitionerId);

    if (e1) return { error: e1.message };

    // Step 2: Move id2 to pos1
    const { error: e2 } = await supabase
        .from('appointments')
        .update({ queue_position: pos1 })
        .eq('id', id2)
        .eq('practitioner_id', practitionerId);

    if (e2) {
        // Partial rollback: restore id1
        await supabase.from('appointments').update({ queue_position: pos1 }).eq('id', id1).eq('practitioner_id', practitionerId);
        return { error: e2.message };
    }

    // Step 3: Move id1 (from temp) to pos2
    const { error: e3 } = await supabase
        .from('appointments')
        .update({ queue_position: pos2 })
        .eq('id', id1)
        .eq('practitioner_id', practitionerId);

    if (e3) {
        // Partial rollback: restore both
        await supabase.from('appointments').update({ queue_position: pos1 }).eq('id', id1).eq('practitioner_id', practitionerId);
        await supabase.from('appointments').update({ queue_position: pos2 }).eq('id', id2).eq('practitioner_id', practitionerId);
        return { error: e3.message };
    }

    revalidatePath('/appointments');
    return { success: true };
}

/**
 * Retorna las citas del día con datos del paciente.
 * Solo citas del practitioner autenticado, ordenadas por start_time.
 * Excluye estados terminales: fulfilled, cancelled, noshow.
 */
export async function getTodayAppointmentsWithPatients(clinicId?: string): Promise<Array<{
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  patient_id: string;
  patient_name: string;
  appointment_type: string | null;
}>> {
  const supabase = await createServerSupabaseClient();
  const practitionerId = await getCurrentPractitionerId(supabase);
  if (!practitionerId) return [];

  // Rango del día en Venezuela (UTC-4)
  const now = new Date();
  const offset = -4 * 60;
  const veDate = new Date(now.getTime() + (offset - now.getTimezoneOffset()) * 60000);
  const dateStr = veDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
  const dayStart = `${dateStr}T00:00:00-04:00`;
  const dayEnd   = `${dateStr}T23:59:59-04:00`;

  let query = supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      patient_id,
      appointment_type,
      clinic_id,
      patients!inner (
        name_given,
        name_family
      )
    `)
    .eq('practitioner_id', practitionerId)
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .not('status', 'in', '("fulfilled","cancelled","noshow")')
    .order('start_time', { ascending: true });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row) => {
    const r = row as {
      id: string;
      start_time: string;
      end_time: string;
      status: string;
      patient_id: string;
      appointment_type: string | null;
      patients: { name_given: string[] | null; name_family: string | null } | null;
    };
    return {
      id: r.id,
      start_time: r.start_time,
      end_time: r.end_time,
      status: r.status ?? 'proposed',
      patient_id: r.patient_id,
      appointment_type: r.appointment_type ?? null,
      patient_name: [
        r.patients?.name_given?.join(' ') ?? '',
        r.patients?.name_family ?? '',
      ].join(' ').trim() || 'Paciente',
    };
  });
}
