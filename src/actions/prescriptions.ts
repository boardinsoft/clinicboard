'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prescriptionSchema } from '@/lib/schemas/prescription.schema';
import { MedicationRequestStatus } from '@/lib/fhir/types';

/**
 * createPrescription(data)
 * Guard auth, validate with prescriptionSchema,
 * status='draft', intent='order', prescriber_id=user.id, authored_on=now().
 * revalidatePath('/prescriptions').
 */
export async function createPrescription(formData: {
    patient_id: string;
    encounter_id?: string;
    medication_code: string;
    medication_display: string;
    dosage_instruction: string[];
    note?: string;
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado. Sesión no encontrada.' };
    }

    // Verify the patient belongs to this practitioner
    const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('id', formData.patient_id)
        .eq('practitioner_id', user.id)
        .single();

    if (!patient) {
        return { error: 'Paciente no encontrado o sin permisos.' };
    }

    const prescriptionData = {
        ...formData,
        prescriber_id: user.id,
        status: 'draft' as MedicationRequestStatus,
    };

    const validation = prescriptionSchema.safeParse(prescriptionData);

    if (!validation.success) {
        return { error: z.flattenError(validation.error).fieldErrors };
    }

    const { data, error } = await supabase
        .from('medication_requests')
        .insert([{
            patient_id: validation.data.patient_id,
            encounter_id: formData.encounter_id,
            prescriber_id: validation.data.prescriber_id,
            medication_code: validation.data.medication_code,
            medication_display: validation.data.medication_display,
            status: validation.data.status,
            intent: 'order',
            dosage_instruction: validation.data.dosage_instruction,
            authored_on: new Date().toISOString(),
            note: validation.data.note,
            fhir_id: crypto.randomUUID(),
        }])
        .select()
        .single();

    if (error) {
        console.error('Error in createPrescription:', error);
        return { error: error.message };
    }

    revalidatePath('/prescriptions');
    return { data };
}

/**
 * activatePrescription(id)
 * Transition from 'draft' to 'active'.
 */
export async function activatePrescription(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('medication_requests')
        .update({ status: 'active' as MedicationRequestStatus })
        .eq('id', id)
        .eq('prescriber_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error in activatePrescription:', error);
        return { error: error.message };
    }

    revalidatePath('/prescriptions');
    return { data };
}

/**
 * cancelPrescription(id)
 * Transition to 'cancelled'.
 */
export async function cancelPrescription(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('medication_requests')
        .update({ status: 'cancelled' as MedicationRequestStatus })
        .eq('id', id)
        .eq('prescriber_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error in cancelPrescription:', error);
        return { error: error.message };
    }

    revalidatePath('/prescriptions');
    return { data };
}

/**
 * completePrescription(id)
 * Transition to 'completed'.
 */
export async function completePrescription(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('medication_requests')
        .update({ status: 'completed' as MedicationRequestStatus })
        .eq('id', id)
        .eq('prescriber_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error in completePrescription:', error);
        return { error: error.message };
    }

    revalidatePath('/prescriptions');
    return { data };
}

/**
 * getPrescriptionsByPatient(patientId)
 * Query by patient_id, verify ownership, order by authored_on DESC.
 */
export async function getPrescriptionsByPatient(patientId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('medication_requests')
        .select('*')
        .eq('patient_id', patientId)
        .eq('prescriber_id', user.id)
        .order('authored_on', { ascending: false });

    if (error) {
        console.error('Error in getPrescriptionsByPatient:', error);
        return { error: error.message };
    }

    return { data };
}
