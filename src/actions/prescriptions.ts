'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prescriptionSchema, createPrescriptionFormSchema } from '@/lib/schemas/prescription.schema';
import { MedicationRequestStatus } from '@/lib/fhir/types';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';
import type { MedicationItemInput } from '@/lib/schemas/prescription.schema';

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
    clinic_id: string;
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado. Sesión no encontrada.' };
    }

    if (!formData.clinic_id) {
        return { error: 'Clínica no especificada.' };
    }

    // Verify the patient belongs to this practitioner + clinic
    const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('id', formData.patient_id)
        .eq('practitioner_id', practitionerId)
        .eq('clinic_id', formData.clinic_id)
        .single();

    if (!patient) {
        return { error: 'Paciente no encontrado o sin permisos.' };
    }

    const prescriptionData = {
        ...formData,
        prescriber_id: practitionerId,
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
            clinic_id: validation.data.clinic_id,
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
 * createPrescriptions(formData)
 * Creates multiple medication_requests rows (one per medication item).
 * Validates encounter belongs to practitioner and is in-progress.
 * Returns array of created prescriptions.
 */
export async function createPrescriptions(formData: {
    encounter_id: string;
    patient_id: string;
    clinic_id: string;
    items: MedicationItemInput[];
    notes?: string;
    intent?: string;
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado. Sesión no encontrada.' };
    }

    const validation = createPrescriptionFormSchema.safeParse({
        encounter_id: formData.encounter_id,
        patient_id: formData.patient_id,
        clinic_id: formData.clinic_id,
        items: formData.items,
        notes: formData.notes,
        intent: formData.intent || 'order',
    });

    if (!validation.success) {
        return { error: z.flattenError(validation.error).fieldErrors };
    }

    const { data: encounter } = await supabase
        .from('encounters')
        .select('id, status, practitioner_id')
        .eq('id', formData.encounter_id)
        .single();

    if (!encounter) {
        return { error: 'Encuentro no encontrado.' };
    }

    if (encounter.practitioner_id !== practitionerId) {
        return { error: 'No tienes permisos sobre este encuentro.' };
    }

    if (encounter.status !== 'in-progress') {
        return { error: 'Solo se pueden crear recetas desde encuentros en curso.' };
    }

    const now = new Date().toISOString();
    const prescriptionsToInsert = formData.items.map((item) => {
        const dosage_instruction = [
            item.dose,
            item.frequency,
            `Vía: ${item.route}`,
            `Duración: ${item.duration_value} ${item.duration_unit}`,
            item.indications ? `Indicaciones: ${item.indications}` : '',
        ].filter(Boolean);

        return {
            patient_id: formData.patient_id,
            encounter_id: formData.encounter_id,
            prescriber_id: practitionerId,
            clinic_id: formData.clinic_id,
            medication_code: item.medication_code,
            medication_display: item.medication_display,
            status: 'draft' as MedicationRequestStatus,
            intent: formData.intent || 'order',
            dosage_instruction,
            authored_on: now,
            note: formData.notes || null,
            fhir_id: crypto.randomUUID(),
        };
    });

    const { data, error } = await supabase
        .from('medication_requests')
        .insert(prescriptionsToInsert)
        .select();

    if (error) {
        console.error('Error in createPrescriptions:', error);
        return { error: error.message };
    }

    revalidatePath('/prescriptions');
    revalidatePath(`/history`);

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
export async function getPrescriptionsByPatient(patientId: string, clinicId?: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    let query = supabase
        .from('medication_requests')
        .select('*')
        .eq('patient_id', patientId)
        .eq('prescriber_id', practitionerId)
        .order('authored_on', { ascending: false });

    if (clinicId) {
        query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error in getPrescriptionsByPatient:', error);
        return { error: error.message };
    }

    return { data };
}

/**
 * getPrescriptionsForTable(clinicId?)
 * Fetch all prescriptions for the table view with patient and prescriber joins.
 * Orders by authored_on DESC.
 */
export async function getPrescriptionsForTable(clinicId?: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    let query = supabase
        .from('medication_requests')
        .select(`
            *,
            patient:patients(id, name_given, name_family, birth_date),
            prescriber:practitioners(name_given, name_family)
        `)
        .eq('prescriber_id', practitionerId)
        .order('authored_on', { ascending: false });

    if (clinicId) {
        query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error in getPrescriptionsForTable:', error);
        return { error: error.message };
    }

    return { data };
}

/**
 * searchMedications(query, limit?)
 * Search medications by name or generic_name (case-insensitive ILIKE).
 * Returns up to limit results (default 20).
 */
export async function searchMedications(query: string, limit = 20) {
    const supabase = await createServerSupabaseClient();

    if (!query || query.trim().length < 2) {
        return { data: [] };
    }

    const searchTerm = `%${query.trim()}%`;

    const { data, error } = await supabase
        .from('medications')
        .select('id, code, name, generic_name, pharmaceutical_form, concentration')
        .or(`name.ilike.${searchTerm},generic_name.ilike.${searchTerm}`)
        .limit(limit);

    if (error) {
        console.error('Error in searchMedications:', error);
        return { error: error.message };
    }

    return { data };
}
