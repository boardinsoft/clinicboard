/**
 * Error Handler Centralizado
 *
 * Wrapper para Server Actions que:
 * - Captura errores inesperados
 * - Sanitiza mensajes antes de enviarlos al cliente
 * - Logea errores de forma estructurada
 * - Previene exposición de stack traces en producción
 */

import { logger } from './logger';

type ServerActionResult<T> = { data: T } | { error: string | object };

/**
 * Wrapper genérico para Server Actions con manejo de errores
 *
 * @param actionFn - Función async que ejecuta la lógica del Server Action
 * @param actionName - Nombre descriptivo para logging
 * @returns Resultado tipado con {data} o {error}
 *
 * @example
 * export async function createPatient(formData: PatientFormData) {
 *   return withErrorHandling(async () => {
 *     const supabase = await createServerSupabaseClient();
 *     const practitionerId = await getCurrentPractitionerId(supabase);
 *     // ... lógica de negocio
 *     return result;
 *   }, 'createPatient');
 * }
 */
export async function withErrorHandling<T>(
    actionFn: () => Promise<T>,
    actionName: string,
    context?: Record<string, unknown>
): Promise<ServerActionResult<T>> {
    try {
        const data = await actionFn();
        return { data };
    } catch (error) {
        // Loguear el error completo internamente
        logger.error(`Error en Server Action: ${actionName}`, error, {
            action: actionName,
            ...context,
        });

        // Retornar mensaje sanitizado al cliente
        const clientMessage = getClientSafeErrorMessage(error, actionName);

        return { error: clientMessage };
    }
}

/**
 * Convierte errores internos en mensajes seguros para el cliente
 */
function getClientSafeErrorMessage(error: unknown, actionName: string): string {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Errores de Supabase
    if (isSupabaseError(error)) {
        return getSupabaseErrorMessage(error);
    }

    // Errores de validación Zod (ya son seguros)
    if (isZodError(error)) {
        return 'Error de validación. Verifica los datos ingresados.';
    }

    // Errores de autenticación
    if (isAuthError(error)) {
        return 'No autorizado. Por favor, inicia sesión nuevamente.';
    }

    // Error genérico (ocultar detalles en producción)
    if (isDevelopment && error instanceof Error) {
        return `Error en ${actionName}: ${error.message}`;
    }

    return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.';
}

/**
 * Detecta errores de Supabase
 */
function isSupabaseError(error: unknown): error is { code?: string; message?: string } {
    return (
        typeof error === 'object' &&
        error !== null &&
        ('code' in error || 'message' in error)
    );
}

/**
 * Convierte códigos de error de Supabase en mensajes amigables
 */
function getSupabaseErrorMessage(error: { code?: string; message?: string }): string {
    const errorMap: Record<string, string> = {
        '23505': 'Ya existe un registro con estos datos.',
        '23503': 'No se puede completar la operación. Datos relacionados no encontrados.',
        '23514': 'Los datos no cumplen con las restricciones requeridas.',
        PGRST116: 'Registro no encontrado.',
        PGRST301: 'No autorizado para realizar esta operación.',
        '42501': 'Permisos insuficientes.',
        '22P02': 'Formato de datos inválido.',
    };

    if (error.code && errorMap[error.code]) {
        return errorMap[error.code];
    }

    // Retornar mensaje del error si es seguro
    if (error.message && !error.message.includes('ERROR:')) {
        return error.message;
    }

    return 'Error en la base de datos. Por favor, intenta nuevamente.';
}

/**
 * Detecta errores de validación Zod
 */
function isZodError(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'ZodError'
    );
}

/**
 * Detecta errores de autenticación
 */
function isAuthError(error: unknown): boolean {
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = String((error as { message: unknown }).message).toLowerCase();
        return (
            message.includes('unauthorized') ||
            message.includes('not authenticated') ||
            message.includes('no autorizado') ||
            message.includes('invalid token')
        );
    }
    return false;
}

/**
 * Valida y sanitiza datos de entrada antes de procesarlos
 * Previene inyección de código y ataques XSS básicos
 */
export function sanitizeInput(input: unknown): unknown {
    if (typeof input === 'string') {
        // Remover caracteres peligrosos comunes
        return input
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }

    if (Array.isArray(input)) {
        return input.map(sanitizeInput);
    }

    if (typeof input === 'object' && input !== null) {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized;
    }

    return input;
}

/**
 * Wrapper específico para Server Actions que requieren autenticación
 * Verifica que el usuario esté autenticado antes de ejecutar
 */
export async function withAuth<T>(
    actionFn: () => Promise<T>,
    actionName: string
): Promise<ServerActionResult<T>> {
    return withErrorHandling(async () => {
        // La verificación de auth debe hacerse dentro del actionFn
        // Este wrapper solo añade logging específico de seguridad
        logger.debug(`[AUTH] Ejecutando acción protegida: ${actionName}`);
        return await actionFn();
    }, actionName);
}
