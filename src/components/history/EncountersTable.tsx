'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Clock, User2, Stethoscope, ArrowUpDown, Search, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from '@/lib/date-utils';
import type { EncounterForPreview } from '@/types/database.types';
import { usePatientStore } from '@/store/usePatientStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcDuration(start: string, end: string | null): string {
    if (!end) return '—';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff <= 0) return '—';
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function calcAge(birthDate: string | null | undefined): string {
    if (!birthDate) return '';
    const today = new Date();
    const dob = new Date(birthDate);
    const age = today.getFullYear() - dob.getFullYear() -
        (today.getMonth() < dob.getMonth() ||
            (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0);
    return `${age}a`;
}

const STATUS_VARIANT: Record<string, "pill-success" | "pill-warning" | "pill-danger" | "pill-info" | "pill-neutral"> = {
    'planned':     'pill-neutral',
    'arrived':     'pill-warning',
    'triaged':     'pill-warning',
    'in-progress': 'pill-info',
    'finished':    'pill-success',
    'cancelled':   'pill-danger',
    'onleave':     'pill-neutral',
};

const STATUS_LABEL: Record<string, string> = {
    'planned':     'Planificada',
    'arrived':     'Llegó',
    'triaged':     'Triaje',
    'in-progress': 'En curso',
    'finished':    'Finalizada',
    'cancelled':   'Cancelada',
    'onleave':     'Pausa',
};

const CLASS_LABELS: Record<string, string> = {
    AMB:  'Ambulatorio',
    IMP:  'Hospitalario',
    EMER: 'Urgencia',
    HH:   'Domicilio',
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function EncountersTable({ encounters }: { encounters: EncounterForPreview[] }) {
    const router = useRouter();
    const { setSelectedEncounterForPreview } = usePatientStore();
    const { setRightPanelOpen } = useLayoutStore();

    if (encounters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center border border-dashed border-border">
                    <Search className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-foreground">No hay consultas registradas</h3>
                    <p className="text-[12px] text-n-8 max-w-[280px] mx-auto">
                        Aún no se han registrado encuentros clínicos para este periodo.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-8"
                    onClick={() => router.push('/appointments')}
                >
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    Ir a Agenda
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
            <div className="overflow-x-auto min-h-0 flex-1 no-scrollbar">
                <table className="table-clinic">
                    <thead className="sticky top-0 z-30 shadow-xs">
                    <tr>
                        <th>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Fecha
                            </div>
                        </th>
                        <th>
                            <div className="flex items-center gap-1.5">
                                <User2 className="w-3 h-3" /> Paciente
                            </div>
                        </th>
                        <th className="hidden md:table-cell">
                            <div className="flex items-center gap-1.5">
                                <Stethoscope className="w-3 h-3" /> Tipo
                            </div>
                        </th>
                        <th>Estado</th>
                        <th className="hidden lg:table-cell">Motivo</th>
                        <th className="hidden lg:table-cell text-right">
                            <div className="flex items-center justify-end gap-1.5">
                                <Clock className="w-3 h-3" /> Duración
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {encounters.map((enc) => {
                        const status = enc.status || 'planned';
                        const variant = STATUS_VARIANT[status] || 'pill-neutral';
                        const label = STATUS_LABEL[status] || status;
                        const patientName = enc.patient
                            ? `${enc.patient.name_family}, ${(enc.patient.name_given || []).join(' ')}`
                            : '—';
                        const age = calcAge(enc.patient?.birth_date);
                        const reasonArr = Array.isArray(enc.clinical_note?.reason_code)
                            ? (enc.clinical_note.reason_code as { text?: string }[])
                            : [];
                        const reason = reasonArr[0]?.text || '—';
                        const classLabel = CLASS_LABELS[enc.encounter_class || ''] || enc.encounter_class || '—';
                        const category = enc.encounter_category || classLabel;

                        return (
                            <tr
                                key={enc.id}
                                onClick={() => {
                                    setSelectedEncounterForPreview(enc);
                                    setRightPanelOpen(true);
                                }}
                                className="group transition-colors"
                            >
                                {/* Fecha */}
                                <td className="whitespace-nowrap">
                                    <div className="text-xs font-bold text-foreground group-hover:text-brand-8 transition-colors">
                                        {formatDate(enc.start_time)}
                                    </div>
                                    <div className="text-[10px] text-n-8 mono mt-0.5">
                                        {formatTime(enc.start_time)}
                                    </div>
                                </td>

                                {/* Paciente */}
                                <td>
                                    <div className="table-name truncate max-w-[180px]">
                                        {patientName}
                                    </div>
                                    {age && (
                                        <div className="text-[10px] text-n-8 mt-0.5 mono">{age}</div>
                                    )}
                                </td>

                                {/* Tipo */}
                                <td className="hidden md:table-cell">
                                    <Badge variant="secondary" className="px-1.5 h-4.5 text-[9px] uppercase tracking-tighter">
                                        {category}
                                    </Badge>
                                </td>

                                {/* Estado */}
                                <td className="whitespace-nowrap">
                                    <Badge variant={variant}>
                                        {label}
                                    </Badge>
                                </td>

                                {/* Motivo */}
                                <td className="hidden lg:table-cell max-w-[200px]">
                                    <p className="text-xs text-n-9 truncate" title={reason}>
                                        {reason}
                                    </p>
                                </td>

                                {/* Duración */}
                                <td className="hidden lg:table-cell whitespace-nowrap text-right">
                                    <span className="text-[11px] text-n-8 mono">
                                        {calcDuration(enc.start_time, enc.end_time)}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
    );
}
