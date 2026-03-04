'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * searchCIE10(query)
 * Searches the CIE-10 table by code or description.
 * Returns a list of matching diagnoses.
 */
export async function searchCIE10(query: string) {
    if (!query || query.length < 2) return { data: [] };

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // Search by exact code or partial description
    const { data, error } = await supabase
        .from('cie10')
        .select('code, description')
        .or(`code.ilike.${query}%,description.ilike.%${query}%`)
        .limit(15)
        .order('code', { ascending: true });

    if (error) {
        console.error('Error searching CIE-10:', error);
        return { error: error.message };
    }

    return { data: data || [] };
}

/**
 * getCIE10ByCode(code)
 * Retrieves a single CIE-10 record by its code.
 */
export async function getCIE10ByCode(code: string) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from('cie10')
        .select('code, description')
        .eq('code', code)
        .single();

    if (error) {
        console.error('Error fetching CIE-10 by code:', error);
        return { error: error.message };
    }

    return { data };
}
