'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';

const clinicSettingsSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
    rif: z.string().refine(val => val === '' || /^[JGEV]-\d{8,9}-\d$/.test(val), {
        message: 'Formato RIF inválido (J-12345678-9)',
    }).optional(),
    address: z.string().max(500, 'Máximo 500 caracteres').optional(),
    phone: z.string().refine(val => val === '' || /^\d{10,11}$/.test(val), {
        message: 'Teléfono inválido (10-11 dígitos)',
    }).optional(),
});

export async function updateClinic(clinicId: string, formData: {
    name: string;
    rif?: string;
    address?: string;
    phone?: string;
}) {
    const validation = clinicSettingsSchema.safeParse(formData);

    if (!validation.success) {
        return { error: z.flattenError(validation.error) };
    }

    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data: clinicMember } = await supabase
        .from('clinic_practitioners')
        .select('id, is_owner')
        .eq('clinic_id', clinicId)
        .eq('practitioner_id', practitionerId)
        .single();

    if (!clinicMember) {
        return { error: 'No tienes permisos para editar esta clínica' };
    }

    const { data, error } = await supabase
        .from('clinics')
        .update({
            name: validation.data.name,
            rif: validation.data.rif || null,
            address: validation.data.address || null,
            phone: validation.data.phone || null,
        })
        .eq('id', clinicId)
        .select()
        .single();

    if (error) {
        console.error('Error in updateClinic:', error);
        return { error: error.message };
    }

    revalidatePath('/settings/clinic');
    return { data };
}

export async function getClinicSettings(clinicId: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('clinics')
        .select('id, name, rif, address, phone')
        .eq('id', clinicId)
        .single();

    if (error) {
        console.error('Error in getClinicSettings:', error);
        return { error: error.message };
    }

    return { data };
}

const profileSettingsSchema = z.object({
    name_given: z.array(z.string()).min(1, 'Se requiere al menos un nombre'),
    name_family: z.string().min(1, 'El apellido es requerido'),
    national_id: z.string().regex(/^[VE]-\d{6,8}$/, 'Formato cédula inválido (V-12345678 o E-12345678)').optional().or(z.literal('')),
    mpps_registration_number: z.string().min(1, 'El registro MPPS es requerido').max(50),
    specialty: z.string().optional(),
    license_number: z.string().max(50).optional(),
    university: z.string().max(200).optional(),
});

export async function updatePractitionerProfile(formData: {
    name_given: string[];
    name_family: string;
    national_id?: string;
    mpps_registration_number?: string;
    specialty?: string;
    license_number?: string;
    university?: string;
}) {
    const validation = profileSettingsSchema.safeParse(formData);

    if (!validation.success) {
        return { error: z.flattenError(validation.error) };
    }

    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('practitioners')
        .update({
            name_given: validation.data.name_given,
            name_family: validation.data.name_family,
            national_id: validation.data.national_id || null,
            mpps_registration_number: validation.data.mpps_registration_number || null,
            specialty: validation.data.specialty || null,
            license_number: validation.data.license_number || null,
            university: validation.data.university || null,
        })
        .eq('id', practitionerId)
        .select()
        .single();

    if (error) {
        console.error('Error in updatePractitionerProfile:', error);
        return { error: error.message };
    }

    revalidatePath('/settings/profile');
    return { data };
}

export async function getPractitionerProfile() {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('practitioners')
        .select('id, name_given, name_family, national_id, mpps_registration_number, specialty, license_number, university')
        .eq('id', practitionerId)
        .single();

    if (error) {
        console.error('Error in getPractitionerProfile:', error);
        return { error: error.message };
    }

    return { data };
}

export async function getClinicTeam(clinicId: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('clinic_practitioners')
        .select(`
            id,
            role,
            is_owner,
            active,
            practitioner:practitioners(
                id,
                name_given,
                name_family,
                specialty,
                national_id
            )
        `)
        .eq('clinic_id', clinicId);

    if (error) {
        console.error('Error in getClinicTeam:', error);
        return { error: error.message };
    }

    return { data };
}
