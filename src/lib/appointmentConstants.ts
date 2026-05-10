import type { AppointmentStatus, Patient } from '@/lib/fhir/types';

export const FHIR_STATUS_CONFIG: Record<AppointmentStatus, { label: string; colorClass: string; borderClass: string }> = {
    proposed: { label: 'Propuesta', colorClass: 'bg-n-5', borderClass: 'border-l-n-5' },
    pending: { label: 'Pendiente', colorClass: 'bg-warning/20 text-warning', borderClass: 'border-l-warning' },
    booked: { label: 'Confirmada', colorClass: 'bg-info/20 text-info', borderClass: 'border-l-info' },
    arrived: { label: 'En Consulta', colorClass: 'bg-warning/20 text-warning', borderClass: 'border-l-warning' },
    fulfilled: { label: 'Completada', colorClass: 'bg-success/20 text-success', borderClass: 'border-l-success' },
    cancelled: { label: 'Cancelada', colorClass: 'bg-destructive/20 text-destructive', borderClass: 'border-l-destructive' },
    noshow: { label: 'No asistió', colorClass: 'bg-n-8/20 text-n-8', borderClass: 'border-l-n-8' },
};

export const FHIR_STATUS_COLORS: Record<AppointmentStatus, string> = {
    proposed: 'bg-n-5',
    pending: 'bg-warning',
    booked: 'bg-info',
    arrived: 'bg-warning',
    fulfilled: 'bg-success',
    cancelled: 'bg-destructive',
    noshow: 'bg-n-8',
};

export const FHIR_STATUS_PILL_VARIANT: Record<AppointmentStatus, string> = {
    proposed: 'pill-neutral',
    pending: 'pill-warning',
    booked: 'pill-info',
    arrived: 'pill-warning',
    fulfilled: 'pill-success',
    cancelled: 'pill-danger',
    noshow: 'pill-neutral',
};

export const APPOINTMENT_TYPES = [
    "Consulta General",
    "Control",
    "Primera Vez",
    "Seguimiento",
    "Segunda Opinión",
    "Emergencia",
    "Telemedicina"
] as const;

export function formatPatientName(patient: Patient | null | undefined): string {
    if (!patient) return 'Paciente';
    return `${patient.name_family}, ${patient.name_given?.join(' ') || ''}`.trim();
}