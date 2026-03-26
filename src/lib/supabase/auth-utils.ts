import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Gets the internal practitioner ID from the current authenticated user's ID.
 * This is necessary because some tables use the domain UUID (practitioners.id) 
 * instead of the auth UUID (auth.users.id).
 */
export async function getCurrentPractitionerId(supabase: SupabaseClient<Database>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: practitioner, error } = await supabase
        .from('practitioners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (error || !practitioner) {
        console.error('Error fetching practitioner ID for user:', user.id, error);
        return null;
    }

    return practitioner.id;
}
