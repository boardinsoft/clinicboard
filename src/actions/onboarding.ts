'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/security/logger';
import type { ProfileStepData, ClinicStepData, LocationStepData } from '@/lib/schemas/onboarding';

export interface CreateClinicAsAdminInput {
    userId: string;
    profile: ProfileStepData;
    clinic: ClinicStepData;
    location?: LocationStepData;
}

export async function createClinicAsAdmin(input: CreateClinicAsAdminInput) {
    try {
        const supabase = await createServerSupabaseClient();

        // Verify user owns this session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== input.userId) {
            return { error: 'Sesión inválida. Por favor, inicia sesión nuevamente.' };
        }

        // Check if user already has a practitioner profile
        const { data: existingPractitioner } = await supabase
            .from('practitioners')
            .select('id')
            .eq('auth_user_id', input.userId)
            .single();

        let clinicCount = 0;

        if (existingPractitioner) {
            // Check clinic count for this practitioner
            const { data: allLinks } = await supabase
                .from('clinic_practitioners')
                .select('id, role')
                .eq('practitioner_id', existingPractitioner.id)
                .eq('active', true);

            clinicCount = allLinks?.length || 0;

            // Check if already has a clinic as admin
            const { data: existingLinks } = await supabase
                .from('clinic_practitioners')
                .select('id, role')
                .eq('practitioner_id', existingPractitioner.id)
                .eq('role', 'admin');

            if (existingLinks && existingLinks.length > 0) {
                return { error: 'Ya tienes una clínica. Ve al dashboard.' };
            }
        }

        // Block if user already has 2 clinics
        if (clinicCount >= 2) {
            return { error: 'Has alcanzado el límite máximo de 2 clínicas. Contacta a soporte si necesitas más.' };
        }

        // Check if slug is available
        const { data: existingClinic } = await supabase
            .from('clinics')
            .select('id')
            .eq('slug', input.clinic.slug.toLowerCase())
            .single();

        if (existingClinic) {
            return { error: 'Este nombre de clínica ya está en uso. Por favor, elige otro nombre.' };
        }

        // Create practitioner
        let practitionerId = existingPractitioner?.id;

        if (!practitionerId) {
            const { data: newPractitioner, error: practitionerError } = await supabase
                .from('practitioners')
                .insert({
                    auth_user_id: input.userId,
                    name_given: input.profile.name_given,
                    name_family: input.profile.name_family,
                    specialty: input.profile.specialty || null,
                    gender: input.profile.gender || null,
                    license_number: input.profile.license_number || null,
                    active: true,
                })
                .select('id')
                .single();

            if (practitionerError) {
                logger.error('Error creating practitioner', practitionerError);
                return { error: 'Error al crear tu perfil profesional.' };
            }

            practitionerId = newPractitioner?.id;
        } else if (practitionerId && input.profile.license_number) {
            // Update existing practitioner with license_number if provided
            await supabase
                .from('practitioners')
                .update({ license_number: input.profile.license_number })
                .eq('id', practitionerId);
        }

        if (!practitionerId) {
            return { error: 'Error al crear tu perfil profesional.' };
        }

        // Create clinic with location data
        const clinicInsert: {
            name: string;
            slug: string;
            active: boolean;
            updated_at: string;
            telecom?: string;
            address?: string;
        } = {
            name: input.clinic.name,
            slug: input.clinic.slug.toLowerCase(),
            active: true,
            updated_at: new Date().toISOString(),
        };

        // Store location in telecom JSONB
        if (input.location?.phone) {
            clinicInsert.telecom = JSON.stringify([{ system: 'phone', value: input.location.phone }]);
        }
        if (input.location?.address) {
            clinicInsert.address = JSON.stringify([{ city: input.location.city, state: input.location.state, line: [input.location.address] }]);
        }

        const { data: newClinic, error: clinicError } = await supabase
            .from('clinics')
            .insert(clinicInsert)
            .select('id, name, slug')
            .single();

        if (clinicError) {
            logger.error('Error creating clinic', clinicError);
            return { error: 'Error al crear la clínica. Por favor, intenta nuevamente.' };
        }

        // Link practitioner to clinic as admin
        // Query the roles table to get the admin role UUID
        const adminRoleResponse = await supabase
            .from('roles' as any)
            .select('id')
            .eq('name', 'admin')
            .single();

        const adminRole = adminRoleResponse.data as { id: string } | null;

        if (!adminRole) {
            logger.error('Admin role not found in roles table', adminRoleResponse.error);
            return { error: 'Error de configuración. No se encontró el rol de administrador.' };
        }

        const { error: linkError } = await supabase
            .from('clinic_practitioners')
            .insert({
                clinic_id: newClinic.id,
                practitioner_id: practitionerId,
                role: 'admin',
                role_id: adminRole.id,
                is_owner: true,
                active: true,
            });

        if (linkError) {
            logger.error('Error linking practitioner to clinic', linkError);
            // Rollback: delete clinic
            await supabase.from('clinics').delete().eq('id', newClinic.id);
            return { error: 'Error al vincularte a la clínica. Por favor, intenta nuevamente.' };
        }

        // Update clinic with owner reference
        await supabase
            .from('clinics')
            .update({ owner_practitioner_id: practitionerId })
            .eq('id', newClinic.id);

        // Mark onboarding as completed
        await supabase
            .from('practitioners' as any)
            .update({ onboarding_completed: true } as any)
            .eq('id', practitionerId);

        logger.info('Onboarding completado', {
            userId: input.userId,
            clinicId: newClinic.id,
            practitionerId,
        });

        return {
            success: true,
            clinicId: newClinic.id,
            clinicName: newClinic.name,
            practitionerId,
        };
    } catch (error) {
        logger.error('Error en createClinicAsAdmin', error);
        return { error: 'Error inesperado. Por favor, intenta nuevamente.' };
    }
}

