'use client';

import React from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { formatDate } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSearch, FilePlus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient, EncounterWithClinicalNote } from '@/types/database.types';

interface HistoryPatientPanelProps {
    selectedPatient?: Patient | null;
    encounters?: EncounterWithClinicalNote[];
    activeEncounterId?: string | null;
    onSelectEncounter?: (id: string | null, enc: EncounterWithClinicalNote | null) => void;
    isLoading?: boolean;
    onNewEncounter?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
    'in-progress': 'En curso',
    'finished':    'Finalizada',
    'planned':     'Planificada',
    'arrived':     'Llegó',
    'cancelled':   'Cancelada',
};

export default function HistoryPatientPanel({
    selectedPatient = null,
    encounters = [],
    activeEncounterId = null,
    onSelectEncounter,
    isLoading = false,
    onNewEncounter,
}: HistoryPatientPanelProps) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const slug = (params.clinicSlug as string) || '';

    const isAllActive = pathname === `/${slug}/history/all`;
    const isNewEncounterActive = pathname === `/${slug}/history` && !activeEncounterId;

    const patientName = selectedPatient
        ? `${selectedPatient.name_family}, ${selectedPatient.name_given?.join(' ')}`
        : null;

    return (
        <div className="flex flex-col h-full bg-n-2 border-r border-border/40 font-sans">

            {/* ── HEADER DEL MÓDULO (h-12) ── */}
            <div className="flex items-center h-12 px-4 border-b border-border/40 shrink-0">
                <span className="text-base font-semibold text-foreground tracking-tight">
                    Historia clínica
                </span>
            </div>

            {/* ── NAVEGACIÓN ── */}
            <div className="py-2">
                {/* Todas las consultas */}
                <button
                    onClick={() => router.push(`/${slug}/history/all`)}
                    className={cn(
                        "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors",
                        isAllActive
                            ? "text-b-8 bg-b-2/60"
                            : "text-foreground/80 hover:bg-n-3 hover:text-foreground"
                    )}
                >
                    <FileSearch className="w-4 h-4 text-n-8" strokeWidth={1.8} />
                    Todas las consultas
                </button>

                {/* Nueva consulta */}
                <button
                    onClick={() => router.push(`/${slug}/history`)}
                    className={cn(
                        "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors",
                        isNewEncounterActive
                            ? "text-b-8 bg-b-2/60"
                            : "text-foreground/80 hover:bg-n-3 hover:text-foreground"
                    )}
                >
                    <FilePlus className="w-4 h-4 text-n-8" strokeWidth={1.8} />
                    Nueva consulta
                </button>
            </div>

            {/* ── SEPARADOR ── */}
            <div className="h-px bg-border/40 mx-4" />

            {/* ── PACIENTE SELECCIONADO ── */}
            {patientName ? (
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Patient header */}
                    <div className="px-4 pt-3 pb-2">
                        <p className="text-xs font-semibold text-foreground truncate">{patientName}</p>
                        <p className="text-[10px] text-n-8 mt-0.5">
                            {encounters.length} consulta{encounters.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* New encounter button */}
                    {onNewEncounter && (
                        <div className="px-3 pb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-7 text-[11px] gap-1.5 border-n-5 hover:bg-n-3 transition-colors"
                                onClick={onNewEncounter}
                            >
                                <Plus className="w-3 h-3" strokeWidth={2} />
                                Nueva consulta
                            </Button>
                        </div>
                    )}

                    {/* Encounter list */}
                    <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-2">
                        {isLoading ? (
                            <div className="space-y-2 px-2">
                                <Skeleton className="h-14 w-full rounded-md" />
                                <Skeleton className="h-14 w-full rounded-md" />
                                <Skeleton className="h-14 w-full rounded-md" />
                            </div>
                        ) : encounters.length === 0 ? (
                            <p className="text-[11px] text-n-8 italic px-2 pt-3">
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
                                        onClick={() => onSelectEncounter?.(enc.id, enc)}
                                        className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-md mb-1 transition-all duration-100 border",
                                            isActive
                                                ? "bg-b-2 border-b-8/30 text-b-8"
                                                : "border-transparent hover:bg-n-3 hover:border-n-5"
                                        )}
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
                                        <p className="text-[10px] text-n-8 leading-snug line-clamp-2">
                                            {reason}
                                        </p>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
