import type { BadgeProps } from '@/components/ui/badge';

export const ENCOUNTER_STATUS_LABELS: Record<string, string> = {
    'planned':     'Planificada',
    'arrived':      'Llegó',
    'triaged':      'Triaje',
    'in-progress':  'En curso',
    'finished':     'Finalizada',
    'cancelled':    'Cancelada',
    'onleave':      'Pausa',
};

export const ENCOUNTER_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
    'planned':     'pill-neutral',
    'arrived':      'pill-warning',
    'triaged':      'pill-warning',
    'in-progress':  'pill-info',
    'finished':     'pill-success',
    'cancelled':    'pill-danger',
    'onleave':      'pill-neutral',
};

export const CLASS_LABELS: Record<string, string> = {
    AMB:  'Ambulatorio',
    IMP:  'Hospitalario',
    EMER: 'Urgencia',
    HH:   'Domicilio',
};

export const PRESCRIPTION_STATUS_LABELS: Record<string, string> = {
    'draft':     'Borrador',
    'active':    'Activa',
    'on-hold':   'En espera',
    'cancelled': 'Cancelada',
    'completed': 'Completada',
    'stopped':   'Detenida',
    'unknown':   'Desconocido',
};

export const PRESCRIPTION_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
    'draft':     'pill-neutral',
    'active':    'pill-success',
    'on-hold':   'pill-warning',
    'cancelled': 'pill-danger',
    'completed': 'pill-neutral',
    'stopped':   'pill-danger',
    'unknown':   'pill-neutral',
};