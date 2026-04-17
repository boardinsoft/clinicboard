'use client';

import React from 'react';
import { formatDate } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, CalendarDays } from 'lucide-react';
import type { Patient, EncounterWithClinicalNote } from '@/types/database.types';

interface HistoryPatientPanelProps {
    selectedPatient: Patient | null;
    encounters: EncounterWithClinicalNote[];
    activeEncounterId: string | null;
    onSelectEncounter: (id: string | null, enc: EncounterWithClinicalNote | null) => void;
    isLoading: boolean;
    onNewEncounter: () => void;
}

const STATUS_LABELS: Record<string, string> = {
    'in-progress': 'En curso',
    'finished':    'Finalizada',
    'planned':     'Planificada',
    'arrived':     'Llegó',
    'cancelled':   'Cancelada',
};

export default function HistoryPatientPanel({
    selectedPatient,
    encounters,
    activeEncounterId,
    onSelectEncounter,
    isLoading,
    onNewEncounter,
}: HistoryPatientPanelProps) {
    if (!selectedPatient) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                <CalendarDays className="w-8 h-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/50">
                    Selecciona un paciente para ver su historial
                </p>
            </div>
        );
    }

    const patientName = `${selectedPatient.name_family}, ${selectedPatient.name_given?.join(' ')}`;

    return (
        <div className="flex flex-col h-full">
            {/* Patient name */}
            <div className="px-4 pt-3 pb-2 border-b border-border/30">
                <p className="text-xs font-semibold text-foreground truncate">{patientName}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    {encounters.length} consulta{encounters.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* New encounter button */}
            <div className="px-3 py-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-[11px] gap-1.5 border-border/60"
                    onClick={onNewEncounter}
                >
                    <Plus className="w-3 h-3" /> Nueva consulta
                </Button>
            </div>

            {/* Encounter list */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-2">
                {isLoading ? (
                    <div className="space-y-2 px-2">
                        <Skeleton className="h-14 w-full rounded-md" />
                        <Skeleton className="h-14 w-full rounded-md" />
                        <Skeleton className="h-14 w-full rounded-md" />
                    </div>
                ) : encounters.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/40 italic px-2 pt-3">
                        Sin consultas previas
                    </p>
                ) : (
                    encounters.map(enc => {
                        const isActive = enc.id === activeEncounterId;
                        const statusLabel = STATUS_LABELS[enc.status || ''] || enc.status || '—';
                        const reasonArr = Array.isArray(enc.clinical_note?.reason_code)
                            ? (enc.clinical_note!.reason_code as { text?: string }[])
                            : [];
                        const reason = reasonArr[0]?.text || '—';

                        return (
                            <button
                                key={enc.id}
                                onClick={() => onSelectEncounter(enc.id, enc)}
                                className={`w-full text-left px-3 py-2.5 rounded-md mb-1 transition-all duration-100 border ${
                                    isActive
                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                        : 'border-transparent hover:bg-muted/40 hover:border-border/30'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-medium tabular-nums text-foreground/80">
                                        {formatDate(enc.start_time)}
                                    </span>
                                    <Badge
                                        variant={enc.status === 'finished' ? 'pill-success' : 'pill-info'}
                                        className="text-[9px] px-1.5"
                                    >
                                        {statusLabel}
                                    </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 italic">
                                    {reason}
                                </p>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
