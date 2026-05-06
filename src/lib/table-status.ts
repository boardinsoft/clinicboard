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