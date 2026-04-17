'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Clock, User2, Stethoscope, CalendarX, ArrowUpDown, Search, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from '@/lib/date-utils';
import type { EncounterForPreview } from '@/types/database.types';
import { usePatientStore } from '@/store/usePatientStore';
import { useLayoutStore } from '@/store/useLayoutStore';

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

type StatusConfig = {
    label: string;
    className: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
    'planned':     { label: 'Planificada', className: 'bg-muted/60 text-muted-foreground border-border/40' },
    'arrived':     { label: 'Llegó',       className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' },
    'triaged':     { label: 'Triaje',      className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
    'in-progress': { label: 'En curso',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
    'finished':    { label: 'Finalizada',  className: 'bg-primary/5 text-primary border-primary/20' },
    'cancelled':   { label: 'Cancelada',   className: 'bg-destructive/5 text-destructive border-destructive/20' },
    'onleave':     { label: 'Pausa',       className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800' },
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
                    <p className="text-[12px] text-muted-foreground max-w-[280px] mx-auto">
                        Aún no se han registrado encuentros clínicos para este periodo. Inicia una nueva consulta desde la agenda.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-[11px] h-8 font-bold gap-2 shadow-sm"
                    onClick={() => router.push('/appointments')}
                >
                    <Plus className="w-3.5 h-3.5" />
                    Ir a Agenda
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
            <div className="overflow-x-auto min-h-0 flex-1">
                <table className="w-full border-separate border-spacing-0 table-fixed bg-background">
                    <thead className="sticky top-0 z-30 bg-muted/80 backdrop-blur-sm">
                    <tr>
                        <th className="text-left px-4 h-10 border-b border-border text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 whitespace-nowrap group/header cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Fecha
                                <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity ml-1" />
                            </div>
                        </th>
                        <th className="text-left px-4 h-10 border-b border-border text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 group/header cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-1.5">
                                <User2 className="w-3.5 h-3.5" /> Paciente
                                <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity ml-1" />
                            </div>
                        </th>
                        <th className="text-left px-4 h-10 border-b border-border text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 hidden md:table-cell group/header cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-1.5">
                                <Stethoscope className="w-3.5 h-3.5" /> Tipo
                                <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity ml-1" />
                            </div>
                        </th>
                        <th className="text-left px-4 h-10 border-b border-border text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 group/header cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-1.5">
                                Estado
                                <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity ml-1" />
                            </div>
                        </th>
                        <th className="text-left px-4 h-10 border-b border-border text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 hidden lg:table-cell group/header cursor-pointer hover:text-foreground transition-colors">
                            Motivo
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity ml-1" />
                        </th>
                        <th className="text-left px-4 h-10 border-b border-border text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 hidden lg:table-cell group/header cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Duración
                                <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity ml-1" />
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-sidebar font-sans">
                    {encounters.map((enc) => {
                        const status = enc.status || 'planned';
                        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['planned'];
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
                                className="group transition-all duration-75 even:bg-muted/[0.02] hover:bg-muted/50 dark:hover:bg-muted/30 cursor-pointer border-b border-border/20 last:border-0"
                            >
                                {/* Fecha */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {formatDate(enc.start_time)}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5 tracking-tighter">
                                        {formatTime(enc.start_time)}
                                    </div>
                                </td>

                                {/* Paciente */}
                                <td className="px-4 py-3">
                                    <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[180px]">
                                        {patientName}
                                    </div>
                                    {age && (
                                        <div className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium">{age}</div>
                                    )}
                                </td>

                                {/* Tipo */}
                                <td className="px-4 py-3 hidden md:table-cell">
                                    <Badge variant="outline" className="text-[10px] font-medium border-border/40 text-muted-foreground px-2 py-0.5">
                                        {category}
                                    </Badge>
                                </td>

                                {/* Estado */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${cfg.className}`}>
                                        {cfg.label}
                                    </Badge>
                                </td>

                                {/* Motivo */}
                                <td className="px-4 py-3 hidden lg:table-cell max-w-[200px]">
                                    <p className="text-xs text-muted-foreground truncate" title={reason}>
                                        {reason}
                                    </p>
                                </td>

                                {/* Duración */}
                                <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
                                    <span className="text-xs text-muted-foreground font-mono">
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
