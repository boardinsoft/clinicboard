export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const date = dateString.includes('T')
        ? new Date(dateString)
        : new Date(`${dateString}T00:00:00`);

    if (isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
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
