'use client';

import React from 'react';
import { CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import type { MedicationRequestStatus } from '@/lib/fhir/types';

const STATUS_CONFIG: Record<MedicationRequestStatus | 'unknown', { label: string; variant: 'pill-success' | 'pill-warning' | 'pill-danger' | 'pill-neutral' | 'pill-info' }> = {
    'draft':     { label: 'Borrador',   variant: 'pill-neutral' },
    'active':    { label: 'Activa',     variant: 'pill-success' },
    'on-hold':   { label: 'Pausada',   variant: 'pill-warning' },
    'completed':  { label: 'Completada', variant: 'pill-neutral' },
    'cancelled': { label: 'Cancelada',  variant: 'pill-danger'  },
    'stopped':   { label: 'Detenida',   variant: 'pill-danger'  },
    'unknown':   { label: 'Desconocido', variant: 'pill-neutral' },
};

interface PrescriptionDetailHeaderProps {
    prescriptionNumber: string | null;
    status: MedicationRequestStatus | null;
    authoredOn: string | null;
    validUntil: string | null;
}

function isExpired(validUntil: string | null): boolean {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
}

export function PrescriptionDetailHeader({
    prescriptionNumber,
    status,
    authoredOn,
    validUntil,
}: PrescriptionDetailHeaderProps) {
    const currentStatus = status as MedicationRequestStatus | 'unknown';
    const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG['unknown'];

    return (
        <div className="flex items-center gap-4">
            <div
                className="w-10 h-10 rounded-[6px] bg-b-2 flex items-center justify-center shrink-0"
                aria-hidden="true"
            >
                <span className="text-b-8 text-sm font-bold font-mono tracking-tight">Rx</span>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1
                        id="prescription-title"
                        className="text-base font-bold text-n-11 tracking-tight"
                    >
                        Receta médica
                    </h1>
                    <Badge variant={config.variant} className="text-[10px] font-semibold">
                        {config.label}
                    </Badge>
                    {prescriptionNumber && (
                        <span className="text-[11px] font-mono text-n-8 bg-n-2 px-1.5 py-0.5 rounded border border-n-5/30">
                            {prescriptionNumber}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-n-8 font-mono">
                        {authoredOn ? formatDate(authoredOn) : '—'}
                    </span>
                    {validUntil && (
                        <div className="flex items-center gap-1">
                            <CalendarClock className="w-3 h-3 text-n-8 shrink-0" aria-hidden="true" />
                            <span className="text-[11px] text-n-8 font-mono">
                                Vence: {formatDate(validUntil)}
                            </span>
                            {isExpired(validUntil) && (
                                <Badge variant="pill-danger" className="text-[10px] font-semibold">
                                    Vencida
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
