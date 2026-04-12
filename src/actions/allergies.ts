'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { allergySchema } from '@/lib/schemas/allergy.schema';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';

/**
 * createAllergy(formData)
 * Guard auth, validate with allergySchema, verify patient ownership,
 * insert with clinical_status='active'.
 */
export async function createAllergy(formData: {
    patient_id: string;
    code: string;
    code_display: string;
    allergy_type?: 'allergy' | 'intolerance';
    category: ('food' | 'medication' | 'environment' | 'biologic')[];
    criticality?: 'low' | 'high' | 'unable-to-assess';
    note?: string;
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado. Perfil de profesional no encontrado.' };
    }

    // 1. Verify patient ownership via practitioner_id
    const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('id', formData.patient_id)
        .eq('practitioner_id', practitionerId)
        .single();

    if (patientError || !patient) {
        return { error: 'Paciente no encontrado o no autorizado para este profesional.' };
    }

    // 2. Prepare and validate data
    const inputData = {
        ...formData,
        clinical_status: 'active' as const,
    };

    const validation = allergySchema.safeParse(inputData);

    if (!validation.success) {
        return { error: z.flattenError(validation.error).fieldErrors };
    }

    // 3. Insert into allergy_intolerances
    const { data, error } = await supabase
        .from('allergy_intolerances')
        .insert([{
            patient_id: validation.data.patient_id,
            clinical_status: validation.data.clinical_status,
            allergy_type: validation.data.allergy_type,
            category: validation.data.category, // pg array handling
            criticality: validation.data.criticality,
            code: validation.data.code,
            code_display: validation.data.code_display,
            fhir_id: crypto.randomUUID(),
        }])
        .select()
        .single();

    if (error) {
        console.error('Error in createAllergy:', error);
        return { error: error.message };
    }

    revalidatePath(`/patients/${validation.data.patient_id}`);
    return { data };
}

/**
 * updateAllergyStatus(id, clinical_status)
 * Transition between active/inactive/resolved.
 * Verify ownership via JOINS with patients-practitioner_id.
 */
export async function updateAllergyStatus(id: string, clinical_status: 'active' | 'inactive' | 'resolved') {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // 1. Explicit ownership check via patients join
    const { data: check, error: checkError } = await supabase
        .from('allergy_intolerances')
        .select('id, patient_id, patients!inner(practitioner_id)')
        .eq('id', id)
        .eq('patients.practitioner_id', user.id)
        .single();

    if (checkError || !check) {
        return { error: 'Alergia no encontrada o no autorizada.' };
    }

    // 2. Update status
    const { data, error } = await supabase
        .from('allergy_intolerances')
        .update({ clinical_status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error in updateAllergyStatus:', error);
        return { error: error.message };
    }

    revalidatePath(`/patients/${check.patient_id}`);
    return { data };
}

/**
 * getAllergiesByPatient(patientId)
 * Query by patient_id, verify ownership join, order by created_at DESC.
 */
export async function getAllergiesByPatient(patientId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('allergy_intolerances')
        .select('*, patients!inner(practitioner_id)')
        .eq('patient_id', patientId)
        .eq('patients.practitioner_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error in getAllergiesByPatient:', error);
        return { error: error.message };
    }

    return { data };
}
