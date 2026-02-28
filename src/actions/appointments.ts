'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { appointmentSchema } from '@/lib/schemas/appointment.schema';
import { AppointmentStatus } from '@/lib/fhir/types';

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

    const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'booked' })
        .eq('id', id)
        .eq('practitioner_id', user.id)
        .in('status', ['proposed', 'pending'])
        .select()
        .single();

    if (error) {
        console.error('Error in confirmAppointment:', error);
        return {
            error: error.code === 'PGRST116'
                ? 'No se puede confirmar la cita. Solo se permiten citas en estado "proposed" o "pending".'
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

    // Capture current description if we want to append, but task says "save reason in description"
    const { data, error } = await supabase
        .from('appointments')
        .update({
            status: 'cancelled',
            description: reason ? `Cancelación: ${reason}` : 'Cancelada sin motivo especificado'
        })
        .eq('id', id)
        .eq('practitioner_id', user.id)
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

    const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'arrived' })
        .eq('id', id)
        .eq('practitioner_id', user.id)
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

    const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'fulfilled' })
        .eq('id', id)
        .eq('practitioner_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error in fulfillAppointment:', error);
        return { error: error.message };
    }

    revalidatePath('/appointments');
    return { data };
}