export async function checkSlugAvailability(slug: string) {
    try {
        const supabase = await createServerSupabaseClient();

        const { data } = await supabase
            .from('clinics')
            .select('id')
            .eq('slug', slug.toLowerCase())
            .single();

        return { available: !data };
    } catch {
        return { available: false, error: 'Error al verificar disponibilidad' };
    }
}

export async function getOnboardingStatus(userId: string) {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: practitioner } = await supabase
            .from('practitioners' as any)
            .select('id, auth_user_id, onboarding_completed' as any)
            .eq('auth_user_id', userId)
            .single();

        if (!practitioner) {
            return { needsOnboarding: true, hasClinic: false, onboardingCompleted: false };
        }

        const practitionerData = practitioner as unknown as { id: string; auth_user_id: string; onboarding_completed?: boolean };

        if (practitionerData.onboarding_completed === true) {
            return {
                needsOnboarding: false,
                hasClinic: true,
                onboardingCompleted: true,
                clinicCount: 0,
            };
        }

        // Check if practitioner has any clinics as admin
        const { data: adminLinks } = await supabase
            .from('clinic_practitioners')
            .select('id')
            .eq('practitioner_id', practitionerData.id)
            .eq('role', 'admin')
            .limit(1);

        if (!adminLinks || adminLinks.length === 0) {
            return { needsOnboarding: true, hasClinic: false, onboardingCompleted: false };
        }

        // Check if practitioner has clinics
        const { data: clinics } = await supabase
            .from('clinic_practitioners')
            .select('clinic_id, role')
            .eq('practitioner_id', practitionerData.id);

        return {
            needsOnboarding: false,
            hasClinic: (clinics?.length || 0) > 0,
            onboardingCompleted: false,
            clinicCount: clinics?.length || 0,
        };
    } catch (error) {
        logger.error('Error en getOnboardingStatus', error);
        return { needsOnboarding: true, hasClinic: false, onboardingCompleted: false, error: 'Error al verificar estado' };
    }
}