'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { patientSchema } from '@/lib/schemas/patient.schema';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';
import type { Json } from '@/types/database.types';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function validateAndParsePatient(formData: Parameters<typeof createPatient>[0]) {
    return patientSchema.safeParse({
        name_given: formData.givenNames,
        name_family: formData.familyName,
        gender: formData.gender,
        birth_date: formData.birthDate || '',
        documentId: formData.documentId,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
    });
}

function buildTelecomArray(phone: string | undefined, email: string) {
    return [
        { system: 'phone', value: phone, use: 'mobile' },
        { system: 'email', value: email, use: 'home' },
    ];
}

export async function createPatient(formData: {
    givenNames: string[];
    familyName: string;
    gender: string;
    birthDate: string | null;
    documentId: string;
    phone: string;
    email: string;
    address: string;
}) {
    // 1. Validate data using the schema
    const validation = validateAndParsePatient(formData);

    if (!validation.success) {
        return { error: z.flattenError(validation.error).fieldErrors };
    }

    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado. Perfil de profesional no encontrado.' };
    }

    const { data, error } = await supabase
        .from('patients')
        .insert([{
            name_family: validation.data.name_family,
            name_given: validation.data.name_given,
            gender: validation.data.gender,
            birth_date: validation.data.birth_date || null,
            identifiers: validation.data.documentId ? [{ system: 'venezuela-ci', value: validation.data.documentId }] : [],
            telecom: buildTelecomArray(validation.data.phone, validation.data.email),
            address: validation.data.address ? [{ text: validation.data.address }] : [],
            active: true,
            practitioner_id: practitionerId
        }])
        .select()
        .single();

    if (error) {
        console.error('Error in createPatient:', error);
        return { error: error.message };
    }

    revalidatePath('/patients');
    return { data };
}

export async function updatePatient(id: string, formData: {
    givenNames: string[];
    familyName: string;
    gender: string;
    birthDate: string | null;
    documentId: string;
    phone: string;
    email: string;
    address: string;
}) {
    // 1. Validate data using the schema
    const validation = validateAndParsePatient(formData);

    if (!validation.success) {
        return { error: z.flattenError(validation.error).fieldErrors };
    }

    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('patients')
        .update({
            name_family: validation.data.name_family,
            name_given: validation.data.name_given,
            gender: validation.data.gender,
            birth_date: validation.data.birth_date || null,
            identifiers: validation.data.documentId ? [{ system: 'venezuela-ci', value: validation.data.documentId }] : [],
            telecom: buildTelecomArray(validation.data.phone, validation.data.email),
            address: validation.data.address ? [{ text: validation.data.address }] : []
        })
        .eq('id', id)
        .eq('practitioner_id', practitionerId)
        .select()
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error in updatePatient:', error);
        return { error: error.message };
    }

    if (!data) {
        return { error: 'Paciente no encontrado o sin permisos' };
    }

    revalidatePath('/patients');
    revalidatePath(`/patients/${id}`);
    return { data };
}

export async function reactivatePatient(id: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    const { data, error } = await supabase
        .from('patients')
        .update({ active: true })
        .eq('id', id)
        .eq('practitioner_id', practitionerId)
        .select('id')
        .single();

    if (error || !data) {
        console.error('Error in reactivatePatient:', error);
        return { error: error?.message || 'Paciente no encontrado o sin permisos' };
    }

    revalidatePath('/patients');
    revalidatePath(`/patients/${id}`);
    return { data };
}

