'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { conditionSchema } from '@/lib/schemas/condition.schema';

/**
 * createCondition(data)
 * Guard auth, validate with conditionSchema, verify patient ownership, 
 * insert with clinical_status='active', verification_status='confirmed'.
 */
export async function createCondition(formData: {
    patient_id: string;
    code: string;
    code_display: string;
    onset_date?: string;
    note?: string;
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado. Sesión no encontrada.' };
    }

    // 1. Verify patient ownership (practitioner_id)
    const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('id', formData.patient_id)
        .eq('practitioner_id', user.id)
        .single();

    if (patientError || !patient) {
        return { error: 'Paciente no encontrado o no autorizado.' };
    }

    // 2. Prepare and validate data
    const conditionData = {
        ...formData,
        clinical_status: 'active',
        verification_status: 'confirmed',
    };

    const validation = conditionSchema.safeParse(conditionData);

    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors };
    }

    // 3. Insert record
    const { data, error } = await supabase
        .from('conditions')
        .insert([{
            patient_id: validation.data.patient_id,
            clinical_status: validation.data.clinical_status,
            verification_status: validation.data.verification_status,
            code: validation.data.code,
            code_display: validation.data.code_display,
            onset_date: validation.data.onset_date,
            note: validation.data.note,
            fhir_id: crypto.randomUUID(),
        }])
        .select()
        .single();

    if (error) {
        console.error('Error in createCondition:', error);
        return { error: error.message };
    }

    revalidatePath(`/patients/${validation.data.patient_id}`);
    return { data };
}

/**
 * updateConditionStatus(id, clinical_status)
 * Verify ownership via patients join, update status.
 */
export async function updateConditionStatus(id: string, clinical_status: 'active' | 'inactive' | 'resolved') {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // Double check ownership via condition -> patient -> practitioner
    // Since RLS should handle it, we also do an explicit check here as requested
    const { data: check, error: checkError } = await supabase
        .from('conditions')
        .select('id, patient_id, patients!inner(practitioner_id)')
        .eq('id', id)
        .eq('patients.practitioner_id', user.id)
        .single();

    if (checkError || !check) {
        return { error: 'Condición no encontrada o no autorizada para este profesional.' };
    }

    const { data, error } = await supabase
        .from('conditions')
        .update({ clinical_status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error in updateConditionStatus:', error);
        return { error: error.message };
    }

    revalidatePath(`/patients/${check.patient_id}`);
    return { data };
}

/**
 * getConditionsByPatient(patientId)
 * Query by patient_id, join with patients for ownership, order by created_at DESC.
 */
export async function getConditionsByPatient(patientId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('conditions')
        .select('*, patients!inner(practitioner_id)')
        .eq('patient_id', patientId)
        .eq('patients.practitioner_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error in getConditionsByPatient:', error);
        return { error: error.message };
    }

    return { data };
}
