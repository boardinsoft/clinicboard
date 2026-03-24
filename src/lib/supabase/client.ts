import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Supabase configuration error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in the environment. Check your Vercel/GitHub secrets.'
        );
    }

    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
