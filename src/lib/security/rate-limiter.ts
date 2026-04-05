/**
 * Rate Limiting con Upstash Redis
 *
 * Protege contra brute-force attacks y abuso de Server Actions.
 * Integrado con Vercel Edge Network para máximo rendimiento.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Singleton de Redis client
let redis: Redis | null = null;
let loginRateLimiter: Ratelimit | null = null;
let apiRateLimiter: Ratelimit | null = null;

/**
 * Inicializa el cliente de Redis (solo una vez)
 */
function getRedisClient(): Redis {
    if (!redis) {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            throw new Error(
                'UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN deben estar configurados en las variables de entorno'
            );
        }

        redis = new Redis({
            url,
            token,
        });
    }
    return redis;
}

/**
 * Rate limiter para intentos de login
 * Límite: 5 intentos por cada 15 minutos por IP
 */
export function getLoginRateLimiter(): Ratelimit {
    if (!loginRateLimiter) {
        loginRateLimiter = new Ratelimit({
            redis: getRedisClient(),
            limiter: Ratelimit.slidingWindow(5, '15 m'),
            analytics: true,
            prefix: 'clinicboard:ratelimit:login',
        });
    }
    return loginRateLimiter;
}

/**
 * Rate limiter para Server Actions generales
 * Límite: 60 requests por minuto por usuario autenticado
 */
export function getApiRateLimiter(): Ratelimit {
    if (!apiRateLimiter) {
        apiRateLimiter = new Ratelimit({
            redis: getRedisClient(),
            limiter: Ratelimit.slidingWindow(60, '1 m'),
            analytics: true,
            prefix: 'clinicboard:ratelimit:api',
        });
    }
    return apiRateLimiter;
}

/**
 * Verifica rate limit y retorna información detallada
 */
export async function checkRateLimit(
    identifier: string,
    type: 'login' | 'api' = 'api'
): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}> {
    const limiter = type === 'login' ? getLoginRateLimiter() : getApiRateLimiter();

    try {
        const { success, limit, remaining, reset } = await limiter.limit(identifier);

        return {
            success,
            limit,
            remaining,
            reset,
        };
    } catch (error) {
        // En caso de error con Redis, permitir la request pero logear
        console.error('[Rate Limiter] Error al verificar límite:', error);
        // Modo fail-open para no bloquear la app si Redis falla
        return {
            success: true,
            limit: 0,
            remaining: 0,
            reset: 0,
        };
    }
}

/**
 * Helper para obtener IP del cliente desde headers de Vercel
 */
export function getClientIdentifier(request: Request): string {
    // Vercel provee x-forwarded-for y x-real-ip
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    const ip = forwarded?.split(',')[0] || realIp || 'unknown';

    return ip;
}

/**
 * Genera mensaje de error amigable para rate limiting
 */
export function getRateLimitErrorMessage(reset: number): string {
    const resetDate = new Date(reset);
    const now = new Date();
    const minutesRemaining = Math.ceil((resetDate.getTime() - now.getTime()) / 60000);

    return `Has excedido el límite de intentos. Por favor, intenta nuevamente en ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''}.`;
}
