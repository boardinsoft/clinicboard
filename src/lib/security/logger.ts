/**
 * Logger Estructurado
 *
 * Reemplaza console.log/error con logging estructurado y seguro.
 * NO expone información sensible en producción.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
    userId?: string;
    action?: string;
    resource?: string;
    ip?: string;
    [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Formatea y escribe log estructurado
 */
function writeLog(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
    const timestamp = new Date().toISOString();

    const logEntry: Record<string, unknown> = {
        timestamp,
        level,
        message,
        environment: process.env.NODE_ENV || 'unknown',
    };

    if (context) {
        logEntry.context = context;
    }

    if (error) {
        const errorInfo: Record<string, unknown> = {
            message: error instanceof Error ? error.message : String(error),
        };

        if (isDevelopment && error instanceof Error && error.stack) {
            errorInfo.stack = error.stack;
        }

        logEntry.error = errorInfo;
    }

    // En desarrollo, usar console con formato legible
    if (isDevelopment) {
        const colorMap: Record<LogLevel, string> = {
            info: '\x1b[36m', // Cyan
            warn: '\x1b[33m', // Yellow
            error: '\x1b[31m', // Red
            debug: '\x1b[90m', // Gray
        };
        const reset = '\x1b[0m';
        const color = colorMap[level];

        console.log(`${color}[${level.toUpperCase()}]${reset} ${message}`);
        if (context) console.log('Context:', context);
        if (error) console.error('Error:', error);
    } else {
        // En producción, JSON estructurado para Vercel/Sentry
        console.log(JSON.stringify(logEntry));
    }
}

/**
 * Sanitiza información sensible de objetos
 */
function sanitize(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    const sensitiveKeys = [
        'password',
        'token',
        'secret',
        'authorization',
        'cookie',
        'session',
        'api_key',
        'apikey',
        'encrypted_notes',
        'subjective',
        'objective',
        'analysis',
        'plan',
    ];

    if (Array.isArray(data)) {
        return data.map(sanitize);
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
            sanitized[key] = '[REDACTED]';
        } else {
            sanitized[key] = sanitize(value);
        }
    }

    return sanitized;
}

/**
 * API pública del logger
 */
export const logger = {
    info(message: string, context?: LogContext) {
        writeLog('info', message, sanitize(context) as LogContext);
    },

    warn(message: string, context?: LogContext) {
        writeLog('warn', message, sanitize(context) as LogContext);
    },

    error(message: string, error?: unknown, context?: LogContext) {
        writeLog('error', message, sanitize(context) as LogContext, error);
    },

    debug(message: string, context?: LogContext) {
        if (isDevelopment) {
            writeLog('debug', message, sanitize(context) as LogContext);
        }
    },

    /**
     * Log específico para auditoría de seguridad
     */
    security(event: string, context: LogContext) {
        writeLog('warn', `[SECURITY] ${event}`, {
            ...context,
            securityEvent: true,
        });
    },
};
