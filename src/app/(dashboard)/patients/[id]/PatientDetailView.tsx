'use client';

import React, { useState, useEffect } from 'react';
import {
    Edit,
    User,
    Stethoscope,
    Plus,
    Activity,
    FlaskConical,
    MoreVertical,
    FileText,
    Trash,
    Calendar,
    AlertTriangle,
    ChevronRight,
    AlertCircle,
    UserCircle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { getEncounters } from '@/actions/encounters';
import { archivePatient, reactivatePatient } from '@/actions/patients';
import { usePatientStore } from '@/store/usePatientStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddConditionDialog } from '@/components/patients/AddConditionDialog';
import { AddAllergyDialog } from '@/components/patients/AddAllergyDialog';
import type { Patient, Condition, AllergyIntolerance, EncounterWithSpecialty } from '@/types/database.types';
import type { PatientTelecom, PatientAddress, PatientIdentifier } from '@/types/patient-jsonb';
import { formatDate, calcAge, getGenderLabel } from '@/lib/clinical';

import { PageContainer } from '@/components/ui/PageLayout';
import { Card, CardContent } from '@/components/ui/card';

interface PatientDetailViewProps {
    patient: Patient;
    conditions: Condition[];
    allergies: AllergyIntolerance[];
}

function getAvatarColor(gender: string): string {
    switch (gender) {
        case "female": return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
        case "male": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        default: return "bg-n-3 text-n-11 dark:bg-n-5 dark:text-n-10";
    }
}

function getInitials(givenNames?: string[], familyName?: string): string {
    const first = givenNames?.[0]?.[0] || "";
    const last = familyName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "?";
}

function PropertyItem({ label, value, className, mono }: { label: string; value: string; className?: string; mono?: boolean }) {
    return (
        <div className={cn("flex flex-col gap-1 py-1.5", className)}>
            <span className="text-xs font-semibold uppercase tracking-wider text-n-8">
                {label}
            </span>
            <span className={cn(
                "text-[13px] font-medium text-n-11 transition-colors",
                mono ? "mono" : "font-sans tracking-tight"
            )}>
                {value || '—'}
            </span>
        </div>
    );
}

function EmptyState({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed border-n-5 bg-n-1">
            <div className="w-9 h-9 rounded-full bg-n-2 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-n-8" />
            </div>
            <h4 className="text-sm font-bold text-n-11 mb-1 font-sans">{title}</h4>
            <p className="text-[11px] text-n-8 max-w-xs font-sans leading-relaxed">{message}</p>
        </div>
    );
}

export type TabValue = 'overview' | 'conditions' | 'allergies' | 'history' | 'vitals';

export default function PatientDetailView({ patient, conditions: initialConditions, allergies: initialAllergies }: PatientDetailViewProps) {
    const router = useRouter();
    const [encounters, setEncounters] = useState<EncounterWithSpecialty[]>([]);
    const [loadingEncounters, setLoadingEncounters] = useState(false);
    const [conditions, setConditions] = useState<Condition[]>(initialConditions);
    const [allergies, setAllergies] = useState<AllergyIntolerance[]>(initialAllergies);
    const [showAddCondition, setShowAddCondition] = useState(false);
    const [showAddAllergy, setShowAddAllergy] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const { viewStates, setPatientView } = usePatientStore();

    const savedTab = (viewStates && viewStates[patient.id]?.activeSubTab as TabValue) || 'overview';
    const [activeTab, setActiveTab] = useState<TabValue>(savedTab);

    useEffect(() => {
        const fetchEncounters = async () => {
            setLoadingEncounters(true);
            const { data } = await getEncounters(patient.id);
            setEncounters((data || []) as EncounterWithSpecialty[]);
            setLoadingEncounters(false);
        };
        fetchEncounters();
    }, [patient.id]);

    const handleReactivate = async () => {
        const result = await reactivatePatient(patient.id);
        if (result.error) {
            toast.error('Error al reactivar', { description: result.error });
            return;
        }
        toast.success('Paciente reactivado');
        router.refresh();
    };

    const docId = Array.isArray(patient.identifiers) ? (patient.identifiers as PatientIdentifier[])[0]?.value : undefined;
    const phone = Array.isArray(patient.telecom) ? (patient.telecom as PatientTelecom[]).find(t => t.system === 'phone')?.value : undefined;
    const email = Array.isArray(patient.telecom) ? (patient.telecom as PatientTelecom[]).find(t => t.system === 'email')?.value : undefined;
    const address = Array.isArray(patient.address) ? (patient.address as PatientAddress[])[0]?.text : undefined;

    const fullName = `${patient.name_family}, ${patient.name_given?.join(' ')}`;
    const initials = getInitials(patient.name_given, patient.name_family);
    const age = calcAge(patient.birth_date);
    const genderLabel = getGenderLabel(patient.gender);

    return (
        <div className="h-full flex flex-col bg-n-2 font-sans">
            {/* ── HEADER ── */}
            <div className="px-6 py-6 border-b border-n-5/30 bg-n-1">
                <div className="flex items-start gap-4 mb-5">
                    <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 border-2 border-n-5/20",
                        getAvatarColor(patient.gender || "unknown")
                    )}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-n-11 tracking-tight leading-tight">
                            {fullName}
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            {docId && (
                                <span className="text-xs font-mono text-n-8 bg-n-2 px-2 py-0.5 rounded">{docId}</span>
                            )}
                            {age && (
                                <span className="text-xs text-n-8">{age} años</span>
                            )}
                            <span className="text-xs text-n-8 capitalize">{genderLabel}</span>
                            <Badge variant={patient.active ? "pill-success" : "pill-neutral"} className="text-[10px] py-0.5">
                                {patient.active ? "Activo" : "Inactivo"}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-b-8/10 flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-b-8" />
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold border-n-5 gap-2 px-3 font-sans transition-colors duration-100" onClick={() => router.push(`/patients/${patient.id}/edit`)}>
                            <Edit className="w-3.5 h-3.5" /> Editar
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 border-n-5/30 rounded-lg">
                                <DropdownMenuLabel className="text-[11px] font-bold text-n-8 px-3 py-2 font-sans">Opciones</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-n-5/20" />
                                <DropdownMenuItem className="text-xs font-sans" onClick={() => {/* FHIR export */}}>
                                    <FileText className="w-4 h-4 mr-2 opacity-60" /> Exportar Historia FHIR
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-n-5/20" />
                                {patient.active ? (
                                    <DropdownMenuItem className="text-xs font-sans text-destructive focus:text-destructive focus:bg-destructive/5" onClick={() => setShowArchiveConfirm(true)}>
                                        <Trash className="w-4 h-4 mr-2 opacity-60" /> Archivar Paciente
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem className="text-xs font-sans" onClick={handleReactivate}>
                                        <Activity className="w-4 h-4 mr-2 opacity-60" /> Reactivar Paciente
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Tabs
                    value={activeTab}
                    onValueChange={(val) => {
                        const tabValue = val as TabValue;
                        setActiveTab(tabValue);
                        setPatientView(patient.id, tabValue);
                    }}
                    className="gap-4"
                >
                    <TabsList className="w-full justify-start gap-1 overflow-x-auto no-scrollbar">
                        {[
                            { value: 'overview', label: 'Resumen', icon: User },
                            { value: 'conditions', label: 'Condiciones', icon: Stethoscope },
                            { value: 'allergies', label: 'Alergias', icon: AlertTriangle },
                            { value: 'history', label: 'Consultas', icon: Calendar },
                            { value: 'vitals', label: 'Signos Vitales', icon: Activity },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="flex items-center gap-1.5 px-3 font-sans"
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

<div className="flex-1 overflow-y-auto">
                <PageContainer size="large">
                    {/* ── PANEL: RESUMEN ── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            <Card className="bg-n-1">
                                <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                                    <h2 className="text-sm font-bold text-foreground">Identidad y datos maestros</h2>
                                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Información personal básica y documentos de identificación oficial.</p>
                                </div>
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-n-5/30">
                                        <div className="p-5">
                                            <PropertyItem label="Nombre completo" value={`${patient.name_given?.join(' ')} ${patient.name_family}`} />
                                        </div>
                                        <div className="p-5">
                                            <PropertyItem label="Cédula / ID" value={docId || '—'} mono />
                                        </div>
                                        <div className="p-5">
                                            <PropertyItem label="Fecha de nacimiento" value={formatDate(patient.birth_date)} mono />
                                        </div>
                                        <div className="p-5">
                                            <PropertyItem label="Edad actual" value={`${age || '—'} años`} mono />
                                        </div>
                                        <div className="p-5">
                                            <PropertyItem label="Género" value={genderLabel} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-n-1">
                                <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                                    <h2 className="text-sm font-bold text-foreground">Contacto y ubicación</h2>
                                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Medios de comunicación directa y dirección física de residencia.</p>
                                </div>
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y divide-n-5/30">
                                        <div className="p-5">
                                            <PropertyItem label="Teléfono" value={phone || '—'} />
                                        </div>
                                        <div className="p-5">
                                            <PropertyItem label="Correo electrónico" value={email || '—'} />
                                        </div>
                                        <div className="sm:col-span-2 p-5">
                                            <PropertyItem label="Dirección de residencia" value={address || 'Sin dirección registrada'} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ── PANEL: CONDICIONES ── */}
                    {activeTab === 'conditions' && (
                        <div className="max-w-4xl mx-auto">
                            <Card>
                                <div className="px-5 pt-5 pb-4 border-b border-n-5/30 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-bold text-foreground">Condiciones clínicas</h2>
                                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Lista de diagnósticos activos e históricos del paciente.</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-b-8 hover:bg-b-8/10 font-sans transition-colors duration-100" onClick={() => setShowAddCondition(true)}>
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                                    </Button>
                                </div>
                                <CardContent className="p-0 divide-y divide-n-5/30">
                                    {conditions.length === 0 ? (
                                        <div className="p-8">
                                            <EmptyState icon={Activity} title="No hay condiciones clínicas" message="El paciente no tiene diagnósticos registrados actualmente." />
                                        </div>
                                    ) : (
                                        conditions.map((c) => (
                                            <div key={c.id} className="flex items-center justify-between p-4 bg-n-1 hover:bg-n-2 transition-colors duration-100 first:rounded-t-lg last:rounded-b-lg">
                                                <div className="flex flex-col gap-0.5">
                                                    <h4 className="text-sm font-bold text-n-11 font-sans">{c.code_display}</h4>
                                                    <p className="text-[11px] text-n-8 font-sans tracking-tight tabular-nums">
                                                        {c.code} · Iniciado el {formatDate(c.onset_date)}
                                                    </p>
                                                </div>
                                                <Badge variant={c.clinical_status === 'active' ? 'pill-success' : 'pill-neutral'} className="text-[11px]">
                                                    {c.clinical_status === 'active' ? 'Activa' : 'Resuelta'}
                                                </Badge>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

{/* ── PANEL: ALERGIAS ── */}
                    {activeTab === 'allergies' && (
                        <div className="max-w-4xl mx-auto">
                            <Card>
                                <div className="px-5 pt-5 pb-4 border-b border-n-5/30 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-bold text-foreground">Alergias e intolerancias</h2>
                                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Registro de sustancias o agentes que provocan reacciones adversas.</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-b-8 hover:bg-b-8/10 font-sans transition-colors duration-100" onClick={() => setShowAddAllergy(true)}>
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                                    </Button>
                                </div>
                                <CardContent className="p-0 divide-y divide-n-5/30">
                                    {allergies.length === 0 ? (
                                        <div className="p-8">
                                            <EmptyState icon={FlaskConical} title="Sin alergias registradas" message="No se han reportado alergias o intolerancias para este paciente." />
                                        </div>
                                    ) : (
                                        allergies.map((a) => (
                                            <div key={a.id} className="flex items-center gap-4 p-4 bg-n-1 hover:bg-n-2 transition-colors duration-100 first:rounded-t-lg last:rounded-b-lg">
                                                <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-n-11 truncate font-sans">{a.code_display}</h4>
                                                    <p className="text-[11px] text-n-8 font-sans">
                                                        {(Array.isArray(a.reactions) && (a.reactions as Array<{ text: string }>)[0]?.text) || 'Sin reacción especificada'}
                                                    </p>
                                                </div>
                                                <Badge variant={a.criticality === 'high' ? 'pill-danger' : 'pill-warning'} className="text-[11px]">
                                                    {a.criticality === 'high' ? 'Alta' : 'Normal'}
                                                </Badge>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ── PANEL: CONSULTAS ── */}
                    {activeTab === 'history' && (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <Card>
                                <div className="px-5 pt-5 pb-4 border-b border-n-5/30">
                                    <h2 className="text-sm font-bold text-foreground">Historial evolutivo</h2>
                                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Cronología de encuentros clínicos y notas de seguimiento.</p>
                                </div>
                                <CardContent className="p-0">
                                    {loadingEncounters ? (
                                        <div className="p-8 space-y-3">
                                            <Skeleton className="h-20 w-full rounded-lg bg-n-2" />
                                        </div>
                                    ) : encounters.length === 0 ? (
                                        <div className="p-8">
                                            <EmptyState icon={Calendar} title="Sin consultas previas" message="Este paciente aún no registra visitas clínicas." />
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-n-5/30">
                                            {encounters.map((e) => (
                                                <button
                                                    key={e.id}
                                                    className="w-full text-left flex items-start p-5 gap-5 hover:bg-n-2 transition-all duration-150 group"
                                                    onClick={() => router.push(`/history?patientId=${patient.id}&encounterId=${e.id}`)}
                                                >
                                                    <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
                                                        <div className="h-10 w-10 rounded-xl bg-b-8/10 flex items-center justify-center text-b-8 group-hover:bg-b-8 group-hover:text-white transition-colors duration-150">
                                                            <Calendar className="w-5 h-5" />
                                                        </div>
                                                        <div className="w-px h-full bg-n-5/40 group-last:hidden" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="font-sans text-sm font-bold tracking-tight text-n-11 tabular-nums">{formatDate(e.start_time)}</p>
                                                            <Badge variant={e.status === 'finished' ? 'pill-success' : 'pill-info'} className="text-[11px]">
                                                                {e.status === 'finished' ? 'Cerrada' : 'Abierta'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-n-8 mb-2 font-sans">
                                                            Dr. {e.practitioner?.name_family || 'No asignado'}
                                                        </p>
                                                        <p className="text-[13px] text-n-8 leading-relaxed line-clamp-3 italic font-sans">
                                                            {e.clinical_note?.evolution_note || 'Sin nota evolutiva registrada en esta consulta.'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-n-8/40 self-center group-hover:translate-x-1 group-hover:text-b-8 transition-all duration-150" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </PageContainer>
            </div>

            <AddConditionDialog patientId={patient.id} open={showAddCondition} onOpenChange={setShowAddCondition} onSuccess={(c) => setConditions(prev => [c, ...prev])} />
            <AddAllergyDialog patientId={patient.id} open={showAddAllergy} onOpenChange={setShowAddAllergy} onSuccess={(a) => setAllergies(prev => [a, ...prev])} />

            <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
                <AlertDialogContent className="rounded-xl border-n-5/30">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-bold font-sans">¿Archivar paciente?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-sans">
                            El paciente será marcado como inactivo. Podrá reactivarlo desde esta misma vista en el futuro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 text-xs font-bold rounded-md border-n-5/40 font-sans">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(buttonVariants({ variant: 'destructive' }), "h-9 text-xs font-bold rounded-md font-sans")}
                            disabled={archiving}
                            onClick={async (e) => {
                                e.preventDefault();
                                setArchiving(true);
                                const result = await archivePatient(patient.id);
                                setArchiving(false);
                                if (result.error) {
                                    toast.error('Error al archivar', { description: result.error });
                                    return;
                                }
                                toast.success('Paciente archivado');
                                router.push('/patients');
                            }}
                        >
                            {archiving ? 'Archivando...' : 'Archivar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
