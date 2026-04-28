'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronUp,
    ChevronDown,
    ExternalLink,
    X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getClinicalNote } from '@/actions/clinicalNotes';
import { getAddenda } from '@/actions/encounters';
import { formatDate, formatTime } from '@/lib/date-utils';
import { calcAge } from '@/lib/clinical';
import type { EncounterForPreview, ClinicalNote } from '@/types/database.types';

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

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
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

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50">
            {children}
        </span>
    );
}

function CollapsibleSection({ title, children, defaultOpen = true }: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div>
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center justify-between w-full py-1 group"
            >
                <SectionLabel>{title}</SectionLabel>
                {open
                    ? <ChevronUp className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    : <ChevronDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                }
            </button>
            {open && <div className="mt-3">{children}</div>}
        </div>
    );
}

function PropRow({ label, value, mono }: { label: string; value: string | React.ReactNode; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-neutral-8 uppercase tracking-wider">{label}</span>
            <span className={cn(
                "text-[13px] font-medium text-foreground",
                mono ? "mono" : "font-sans"
            )}>
                {value || '—'}
            </span>
        </div>
    );
}

function SoapBlock({ label, content }: { label: string; content?: string | null }) {
    if (!content?.trim()) return null;
    return (
        <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-8">{label}</span>
            <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
    );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface EncounterDetailPanelProps {
    encounter: EncounterForPreview;
    onClose: () => void;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EncounterDetailPanel({ encounter, onClose }: EncounterDetailPanelProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'resumen' | 'nota' | 'diagnosticos'>('resumen');
    const [fullNote, setFullNote] = useState<ClinicalNote | null>(null);
    const [noteLoading, setNoteLoading] = useState(false);
    const [addenda, setAddenda] = useState<{ id: string; note: string; created_at: string | null }[]>([]);

    // Reset state when encounter changes
    useEffect(() => {
        setFullNote(null);
        setActiveTab('resumen');
        setAddenda([]);
    }, [encounter.id]);

    // Lazy-load full clinical note when entering nota/diagnosticos tabs
    useEffect(() => {
        if ((activeTab === 'nota' || activeTab === 'diagnosticos') && !fullNote && !noteLoading) {
            setNoteLoading(true);
            getClinicalNote(encounter.id).then(({ data }) => {
                setFullNote(data ?? null);
                setNoteLoading(false);
            });
        }
    }, [activeTab, encounter.id, fullNote, noteLoading]);

    // Load addenda if note is finalized
    useEffect(() => {
        if (activeTab === 'diagnosticos' && fullNote?.is_finalized && addenda.length === 0) {
            getAddenda(encounter.id).then(({ data }) => {
                if (data) setAddenda(data as typeof addenda);
            });
        }
    }, [activeTab, fullNote?.is_finalized, encounter.id, addenda.length]);

    // Computed display values
    const note = fullNote ?? encounter.clinical_note;
    const hasNote = !!(note?.subjective?.trim() || note?.objective?.trim() || note?.analysis?.trim() || note?.plan?.trim());
    const diagnosisArr = Array.isArray(note?.diagnosis) ? (note.diagnosis as { code?: string; display?: string; system?: string }[]) : [];
    const hasDiagnosis = diagnosisArr.length > 0;

    const status = encounter.status || 'planned';
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['planned'];

    const patientName = encounter.patient
        ? `${encounter.patient.name_family}, ${(encounter.patient.name_given || []).join(' ')}`
        : '—';
    const age = calcAge(encounter.patient?.birth_date);

    const classLabel = CLASS_LABELS[encounter.encounter_class || ''] || encounter.encounter_class || '—';
    const category = encounter.encounter_category || classLabel;

    const reasonArr = Array.isArray(encounter.clinical_note?.reason_code)
        ? (encounter.clinical_note.reason_code as { text?: string }[])
        : [];
    const reason = reasonArr[0]?.text || '—';

    const practitionerName = encounter.practitioner
        ? `${encounter.practitioner.name_family}, ${(encounter.practitioner.name_given || []).join(' ')}`
        : '—';

    return (
        <div className="flex flex-col h-full bg-background">

            {/* ── Header h-12 ── */}
            <div className="flex items-center justify-between h-12 px-4 border-b border-border/40 shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">{patientName}</span>
                    {age && <span className="text-[11px] text-muted-foreground/60 shrink-0">{age}</span>}
                    <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold px-1.5 py-0 shrink-0 ${cfg.className}`}
                    >
                        {cfg.label}
                    </Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-muted/40 transition-colors"
                        title="Abrir en editor"
                        onClick={() => router.push(`/history?encounterId=${encounter.id}`)}
                    >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-muted/40 transition-colors"
                        onClick={onClose}
                    >
                        <X className="w-3.5 h-3.5 text-muted-foreground/60" />
                    </Button>
                </div>
            </div>

            {/* ── Tabs (Supabase border-bottom style) ── */}
            <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                className="flex flex-col flex-1 min-h-0"
            >
                <TabsList className="w-full justify-start rounded-none border-b border-border/40 bg-transparent h-auto p-0 gap-0 shrink-0 px-2">
                    <TabsTrigger
                        value="resumen"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-[11px] font-semibold text-muted-foreground/60 data-[state=active]:text-foreground transition-all"
                    >
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger
                        value="nota"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-[11px] font-semibold text-muted-foreground/60 data-[state=active]:text-foreground transition-all flex items-center gap-1.5"
                    >
                        Nota clínica
                        {hasNote && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="diagnosticos"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 text-[11px] font-semibold text-muted-foreground/60 data-[state=active]:text-foreground transition-all flex items-center gap-1.5"
                    >
                        Diagnósticos
                        {hasDiagnosis && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* ── Resumen ── */}
                <TabsContent value="resumen" className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5 mt-0">
                    <CollapsibleSection title="Encuentro">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <PropRow label="Fecha" value={formatDate(encounter.start_time)} mono />
                            <PropRow label="Hora" value={formatTime(encounter.start_time)} mono />
                            <PropRow label="Duración" value={calcDuration(encounter.start_time, encounter.end_time)} mono />
                            <PropRow label="Tipo" value={category} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Paciente">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <PropRow label="Nombre" value={patientName} />
                            <PropRow label="Edad" value={age || '—'} mono />
                            {encounter.patient?.birth_date && (
                                <PropRow label="Fecha de nac." value={formatDate(encounter.patient.birth_date)} mono />
                            )}
                        </div>
                    </CollapsibleSection>

                    {encounter.practitioner && (
                        <CollapsibleSection title="Especialista">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <PropRow label="Nombre" value={practitionerName} />
                                {encounter.practitioner.specialty && (
                                    <PropRow label="Especialidad" value={encounter.practitioner.specialty} />
                                )}
                            </div>
                        </CollapsibleSection>
                    )}

                    {reason !== '—' && (
                        <CollapsibleSection title="Motivo de consulta">
                            <p className="text-[13px] text-foreground/85 leading-relaxed">{reason}</p>
                        </CollapsibleSection>
                    )}
                </TabsContent>

                {/* ── Nota clínica ── */}
                <TabsContent value="nota" className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5 mt-0">
                    {noteLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <>
                            <CollapsibleSection title="SOAP">
                                <div className="space-y-4">
                                    <SoapBlock label="Subjetivo (S)" content={fullNote?.subjective} />
                                    <SoapBlock label="Objetivo (O)" content={fullNote?.objective} />
                                    <SoapBlock label="Análisis (A)" content={fullNote?.analysis} />
                                    <SoapBlock label="Plan (P)" content={fullNote?.plan} />
                                    {!fullNote?.subjective && !fullNote?.objective && !fullNote?.analysis && !fullNote?.plan && (
                                        <p className="text-[12px] text-muted-foreground/50 italic">Sin nota SOAP registrada.</p>
                                    )}
                                </div>
                            </CollapsibleSection>

                            {fullNote?.evolution_note?.trim() && (
                                <CollapsibleSection title="Nota evolutiva">
                                    <p className="text-[13px] text-foreground/85 leading-relaxed whitespace-pre-wrap">
                                        {fullNote.evolution_note}
                                    </p>
                                </CollapsibleSection>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* ── Diagnósticos ── */}
                <TabsContent value="diagnosticos" className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5 mt-0">
                    {noteLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : (
                        <>
                            <CollapsibleSection title="Diagnósticos">
                                {diagnosisArr.length === 0 ? (
                                    <p className="text-[12px] text-muted-foreground/50 italic">Sin diagnósticos registrados.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {diagnosisArr.map((d, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                {d.code && (
                                                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-border/40 text-muted-foreground/60 shrink-0">
                                                        {d.code}
                                                    </Badge>
                                                )}
                                                <span className="text-[13px] text-foreground/85">{d.display || d.code || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CollapsibleSection>

                            {fullNote?.physical_exam && typeof fullNote.physical_exam === 'object' && Object.values(fullNote.physical_exam as Record<string, unknown>).some(Boolean) && (
                                <CollapsibleSection title="Examen físico" defaultOpen={false}>
                                    <div className="space-y-2">
                                        {Object.entries(fullNote.physical_exam as Record<string, unknown>).map(([key, val]) => {
                                            if (!val) return null;
                                            return (
                                                <PropRow
                                                    key={key}
                                                    label={key.replace(/_/g, ' ')}
                                                    value={String(val)}
                                                />
                                            );
                                        })}
                                    </div>
                                </CollapsibleSection>
                            )}

                            {addenda.length > 0 && (
                                <CollapsibleSection title="Addenda" defaultOpen={false}>
                                    <div className="space-y-3">
                                        {addenda.map((a) => (
                                            <div key={a.id} className="space-y-1">
                                                <span className="text-[10px] text-muted-foreground/50">{formatDate(a.created_at)}</span>
                                                <p className="text-[13px] text-foreground/85 whitespace-pre-wrap">{a.note}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CollapsibleSection>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
