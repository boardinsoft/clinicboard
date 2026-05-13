'use client';

import React from 'react';
import { Calendar, Clock, Stethoscope, Activity, FileText, UserCircle, AlertCircle, Plus } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyStatePresentational } from '@/components/ui/EmptyStatePresentational';
import { cn } from '@/lib/utils';
import { formatDate, formatTime } from '@/lib/date-utils';
import type { Tables, Json } from '@/types/database.types';

type ClinicalNote = Tables<'clinical_notes'>;
type Encounter = Tables<'encounters'>;

type EncounterDetailProps = {
    encounter: {
        id: string;
        appointment_id?: string | null;
        clinic_id?: string | null;
        patient_id?: string | null;
        practitioner_id?: string | null;
        start_time: string;
        end_time?: string | null;
        status?: string | null;
        encounter_class?: string | null;
        encounter_category?: string | null;
        encounter_subcategory?: string | null;
        reason_code?: Json;
        vital_signs?: Json | null;
        clinical_note?: {
            id: string;
            encounter_id: string;
            clinic_id?: string | null;
            evolution_note?: string | null;
            subjective?: string | null;
            objective?: string | null;
            analysis?: string | null;
            plan?: string | null;
            diagnosis?: Json;
            reason_code?: Json;
            physical_exam?: Json;
            is_finalized?: boolean | null;
            created_at?: string | null;
            updated_at?: string | null;
        } | null;
        patient?: {
            id: string;
            name_given?: string[] | null;
            name_family: string;
            birth_date?: string | null;
            gender?: string | null;
        } | null;
        practitioner?: {
            name_given?: string[] | null;
            name_family: string;
            specialty?: string | null;
        } | null;
    };
    addenda?: Array<{
        id: string;
        content: string;
        created_at?: string | null;
        author?: { name_family: string; name_given?: string[] | null } | null;
    }>;
    onClose?: () => void;
};

type VitalSigns = {
    temperature?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    heart_rate?: number;
    oxygen_saturation?: number;
    weight?: number;
    height?: number;
};

type PhysicalExam = {
    headNeck?: { normal: boolean; notes: string };
    thorax?: { normal: boolean; notes: string };
    abdomen?: { normal: boolean; notes: string };
    pelvis?: { normal: boolean; notes: string };
    extremities?: { normal: boolean; notes: string };
    neurological?: { normal: boolean; notes: string };
    skin?: { normal: boolean; notes: string };
};

type DiagnosisEntry = {
    code: string;
    description: string;
    type: 'primary' | 'secondary' | 'other';
};

const ENCOUNTER_STATUS_LABELS: Record<string, string> = {
    'in-progress': 'En curso',
    'finished': 'Finalizada',
    'planned': 'Planificada',
    'arrived': 'Llegó',
    'cancelled': 'Cancelada',
    'triaged': 'Triaje',
    'onleave': 'Pausa',
};

const CLASS_LABELS: Record<string, string> = {
    AMB: 'Ambulatorio',
    IMP: 'Hospitalario',
    EMER: 'Urgencia',
    HH: 'Domicilio',
};

function PropertyItem({ label, value, className, mono }: { label: string; value: string | undefined; className?: string; mono?: boolean }) {
    return (
        <div className={cn("flex flex-col gap-1 py-3", className)}>
            <span className="text-xs font-semibold uppercase tracking-wider text-n-8">{label}</span>
            <span className={cn(
                "text-sm font-medium text-n-11",
                mono ? "font-mono tracking-tight" : "font-sans tracking-tight"
            )}>
                {value || '—'}
            </span>
        </div>
    );
}

function calcDuration(start: string, end: string | null): string {
    if (!end) return '—';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff <= 0) return '—';
    const mins = Math.round(diff / 60000);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) return `${hours}h ${remainingMins}m`;
    return `${mins}m`;
}

