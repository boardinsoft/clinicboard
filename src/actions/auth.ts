'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { withErrorHandling } from '@/lib/security/error-handler';
import { logger } from '@/lib/security/logger';

export async function signInWithEmail(formData: FormData) {
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    if (!email || !password) {
        logger.warn('Intento de login sin credenciales completas');
        return { error: 'Por favor, ingrese correo y contraseña' };
    }

    try {
        const supabase = await createServerSupabaseClient();

        const { error, data } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            logger.security('Intento de login fallido', {
                email,
                errorCode: error.message,
                errorStatus: error.status,
            });

            // Manejar específicamente el error 429 (rate limiting)
            if (error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
                return {
                    error: 'Demasiados intentos de inicio de sesión. Por favor, espera unos minutos antes de intentar nuevamente.',
                    errorType: 'rate_limit'
                };
            }

            // Error genérico para otros casos
            return { error: 'Correo o contraseña incorrectos' };
        }

        logger.info('Login exitoso', {
            userId: data.user?.id,
            email,
        });

        // Redirect to dashboard on success
        // redirect() throws NEXT_REDIRECT error - es el comportamiento esperado
        redirect('/');
    } catch (error) {
        // Si es un redirect de Next.js, dejar que se propague
        if (error && typeof error === 'object' && 'digest' in error) {
            throw error;
        }

        // Otros errores
        logger.error('Error en signInWithEmail', error);
        return { error: 'Error inesperado. Por favor, intenta nuevamente.' };
    }
}

export async function signOut() {
    return withErrorHandling(async () => {
        const supabase = await createServerSupabaseClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        await supabase.auth.signOut();

        logger.info('Logout exitoso', {
            userId: user?.id,
        });

        redirect('/login');
    }, 'signOut');
}
