'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ExternalLink,
    Edit2,
    Trash,
    Bot,
    Plus,
    AlertCircle,
    X,
    Calendar,
    ChevronRight,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getPatientClinicalData } from '@/actions/patients';
import { getEncounters } from '@/actions/encounters';
import { formatDate, calcAge, getGenderLabel } from '@/lib/clinical';
import type { Patient, Condition, AllergyIntolerance, EncounterWithClinicalNote } from '@/types/database.types';
import type { PatientTelecom, PatientAddress, PatientIdentifier } from '@/types/patient-jsonb';

interface AIPatientPanelProps {
    patient: Patient;
    onClose: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PropertyGridItem({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
    return (
        <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-2' : 'col-span-1'}`}>
            <span className="text-[11px] font-bold text-muted-foreground/70">{label}</span>
            <span className="text-[13px] font-medium text-foreground/90 tracking-tight">
                {value || '—'}
            </span>
        </div>
    );
}

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

// ─── Main Sidebar Component ───────────────────────────────────────────────────

export default function AIPatientPanel({ patient, onClose }: AIPatientPanelProps) {
    const router = useRouter();
    const [clinicalData, setClinicalData] = useState<{
        conditions: Condition[];
        allergies: AllergyIntolerance[];
        encounters: EncounterWithClinicalNote[];
    }>({ conditions: [], allergies: [], encounters: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [clinData, encData] = await Promise.all([
                    getPatientClinicalData(patient.id),
                    getEncounters(patient.id),
                ]);
                if (isMounted) {
                    setClinicalData({
                        conditions: (clinData.conditions || []) as Condition[],
                        allergies: (clinData.allergies || []) as AllergyIntolerance[],
                        encounters: (encData.data || []) as EncounterWithClinicalNote[],
                    });
                }
            } catch (err) {
                console.error('Error fetching patient details:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [patient.id]);

    // Parse JSON fields if they're strings
    const telecom = typeof patient.telecom === 'string'
      ? JSON.parse(patient.telecom as string)
      : patient.telecom;
    const address = typeof patient.address === 'string'
      ? JSON.parse(patient.address as string)
      : patient.address;
    const identifiers = typeof patient.identifiers === 'string'
      ? JSON.parse(patient.identifiers as string)
      : patient.identifiers;

    const phone = Array.isArray(telecom) ? telecom.find(t => t.system === 'phone')?.value : undefined;
    const email = Array.isArray(telecom) ? telecom.find(t => t.system === 'email')?.value : undefined;
    const addressText = Array.isArray(address) ? address[0]?.text : undefined;
    const docId = Array.isArray(identifiers) ? identifiers[0]?.value : undefined;
    const patientFullName = `${patient.name_family}, ${patient.name_given?.join(' ')}`;

    // Máximo 3 consultas recientes
    const recentEncounters = clinicalData.encounters.slice(0, 3);

    return (
        <div className="flex flex-col h-full bg-sidebar border-l border-border/40">

            {/* ── HEADER h-12 ── */}
            <div className="flex items-center justify-between px-4 h-12 border-b border-border/40 shrink-0">
                <h2 className="text-sm font-semibold text-foreground truncate max-w-[200px]">
                    {patientFullName}
                </h2>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-muted"
                        onClick={() => router.push(`/patients/${patient.id}`)}
                        title="Abrir expediente completo"
                    >
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md hover:bg-muted"
                        onClick={onClose}
                    >
                        <X className="w-3.5 h-3.5 opacity-60" />
                    </Button>
                </div>
            </div>

            {/* ── CONTENIDO — scroll vertical continuo, sin tabs ── */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-5">

                {/* ── DATOS PERSONALES ── */}
                <CollapsibleSection title="Datos personales" defaultOpen>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                        <PropertyGridItem label="Cédula" value={docId || '—'} />
                        <PropertyGridItem label="Género" value={getGenderLabel(patient.gender)} />
                        <PropertyGridItem label="Nacimiento" value={formatDate(patient.birth_date)} />
                        <PropertyGridItem label="Edad" value={`${calcAge(patient.birth_date)} años`} />
                        {phone && <PropertyGridItem label="Teléfono" value={phone} />}
                        {email && <PropertyGridItem label="Correo" value={email} fullWidth />}
                        {addressText && <PropertyGridItem label="Dirección" value={addressText} fullWidth />}
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button variant="outline" className="w-full justify-start gap-2 h-8 text-xs border-border/60 hover:bg-primary/5 hover:text-primary transition-colors duration-100">
                            <Edit2 className="w-3.5 h-3.5" /> Editar perfil
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2 h-8 text-xs border-border/60 transition-colors duration-100">
                            <Calendar className="w-3.5 h-3.5" /> Programar cita
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2 h-8 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20 transition-colors duration-100">
                            <Trash className="w-3.5 h-3.5" /> Archivar paciente
                        </Button>
                    </div>
                </CollapsibleSection>

                <Separator className="bg-border/20" />

                {/* ── ANTECEDENTES ── */}
                <CollapsibleSection title="Antecedentes" defaultOpen>
                    {/* Condiciones */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-primary/80">Condiciones</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md hover:bg-primary/10 hover:text-primary transition-colors duration-100">
                                <Plus className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        {loading ? (
                            <Skeleton className="h-10 w-full rounded-lg" />
                        ) : clinicalData.conditions.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground/50 italic">Sin condiciones registradas</p>
                        ) : (
                            <div className="space-y-1">
                                {clinicalData.conditions.map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors duration-100 border-b border-border/20 last:border-0">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="text-[12px] font-bold text-foreground/90 leading-tight truncate">{c.code_display}</span>
                                            <span className="text-[10px] text-muted-foreground tabular-nums">{c.code} · {formatDate(c.onset_date)}</span>
                                        </div>
                                        <Badge variant={c.clinical_status === 'active' ? 'pill-success' : 'pill-neutral'} className="text-[10px] shrink-0 ml-2">
                                            {c.clinical_status === 'active' ? 'Activa' : 'Resuelta'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Alergias */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-primary/80">Alergias</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md hover:bg-primary/10 hover:text-primary transition-colors duration-100">
                                <Plus className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        {loading ? (
                            <Skeleton className="h-10 w-full rounded-lg" />
                        ) : clinicalData.allergies.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground/50 italic">Sin alergias conocidas</p>
                        ) : (
                            <div className="space-y-1">
                                {clinicalData.allergies.map(a => (
                                    <div key={a.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors duration-100 border-b border-border/20 last:border-0">
                                        <AlertCircle className="w-3 h-3 text-destructive/70 shrink-0" />
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-[12px] font-bold text-destructive/80 truncate leading-tight">{a.code_display}</span>
                                            <span className="text-[10px] text-muted-foreground">{a.criticality || 'Normal'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                <Separator className="bg-border/20" />

                {/* ── CONSULTAS RECIENTES ── */}
                <CollapsibleSection title="Consultas recientes" defaultOpen>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-14 w-full rounded-lg" />
                            <Skeleton className="h-14 w-full rounded-lg" />
                        </div>
                    ) : recentEncounters.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground/50 italic">Sin consultas previas</p>
                    ) : (
                        <div className="space-y-2">
                            {recentEncounters.map(enc => {
                                const reasonArr = Array.isArray(enc.clinical_note?.reason_code)
                                    ? (enc.clinical_note.reason_code as { text?: string }[])
                                    : [];
                                const reason = reasonArr[0]?.text || 'Sin motivo registrado';
                                return (
                                    <button
                                        key={enc.id}
                                        onClick={() => router.push(`/history?encounterId=${enc.id}`)}
                                        className="w-full text-left p-3 rounded-md border border-border/40 bg-card hover:bg-muted/40 hover:border-primary/20 transition-all duration-100 group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-bold text-foreground/90 tabular-nums">
                                                {formatDate(enc.start_time)}
                                            </span>
                                            <Badge
                                                variant={enc.status === 'finished' ? 'pill-success' : 'pill-info'}
                                                className="text-[10px]"
                                            >
                                                {enc.status === 'finished' ? 'Cerrada' : 'Abierta'}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 italic">
                                            {reason}
                                        </p>
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => router.push(`/history/all?patientId=${patient.id}`)}
                                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors duration-100 text-primary/70 hover:text-primary group mt-1"
                            >
                                <span className="text-[11px] font-semibold">Ver todas las consultas</span>
                                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    )}
                </CollapsibleSection>
            </div>

            {/* ── FOOTER IA ── */}
            <div className="p-4 border-t border-border/40 bg-primary/[0.02] shrink-0">
                <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] font-bold text-primary/80">IA clínico</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    Analiza tendencias y sugiere diagnósticos basados en la historia clínica.
                </p>
                <Button className="w-full h-8 text-[11px] font-bold gap-2 transition-colors duration-100">
                    Generar reporte clínico
                </Button>
            </div>
        </div>
    );
}
