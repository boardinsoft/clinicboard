import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

export interface Clinic {
    id: string;
    name: string;
    slug: string;
    active?: boolean;
    role_name?: string;
}

export async function getPractitionerClinics(supabase: SupabaseClient<Database>, practitionerId: string): Promise<Clinic[]> {
    if (!practitionerId) return [];

    const { data, error } = await supabase
        .from('clinic_practitioners')
        .select(`
            clinic_id,
            active,
            role_id,
            clinics!inner (
                id,
                name,
                slug
            ),
            roles!inner (
                name
            )
        `)
        .eq('practitioner_id', practitionerId)
        .eq('active', true);

    if (error) {
        console.error('Error fetching practitioner clinics:', error);
        return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((cp: any) => ({
        id: cp.clinics.id,
        name: cp.clinics.name,
        slug: cp.clinics.slug,
        active: cp.active,
        role_name: cp.roles?.name,
    }));
}

export async function getActiveClinicId(supabase: SupabaseClient<Database>): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem('activeClinic');
    if (!stored) return null;

    try {
        const parsed = JSON.parse(stored);
        return parsed.id || null;
    } catch {
        return null;
    }
}

export async function canAddClinic(supabase: SupabaseClient<Database>, practitionerId: string): Promise<{ canAdd: boolean; currentCount: number; message?: string }> {
    if (!practitionerId) {
        return { canAdd: false, currentCount: 0, message: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('clinic_practitioners')
        .select('id', { count: 'exact' })
        .eq('practitioner_id', practitionerId)
        .eq('active', true);

    if (error) {
        console.error('Error checking clinic count:', error);
        return { canAdd: false, currentCount: 0, message: 'Error al verificar clínicas' };
    }

    const count = data?.length || 0;

    if (count >= 2) {
        return {
            canAdd: false,
            currentCount: count,
            message: 'Has alcanzado el límite de 2 clínicas. No puedes agregar más clínicas.'
        };
    }

    return { canAdd: true, currentCount: count };
}