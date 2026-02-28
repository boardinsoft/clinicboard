'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signInWithEmail(formData: FormData) {
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    if (!email || !password) {
        return { error: 'Por favor, ingrese correo y contraseña' };
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: 'Correo o contraseña incorrectos', message: error.message };
    }

    // Redirect to dashboard on success
    redirect('/');
}

export async function signOut() {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect('/login');
}
