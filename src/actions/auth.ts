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

export async function registerUser(email: string, password: string) {
    if (!email || !password) {
        logger.warn('Intento de registro sin credenciales completas');
        return { error: 'Por favor, ingresa correo y contraseña' };
    }

    const passwordRequirements = [
        { test: (p: string) => p.length >= 8, message: 'La contraseña debe tener al menos 8 caracteres' },
        { test: (p: string) => /[A-Z]/.test(p), message: 'La contraseña debe tener al menos una mayúscula' },
        { test: (p: string) => /[a-z]/.test(p), message: 'La contraseña debe tener al menos una minúscula' },
        { test: (p: string) => /[0-9]/.test(p), message: 'La contraseña debe tener al menos un número' },
        { test: (p: string) => /[^A-Za-z0-9]/.test(p), message: 'La contraseña debe tener al menos un carácter especial' },
    ];

    for (const req of passwordRequirements) {
        if (!req.test(password)) {
            return { error: req.message };
        }
    }

    try {
        const supabase = await createServerSupabaseClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: emailExists } = await (supabase as any).rpc('check_email_exists', {
            p_email: email.toLowerCase(),
        });

        if (emailExists) {
            logger.security('Intento de registro con email ya existente', { email });
            return { error: 'Este correo electrónico ya está registrado. ¿Ya tienes cuenta?' };
        }

        const { data, error } = await supabase.auth.signUp({
            email: email.toLowerCase(),
            password,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/onboarding`,
                data: {
                    registered_at: new Date().toISOString(),
                }
            }
        });

        if (error) {
            logger.security('Intento de registro fallido', {
                email,
                errorCode: error.message,
                errorStatus: error.status,
            });
            return { error: error.message };
        }

        logger.info('Registro iniciado', {
            userId: data.user?.id,
            email,
        });

        return {
            success: true,
            message: 'Se envío un enlace de confirmación a tu correo. Por favor, verifica tu bandeja de entrada.',
            userId: data.user?.id
        };
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error) {
            throw error;
        }

        logger.error('Error en registerUser', error);
        return { error: 'Error inesperado. Por favor, intenta nuevamente.' };
    }
}

export async function forgotPassword(email: string) {
    if (!email) {
        logger.warn('Intento de recuperación sin email');
        return { error: 'Por favor, ingresa tu correo electrónico' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { error: 'Por favor, ingresa un correo electrónico válido' };
    }

    try {
        const supabase = await createServerSupabaseClient();

        const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
        });

        if (error) {
            logger.security('Error en solicitud de reset de contraseña', {
                email,
                errorCode: error.message,
                errorStatus: error.status,
            });

            if (error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
                return {
                    error: 'Demasiadas solicitudes. Por favor, espera unos minutos antes de intentar nuevamente.',
                    errorType: 'rate_limit'
                };
            }

            return { error: 'No se pudo procesar tu solicitud. Por favor, intenta nuevamente.' };
        }

        logger.info('Solicitud de reset de contraseña', { email });

        return { success: true };

    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error) {
            throw error;
        }

        logger.error('Error en forgotPassword', error);
        return { error: 'Error inesperado. Por favor, intenta nuevamente.' };
    }
}
