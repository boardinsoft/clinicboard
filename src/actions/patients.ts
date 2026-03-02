'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { patientSchema } from '@/lib/schemas/patient.schema';
import { z } from 'zod';

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
    const validation = patientSchema.safeParse({
        name_given: formData.givenNames,
        name_family: formData.familyName,
        gender: formData.gender,
        birth_date: formData.birthDate || '',
        documentId: formData.documentId,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
    });

    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado. Sesión no encontrada.' };
    }

    const { data, error } = await supabase
        .from('patients')
        .insert([{
            name_family: validation.data.name_family,
            name_given: validation.data.name_given,
            gender: validation.data.gender,
            birth_date: validation.data.birth_date || null,
            identifiers: validation.data.documentId ? [{ system: 'venezuela-ci', value: validation.data.documentId }] : [],
            telecom: [
                { system: 'phone', value: validation.data.phone, use: 'mobile' },
                { system: 'email', value: validation.data.email, use: 'home' }
            ],
            address: validation.data.address ? [{ text: validation.data.address }] : [],
            active: true,
            practitioner_id: user.id
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
    const validation = patientSchema.safeParse({
        name_given: formData.givenNames,
        name_family: formData.familyName,
        gender: formData.gender,
        birth_date: formData.birthDate || '',
        documentId: formData.documentId,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
    });

    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
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
            telecom: [
                { system: 'phone', value: validation.data.phone, use: 'mobile' },
                { system: 'email', value: validation.data.email, use: 'home' }
            ],
            address: validation.data.address ? [{ text: validation.data.address }] : []
        })
        .eq('id', id)
        .eq('practitioner_id', user.id)
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

export async function getPatients(queryText?: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: [] };

    let query = supabase
        .from('patients')
        .select('*')
        .eq('practitioner_id', user.id)
        .eq('active', true)
        .order('name_family', { ascending: true });

    if (queryText) {
        query = query.or(`name_family.ilike.%${queryText}%,name_given.cs.{${queryText}}`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching patients:', error);
        return { data: [] };
    }

    return { data: data || [] };
}

export async function getPatientClinicalData(patientId: string) {
    const supabase = await createServerSupabaseClient();

    const [conditionsResult, allergiesResult] = await Promise.all([
        supabase.from('conditions').select('*').eq('patient_id', patientId),
        supabase.from('allergy_intolerances').select('*').eq('patient_id', patientId)
    ]);

    return {
        conditions: conditionsResult.data || [],
        allergies: allergiesResult.data || []
    };
}

export async function createEncounter(encounterData: {
    patient_id: string;
    evolution_note: string;
    vital_signs: any;
    diagnosis: any;
    plan: string;
    reason_code?: any;
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('encounters')
        .insert([{
            patient_id: encounterData.patient_id,
            practitioner_id: user.id,
            status: 'finished',
            evolution_note: encounterData.evolution_note,
            vital_signs: encounterData.vital_signs,
            diagnosis: encounterData.diagnosis,
            plan: encounterData.plan,
            reason_code: encounterData.reason_code || [],
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('Error in createEncounter:', error);
        return { error: error.message };
    }

    revalidatePath('/history');
    return { data };
}

export async function getEncounters(patientId: string) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('encounters')
        .select(`
            *,
            practitioner:practitioners(name_given, name_family, specialty)
        `)
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false });

    if (error) {
        console.error('Error fetching encounters:', error);
        return { data: [] };
    }

    return { data: data || [] };
}

