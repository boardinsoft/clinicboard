/**
 * Session Manager
 *
 * Gestión de sesiones de usuario con timeout por inactividad.
 * Timeout configurado: 10 minutos de inactividad.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { logger } from './logger';

// Timeout en milisegundos (10 minutos)
const SESSION_TIMEOUT_MS =
    parseInt(process.env.SESSION_TIMEOUT_MINUTES || '10', 10) * 60 * 1000;

const LAST_ACTIVITY_COOKIE = 'clinicboard_last_activity';

/**
 * Obtiene el timestamp de última actividad desde cookies
 */
async function getLastActivity(): Promise<number | null> {
    const cookieStore = await cookies();
    const lastActivityCookie = cookieStore.get(LAST_ACTIVITY_COOKIE);

    if (!lastActivityCookie?.value) {
        return null;
    }

    const timestamp = parseInt(lastActivityCookie.value, 10);
    return isNaN(timestamp) ? null : timestamp;
}

/**
 * Actualiza el timestamp de última actividad
 */
export async function updateLastActivity(): Promise<void> {
    const cookieStore = await cookies();
    const now = Date.now();

    try {
        cookieStore.set(LAST_ACTIVITY_COOKIE, now.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_TIMEOUT_MS / 1000, // Convertir a segundos
            path: '/',
        });
    } catch (error) {
        // Las cookies no se pueden setear en Server Components
        logger.debug('No se pudo actualizar última actividad (Server Component)', {
            error,
        });
    }
}

/**
 * Verifica si la sesión ha expirado por inactividad
 *
 * @returns true si la sesión está activa, false si expiró
 */
export async function isSessionActive(): Promise<boolean> {
    const lastActivity = await getLastActivity();

    if (!lastActivity) {
        // Primera vez, consideramos sesión activa
        return true;
    }

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;

    const isActive = timeSinceLastActivity < SESSION_TIMEOUT_MS;

    if (!isActive) {
        logger.security('Sesión expirada por inactividad', {
            timeSinceLastActivity: Math.floor(timeSinceLastActivity / 1000 / 60), // minutos
            timeoutMinutes: SESSION_TIMEOUT_MS / 1000 / 60,
        });
    }

    return isActive;
}

/**
 * Calcula los minutos restantes antes del timeout
 */
export async function getRemainingSessionTime(): Promise<number> {
    const lastActivity = await getLastActivity();

    if (!lastActivity) {
        return SESSION_TIMEOUT_MS / 1000 / 60;
    }

    const now = Date.now();
    const elapsed = now - lastActivity;
    const remaining = SESSION_TIMEOUT_MS - elapsed;

    return Math.max(0, Math.floor(remaining / 1000 / 60)); // Retorna minutos
}

/**
 * Cierra sesión y limpia cookies
 */
export async function terminateSession(
    supabase: SupabaseClient
): Promise<void> {
    const cookieStore = await cookies();

    // Eliminar cookie de actividad
    cookieStore.delete(LAST_ACTIVITY_COOKIE);

    // Cerrar sesión en Supabase
    await supabase.auth.signOut();

    logger.info('Sesión terminada');
}

/**
 * Verifica y valida la sesión actual
 * Si expiró, cierra sesión automáticamente
 *
 * @returns true si la sesión es válida, false si expiró
 */
export async function validateSession(
    supabase: SupabaseClient
): Promise<boolean> {
    // Verificar si hay usuario autenticado
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    // Verificar timeout por inactividad
    const sessionActive = await isSessionActive();

    if (!sessionActive) {
        // Sesión expirada, cerrar automáticamente
        await terminateSession(supabase);
        return false;
    }

    // Actualizar timestamp de actividad
    await updateLastActivity();

    return true;
}

/**
 * Obtiene información de la sesión actual
 */
export async function getSessionInfo(): Promise<{
    active: boolean;
    remainingMinutes: number;
    timeoutMinutes: number;
}> {
    const active = await isSessionActive();
    const remainingMinutes = await getRemainingSessionTime();
    const timeoutMinutes = SESSION_TIMEOUT_MS / 1000 / 60;

    return {
        active,
        remainingMinutes,
        timeoutMinutes,
    };
}
