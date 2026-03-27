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

/**
 * Converts a duration in minutes to a human-readable string with combined units
 * (e.g. 45 → "45 min", 90 → "1h 30min", 1500 → "1d 1h").
 */
export function formatDuration(minutes: number): string {
    if (minutes < 1) return 'un momento';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;

    if (hours < 24) {
        return remainingMins > 0 ? `${hours}h ${remainingMins}min` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Returns a human-readable relative time string showing combined units
 * (e.g. "hace 5 min", "hace 1h 30min", "hace 2 días 3h").
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';

    const now = nowInVE();
    // Convert target to local TZ for comparison
    const localTarget = new Date(d.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }));

    const diffMs = now.getTime() - localTarget.getTime();

    if (diffMs < 0) return 'hace un momento';

    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    if (diffHours < 24) {
        return remainingMins > 0
            ? `hace ${diffHours}h ${remainingMins}min`
            : `hace ${diffHours}h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    return remainingHours > 0
        ? `hace ${diffDays} día${diffDays > 1 ? 's' : ''} ${remainingHours}h`
        : `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
}