export async function searchPatients({
    query,
    clinicId,
    page = 1,
    pageSize = 10,
}: {
    query: string;
    clinicId?: string;
    page?: number;
    pageSize?: number;
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { patients: [], total: 0 };

    // No query or too short - return active patients list
    if (!query || query.length < 2) {
        let baseQuery = supabase
            .from('patients')
            .select('*', { count: 'exact' })
            .eq('practitioner_id', practitionerId)
            .eq('active', true)
            .order('name_family', { ascending: true });

        if (clinicId) {
            baseQuery = baseQuery.eq('clinic_id', clinicId);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await baseQuery.range(from, to);

        if (error) {
            console.error('Error fetching patients:', error);
            return { patients: [], total: 0 };
        }
        return { patients: data || [], total: count || 0 };
    }

    // Search with RPC for better performance on name/identifier search
    const { data, error } = await supabase.rpc('search_patients_v2', {
        search_term: query,
        p_id: practitionerId
    });

    if (error) {
        console.error('Error in search_patients_v2 RPC:', error);
        return { patients: [], total: 0 };
    }

    const patients = data || [];
    // RPC doesn't support pagination, return all matches with total
    return { patients, total: patients.length };
}

export async function getPatients(queryText?: string, clinicId?: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { data: [] };

    if (!queryText || queryText.length < 2) {
        // Return standard list if no query
        let query = supabase
            .from('patients')
            .select('*')
            .eq('practitioner_id', practitionerId)
            .eq('active', true)
            .order('name_family', { ascending: true })
            .limit(20);

        if (clinicId) {
            query = query.eq('clinic_id', clinicId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching patients:', error);
            return { data: [] };
        }
        return { data: data || [] };
    }

    // Use the robust RPC for searching across names and identifiers
    const { data, error } = await supabase.rpc('search_patients_v2', {
        search_term: queryText,
        p_id: practitionerId
    });

    if (error) {
        console.error('Error in search_patients_v2 RPC:', error);
        return { data: [] };
    }

    return { data: data || [] };
}

export async function getPatientClinicalData(patientId: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { conditions: [], allergies: [] };

    // Verify the patient belongs to this practitioner before exposing clinical data
    const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .eq('practitioner_id', practitionerId)
        .single();

    if (!patient) return { conditions: [], allergies: [] };

    const [conditionsResult, allergiesResult] = await Promise.all([
        supabase.from('conditions').select('*').eq('patient_id', patientId),
        supabase.from('allergy_intolerances').select('*').eq('patient_id', patientId)
    ]);

    return {
        conditions: conditionsResult.data || [],
        allergies: allergiesResult.data || []
    };
}

export async function updatePatientAnamnesis(patientId: string, data: {
    familyHistory?: string;
    pastConditions?: string;
    knownAllergies?: string;
    surgicalHistory?: string;
    habitsHistory?: string;
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    // Format logical blocks for JSON fields
    const family_history = data.familyHistory ? [{ text: data.familyHistory }] : null;
    const personal_history = [];
    if (data.pastConditions) personal_history.push({ text: data.pastConditions, label: 'Patológicos' });
    if (data.surgicalHistory) personal_history.push({ text: data.surgicalHistory, label: 'Quirúrgico' });

    const habits = data.habitsHistory ? [{ text: data.habitsHistory }] : null;
    const extensions = data.knownAllergies ? [{ url: 'knownAllergies', valueString: data.knownAllergies }] : null;

    const { error } = await supabase
        .from('patients')
        .update({
            family_history: family_history as Json,
            personal_history: personal_history.length > 0 ? personal_history as Json : null,
            habits: habits as Json,
            extensions: extensions as Json
        })
        .eq('id', patientId)
        .eq('practitioner_id', practitionerId);

    if (error) {
        console.error('Error updating patient anamnesis:', error);
        return { error: error.message };
    }

    revalidatePath(`/history`);
    revalidatePath(`/patients/${patientId}`);
    return { success: true };
}

export async function archivePatient(id: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    const { data, error } = await supabase
        .from('patients')
        .update({ active: false })
        .eq('id', id)
        .eq('practitioner_id', practitionerId)
        .select('id')
        .single();

    if (error || !data) {
        console.error('Error in archivePatient:', error);
        return { error: error?.message || 'Paciente no encontrado o sin permisos' };
    }

    revalidatePath('/patients');
    revalidatePath(`/patients/${id}`);
    return { data };
}

/**
 * getPatientFullHistory(patientId)
 * Aggregates all clinical data for a patient into a single object.
 * Used by the FHIR export feature.
 */
export async function getPatientFullHistory(patientId: string, clinicId?: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    // Verify ownership
    let patientQuery = supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .eq('practitioner_id', practitionerId);

    if (clinicId) {
        patientQuery = patientQuery.eq('clinic_id', clinicId);
    }

    const { data: patient } = await patientQuery.single();

    if (!patient) return { error: 'Paciente no encontrado o sin permisos' };

    // Fetch all related clinical data in parallel
    let encountersQuery = supabase
        .from('encounters')
        .select(`
            *,
            practitioner:practitioners(name_given, name_family, specialty)
        `)
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false });

    let appointmentsQuery = supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .eq('practitioner_id', practitionerId)
        .order('start_time', { ascending: false });

    if (clinicId) {
        encountersQuery = encountersQuery.eq('clinic_id', clinicId);
        appointmentsQuery = appointmentsQuery.eq('clinic_id', clinicId);
    }

    const [encountersResult, conditionsResult, allergiesResult, prescriptionsResult, appointmentsResult, practitionerResult] = await Promise.all([
        encountersQuery,
        supabase
            .from('conditions')
            .select('*')
            .eq('patient_id', patientId)
            .order('onset_date', { ascending: false }),

        supabase
            .from('allergy_intolerances')
            .select('*')
            .eq('patient_id', patientId),

        supabase
            .from('medication_requests')
            .select('*')
            .eq('patient_id', patientId)
            .eq('prescriber_id', practitionerId)
            .order('authored_on', { ascending: false }),

        appointmentsQuery,

        supabase
            .from('practitioners')
            .select('*')
            .eq('id', practitionerId)
            .single(),
    ]);

    if (encountersResult.error) console.error('Error fetching encounters:', encountersResult.error);
    if (conditionsResult.error) console.error('Error fetching conditions:', conditionsResult.error);
    if (allergiesResult.error) console.error('Error fetching allergies:', allergiesResult.error);
    if (prescriptionsResult.error) console.error('Error fetching prescriptions:', prescriptionsResult.error);
    if (appointmentsResult.error) console.error('Error fetching appointments:', appointmentsResult.error);

    return {
        data: {
            patient,
            practitioner: practitionerResult.data,
            encounters: encountersResult.data || [],
            conditions: conditionsResult.data || [],
            allergies: allergiesResult.data || [],
            prescriptions: prescriptionsResult.data || [],
            appointments: appointmentsResult.data || [],
        }
    };
}
