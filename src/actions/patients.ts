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