export default function EncounterDetailView({ encounter, addenda }: EncounterDetailProps) {
    const router = useRouter();
    const params = useParams();
    const slug = (params.clinicSlug as string) || '';

    const patient = encounter.patient;
    const practitioner = encounter.practitioner;
    const clinicalNote = encounter.clinical_note;

    const patientName = patient
        ? `${patient.name_family}, ${(patient.name_given || []).join(' ')}`
        : '—';

    const statusLabel = ENCOUNTER_STATUS_LABELS[encounter.status || ''] || encounter.status || '—';
    const classLabel = CLASS_LABELS[encounter.encounter_class || ''] || encounter.encounter_class || '—';
    const duration = calcDuration(encounter.start_time, encounter.end_time ?? null);

    const reasonCode = Array.isArray(clinicalNote?.reason_code)
        ? (clinicalNote!.reason_code as Array<{ text?: string }>)[0]?.text
        : undefined;

    const diagnoses = Array.isArray(clinicalNote?.diagnosis)
        ? (clinicalNote!.diagnosis as DiagnosisEntry[])
        : [];

    const vitalSigns = (encounter.vital_signs as VitalSigns | null) || {};

    const physicalExam = (clinicalNote?.physical_exam as PhysicalExam | null);

    const vitalsEntries = [
        { label: 'Temperatura', value: vitalSigns.temperature ? `${vitalSigns.temperature} °C` : undefined, unit: '' },
        { label: 'PA', value: vitalSigns.blood_pressure_systolic && vitalSigns.blood_pressure_diastolic ? `${vitalSigns.blood_pressure_systolic}/${vitalSigns.blood_pressure_diastolic} mmHg` : undefined, unit: '' },
        { label: 'FC', value: vitalSigns.heart_rate ? `${vitalSigns.heart_rate} lpm` : undefined, unit: '' },
        { label: 'SpO₂', value: vitalSigns.oxygen_saturation ? `${vitalSigns.oxygen_saturation} %` : undefined, unit: '' },
        { label: 'Peso', value: vitalSigns.weight ? `${vitalSigns.weight} kg` : undefined, unit: '' },
        { label: 'Talla', value: vitalSigns.height ? `${vitalSigns.height} cm` : undefined, unit: '' },
    ].filter(v => v.value !== undefined);

    const examSections = [
        { key: 'headNeck', label: 'Cabeza y Cuello' },
        { key: 'thorax', label: 'Tórax' },
        { key: 'abdomen', label: 'Abdomen' },
        { key: 'pelvis', label: 'Pelvis' },
        { key: 'extremities', label: 'Extremidades' },
        { key: 'neurological', label: 'Neurológico' },
        { key: 'skin', label: 'Piel' },
    ] as const;

    const activeTab = 'overview';

    return (
        <div className="h-full flex flex-col bg-n-2 font-sans">
            {/* ── HEADER ── */}
            <div className="px-6 py-6 border-b border-n-5/30 bg-n-1">
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 border-2 border-n-5/20 bg-b-8/10 text-b-8">
                        <Stethoscope className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-n-11 tracking-tight leading-tight">
                            {patientName}
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-n-8">{formatDate(encounter.start_time)}</span>
                            <span className="text-xs text-n-8">·</span>
                            <span className="text-xs text-n-8">{formatTime(encounter.start_time)}</span>
                            {practitioner && (
                                <>
                                    <span className="text-xs text-n-8">·</span>
                                    <span className="text-xs text-n-8">Dr. {practitioner.name_family}</span>
                                </>
                            )}
                            <Badge variant="pill-success" className="text-[10px] py-0.5">
                                {statusLabel}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-b-8/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-b-8" />
                        </div>
                        <button
                            onClick={() => router.push(`/${slug}/history?patientId=${patient?.id}&encounterId=${encounter.id}`)}
                            className="h-8 px-3 flex items-center gap-2 text-[11px] font-bold border border-n-5 rounded-md bg-n-1 hover:bg-n-2 transition-colors"
                        >
                            Ver en historial
                        </button>
                    </div>
                </div>

                <Tabs value={activeTab} className="gap-0">
                    <TabsList className="w-full justify-start gap-1 bg-transparent p-0 h-auto border-0">
                        {[
                            { value: 'overview', label: 'Resumen', icon: UserCircle },
                            { value: 'clinical', label: 'Nota Clínica', icon: FileText },
                            { value: 'diagnoses', label: 'Diagnósticos', icon: Stethoscope },
                            { value: 'vitals', label: 'Signos Vitales', icon: Activity },
                            { value: 'addenda', label: 'Addenda', icon: Plus },
                        ].map(({ value, label, icon: Icon }) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md data-[state=active]:bg-b-8 data-[state=active]:text-white text-n-8 hover:text-n-12 hover:bg-n-3 transition-all duration-150"
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* ── PANEL: RESUMEN ── */}
                <div className="max-w-4xl mx-auto p-6 space-y-6">
                    <Card className="bg-n-1">
                        <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                            <h2 className="text-sm font-bold text-foreground">Datos del encuentro</h2>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Información general de la consulta clínica.</p>
                        </div>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-n-5/30">
                                <div className="p-6">
                                    <PropertyItem label="Fecha" value={formatDate(encounter.start_time)} mono />
                                </div>
                                <div className="p-6">
                                    <PropertyItem label="Hora" value={formatTime(encounter.start_time)} mono />
                                </div>
                                <div className="p-6">
                                    <PropertyItem label="Duración" value={duration} mono />
                                </div>
                                <div className="p-6">
                                    <PropertyItem label="Tipo" value={classLabel} />
                                </div>
                                <div className="p-6">
                                    <PropertyItem label="Categoría" value={encounter.encounter_category || '—'} />
                                </div>
                                <div className="p-6">
                                    <PropertyItem label="Subcategoría" value={encounter.encounter_subcategory || '—'} />
                                </div>
                                <div className="p-6">
                                    <PropertyItem label="Estado" value={statusLabel} />
                                </div>
                                <div className="p-6 lg:col-span-2">
                                    <PropertyItem label="Motivo de consulta" value={reasonCode || '—'} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-n-1">
                        <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                            <h2 className="text-sm font-bold text-foreground">Profesional a cargo</h2>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Médico responsable de la consulta.</p>
                        </div>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y divide-n-5/30">
                                <div className="p-6">
                                    <PropertyItem
                                        label="Nombre"
                                        value={practitioner
                                            ? `Dr. ${practitioner.name_given?.join(' ') || ''} ${practitioner.name_family}`.trim()
                                            : '—'}
                                    />
                                </div>
                                <div className="p-6">
                                    <PropertyItem label="Especialidad" value={practitioner?.specialty || '—'} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {reasonCode && (
                        <Card className="bg-n-1">
                            <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                                <h2 className="text-sm font-bold text-foreground">Motivo de consulta</h2>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Razón principal por la que el paciente acudió a la consulta.</p>
                            </div>
                            <CardContent className="p-6">
                                <p className="text-sm text-n-11 leading-relaxed">{reasonCode}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── PANEL: NOTA CLÍNICA ── */}
                <div className="max-w-4xl mx-auto p-6 space-y-6">
                    <Card className="bg-n-1">
                        <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                            <h2 className="text-sm font-bold text-foreground">Nota de evolución</h2>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Registro narrativo del encuentro clínico.</p>
                        </div>
                        <CardContent className="p-6">
                            <p className="text-sm text-n-11 leading-relaxed whitespace-pre-wrap">
                                {clinicalNote?.evolution_note || 'Sin nota evolutiva registrada.'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-n-1">
                        <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                            <h2 className="text-sm font-bold text-foreground">Examen físico</h2>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Hallazgos al examen de los diferentes sistemas corporales.</p>
                        </div>
                        <CardContent className="p-0">
                            {physicalExam ? (
                                <div className="divide-y divide-n-5/30">
                                    {examSections.map(({ key, label }) => {
                                        const exam = physicalExam[key];
                                        if (!exam) return null;
                                        return (
                                            <div key={key} className="flex items-start gap-4 p-4">
                                                <Badge variant={exam.normal ? 'pill-success' : 'pill-warning'} className="shrink-0 mt-0.5">
                                                    {exam.normal ? 'Normal' : 'Anormal'}
                                                </Badge>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-n-11 mb-1">{label}</p>
                                                    {exam.notes && (
                                                        <p className="text-xs text-n-8 leading-relaxed">{exam.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-6">
                                    <p className="text-sm text-n-8 italic">Sin registro de examen físico.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {(clinicalNote?.subjective || clinicalNote?.objective || clinicalNote?.analysis || clinicalNote?.plan) && (
                        <Card className="bg-n-1">
                            <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                                <h2 className="text-sm font-bold text-foreground">Notas SOAP</h2>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Formato estructurado de documentación clínica.</p>
                            </div>
                            <CardContent className="p-0 divide-y divide-n-5/30">
                                {clinicalNote?.subjective && (
                                    <div className="p-6">
                                        <p className="text-xs font-bold uppercase tracking-wider text-n-8 mb-2">Subjetivo</p>
                                        <p className="text-sm text-n-11 leading-relaxed whitespace-pre-wrap">{clinicalNote.subjective}</p>
                                    </div>
                                )}
                                {clinicalNote?.objective && (
                                    <div className="p-6">
                                        <p className="text-xs font-bold uppercase tracking-wider text-n-8 mb-2">Objetivo</p>
                                        <p className="text-sm text-n-11 leading-relaxed whitespace-pre-wrap">{clinicalNote.objective}</p>
                                    </div>
                                )}
                                {clinicalNote?.analysis && (
                                    <div className="p-6">
                                        <p className="text-xs font-bold uppercase tracking-wider text-n-8 mb-2">Análisis</p>
                                        <p className="text-sm text-n-11 leading-relaxed whitespace-pre-wrap">{clinicalNote.analysis}</p>
                                    </div>
                                )}
                                {clinicalNote?.plan && (
                                    <div className="p-6">
                                        <p className="text-xs font-bold uppercase tracking-wider text-n-8 mb-2">Plan</p>
                                        <p className="text-sm text-n-11 leading-relaxed whitespace-pre-wrap">{clinicalNote.plan}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── PANEL: DIAGNÓSTICOS ── */}
                <div className="max-w-4xl mx-auto p-6">
                    <Card className="bg-n-1">
                        <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                            <h2 className="text-sm font-bold text-foreground">Diagnósticos</h2>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Lista de condiciones identificadas durante el encuentro.</p>
                        </div>
                        <CardContent className="p-0">
                            {diagnoses.length === 0 ? (
                                <div className="p-8">
                                    <EmptyStatePresentational icon={Activity} title="Sin diagnósticos" description="No se registraron diagnósticos en este encuentro." />
                                </div>
                            ) : (
                                <div className="divide-y divide-n-5/30">
                                    {diagnoses.map((d, i) => (
                                        <div key={i} className="flex items-center justify-between p-4">
                                            <div className="flex flex-col gap-0.5">
                                                <h4 className="text-sm font-bold text-n-11">{d.description}</h4>
                                                <p className="text-[11px] text-n-8 font-mono">{d.code}</p>
                                            </div>
                                            <Badge
                                                variant={d.type === 'primary' ? 'pill-success' : 'pill-neutral'}
                                                className="text-[11px]"
                                            >
                                                {d.type === 'primary' ? 'Principal' : d.type === 'secondary' ? 'Secundario' : 'Otro'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── PANEL: SIGNOS VITALES ── */}
                <div className="max-w-4xl mx-auto p-6">
                    <Card className="bg-n-1">
                        <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                            <h2 className="text-sm font-bold text-foreground">Signos vitales</h2>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Medidas fisiológicas registradas durante el encuentro.</p>
                        </div>
                        <CardContent className="p-0">
                            {vitalsEntries.length === 0 ? (
                                <div className="p-8">
                                    <EmptyStatePresentational icon={Activity} title="Sin signos vitales" description="No se registraron signos vitales en este encuentro." />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-n-5/30">
                                    {vitalsEntries.map(({ label, value }) => (
                                        <div key={label} className="p-6">
                                            <PropertyItem label={label} value={value} mono />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── PANEL: ADDENDA ── */}
                <div className="max-w-4xl mx-auto p-6">
                    <Card className="bg-n-1">
                        <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                            <h2 className="text-sm font-bold text-foreground">Addenda</h2>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Notas de aclaración agregadas posteriormente al cierre del encuentro.</p>
                        </div>
                        <CardContent className="p-0">
                            {addenda && addenda.length === 0 ? (
                                <div className="p-8">
                                    <EmptyStatePresentational icon={FileText} title="Sin addenda" description="No hay notas de aclaración para este encuentro." />
                                </div>
                            ) : (
                                <div className="divide-y divide-n-5/30">
                                    {addenda && addenda.map((a) => (
                                        <div key={a.id} className="p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-xs font-bold text-n-8">
                                                    {a.author
                                                        ? `${a.author.name_given?.join(' ') || ''} ${a.author.name_family}`.trim()
                                                        : 'Autor desconocido'}
                                                </p>
                                                <p className="text-[11px] text-n-8 font-mono tabular-nums">
                                                    {a.created_at ? formatDate(a.created_at) : '—'}
                                                </p>
                                            </div>
                                            <p className="text-sm text-n-11 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}