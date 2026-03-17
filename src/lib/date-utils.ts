/**
 * date-utils.ts
 * Centralized date and time formatting for Clinicboard.
 * Locale: es-VE (Spanish - Venezuela)
 * Timezone: America/Caracas (GMT-4)
 */

const DEFAULT_LOCALE = 'es-VE';
const DEFAULT_TIMEZONE = 'America/Caracas';

interface FormatOptions extends Intl.DateTimeFormatOptions {
    timeZone?: string;
}

/**
 * Formats a date string or Date object to a readable date (e.g., 16 de mar. 2026).
 */
export function formatDate(date: string | Date | null | undefined, options?: FormatOptions): string {
    if (!date) return '—';
    const d = typeof date === 'string' 
        ? (date.includes('T') ? new Date(date) : new Date(`${date}T00:00:00`))
        : date;

    if (isNaN(d.getTime())) return '—';

    return d.toLocaleDateString(DEFAULT_LOCALE, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: DEFAULT_TIMEZONE,
        ...options,
    });
}

/**
 * Formats a date string or Date object to a long readable date (e.g., lunes, 16 de marzo de 2026).
 */
export function formatLongDate(date: string | Date | null | undefined): string {
    return formatDate(date, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Formats a date string or Date object to a time string (e.g., 09:30 AM).
 */
export function formatTime(date: string | Date | null | undefined): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';

    return d.toLocaleTimeString(DEFAULT_LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: DEFAULT_TIMEZONE,
    });
}

/**
 * Returns the current date/time adjusted to Venezuela's timezone.
 */
export function nowInVE(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }));
}

/**
 * Formats a date to ISO string for the DB (YYYY-MM-DD), but considering VE timezone.
 */
export function toISODate(date: Date): string {
    return date.toLocaleDateString('en-CA', { timeZone: DEFAULT_TIMEZONE }); // YYYY-MM-DD
}
