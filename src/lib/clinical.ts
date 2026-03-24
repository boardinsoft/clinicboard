import { formatDate as coreFormatDate } from './date-utils';

export function formatDate(dateString: string | null | undefined): string {
    return coreFormatDate(dateString);
}

export function calcAge(birthDate: string | null | undefined): string {
    if (!birthDate) return '—';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return '—';

    const diff = Date.now() - birth.getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return `${age} años`;
}

export function getGenderLabel(gender: string | null | undefined): string {
    const map: Record<string, string> = {
        male: 'Masculino',
        female: 'Femenino',
        other: 'Otro',
        unknown: 'Desconocido',
    };
    return map[gender as string] || gender || '—';
}
