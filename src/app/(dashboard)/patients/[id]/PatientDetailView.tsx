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
    Bot
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
import { useLayoutStore } from '@/store/useLayoutStore';
import { useTabStore } from '@/store/useTabStore';
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

import { PageHeader, PageContainer, PageSection, PageSectionSeparator } from '@/components/ui/PageLayout';

interface PatientDetailViewProps {
    patient: Patient;
    conditions: Condition[];
    allergies: AllergyIntolerance[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PropertyItem({ label, value, className }: { label: string; value: string; className?: string }) {
    return (
        <div className={cn("flex flex-col gap-1 py-1.5", className)}>
            <span className="text-[11px] font-bold text-muted-foreground/70 font-sans">
                {label}
            </span>
            <span className="text-[13px] font-medium text-foreground/90 font-sans tracking-tight">
                {value || '—'}
            </span>
        </div>
    );
}

function EmptyState({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed border-border bg-muted/5">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-muted-foreground/60" />
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1 font-sans">{title}</h4>
            <p className="text-[11px] text-muted-foreground max-w-xs font-sans leading-relaxed">{message}</p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
    const { setRightPanelOpen, openRightPanelOnTab, rightPanelOpen, rightPanelTab } = useLayoutStore();
    const { removeTab, findTabByUrl } = useTabStore();
    const {
        viewStates,
        setPatientView,
        openPatientTab,
        setActivePatient,
        setSelectedPatientForPreview
    } = usePatientStore();

    const savedTab = (viewStates[patient.id]?.activeSubTab as TabValue) || 'overview';
    const [activeTab, setActiveTab] = useState<TabValue>(savedTab);

    useEffect(() => {
        setActivePatient(patient.id);
    }, [patient.id, setActivePatient]);

    useEffect(() => {
        return () => {
            setSelectedPatientForPreview(null);
        };
    }, [patient.id, setSelectedPatientForPreview]);

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

    // Parse JSON fields if they're strings
    const identifiers = typeof patient.identifiers === 'string'
      ? JSON.parse(patient.identifiers as string)
      : patient.identifiers;
    const telecom = typeof patient.telecom === 'string'
      ? JSON.parse(patient.telecom as string)
      : patient.telecom;
    const address = typeof patient.address === 'string'
      ? JSON.parse(patient.address as string)
      : patient.address;

    const docId = Array.isArray(identifiers) ? identifiers[0]?.value : undefined;
    const phone = Array.isArray(telecom) ? telecom.find(t => t.system === 'phone')?.value : undefined;
    const email = Array.isArray(telecom) ? telecom.find(t => t.system === 'email')?.value : undefined;
    const addressText = Array.isArray(address) ? address[0]?.text : undefined;

    const fullName = `${patient.name_family}, ${patient.name_given?.join(' ')}`;

    return (
        <div className="h-full flex flex-col bg-background font-sans">
            {/* ── HEADER ── */}
            <PageHeader
                title={fullName}
                breadcrumbs={[
                    { label: 'Pacientes', href: '/patients' },
                    { label: fullName }
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <Badge variant={patient.active ? "pill-success" : "pill-neutral"} className="text-[11px] mr-2">
                            {patient.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold border-border gap-2 px-3 font-sans transition-colors duration-100" onClick={() => router.push(`/patients/${patient.id}/edit`)}>
                            <Edit className="w-3.5 h-3.5" /> Editar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-8 text-[11px] font-bold gap-2 px-3 font-sans transition-colors",
                                rightPanelOpen && rightPanelTab === 'ai' && "bg-primary/10 border-primary/40 text-primary"
                            )}
                            onClick={() => {
                                if (rightPanelOpen && rightPanelTab === 'ai') {
                                    setRightPanelOpen(false);
                                    setSelectedPatientForPreview(null);
                                } else {
                                    setSelectedPatientForPreview(patient);
                                    openRightPanelOnTab('ai');
                                }
                            }}
                        >
                            <Bot className="w-3.5 h-3.5" />
                            Dra. Clínica
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 border-border/30 rounded-lg">
                                <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground/70 px-3 py-2 font-sans">Opciones</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-border/20" />
                                <DropdownMenuItem className="text-xs font-sans" onClick={() => {/* FHIR export */}}>
                                    <FileText className="w-4 h-4 mr-2 opacity-60" /> Exportar Historia FHIR
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border/20" />
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
                }
                className="py-6"
            >
                <Tabs
                    value={activeTab}
                    onValueChange={(val) => {
                        const tabValue = val as TabValue;
                        setActiveTab(tabValue);
                        setPatientView(patient.id, tabValue);
                    }}
                    className="mt-2"
                >
                    <TabsList className="h-10 w-full justify-start bg-transparent p-0 gap-8 overflow-x-auto no-scrollbar">
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
                                className="h-10 px-0 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] font-bold text-muted-foreground/60 data-[state=active]:text-foreground transition-all duration-100 gap-1.5 font-sans"
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </PageHeader>

            <div className="flex-1 overflow-y-auto bg-background">
                <PageContainer size="large">
                    {/* ── PANEL: RESUMEN ── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-0">
                            <PageSection
                                title="Identidad y datos maestros"
                                description="Información personal básica y documentos de identificación oficial."
                                orientation="horizontal"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 rounded-xl border border-border bg-card/30">
                                    <PropertyItem label="Nombre completo" value={`${patient.name_given?.join(' ')} ${patient.name_family}`} />
                                    <PropertyItem label="Cédula / ID" value={docId || '—'} />
                                    <PropertyItem label="Fecha de nacimiento" value={formatDate(patient.birth_date)} />
                                    <PropertyItem label="Edad actual" value={`${calcAge(patient.birth_date)} años`} />
                                    <PropertyItem label="Género" value={getGenderLabel(patient.gender)} />
                                </div>
                            </PageSection>

                            <PageSectionSeparator />

                            <PageSection
                                title="Contacto y ubicación"
                                description="Medios de comunicación directa y dirección física de residencia."
                                orientation="horizontal"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-xl border border-border bg-card/30">
                                    <PropertyItem label="Teléfono" value={phone || '—'} />
                                    <PropertyItem label="Correo electrónico" value={email || '—'} />
                                    <div className="sm:col-span-2">
                                        <PropertyItem label="Dirección de residencia" value={addressText || 'Sin dirección registrada'} />
                                    </div>
                                </div>
                            </PageSection>
                        </div>
                    )}

                    {/* ── PANEL: CONDICIONES ── */}
                    {activeTab === 'conditions' && (
                        <PageSection
                            title="Condiciones clínicas"
                            description="Lista de diagnósticos activos e históricos del paciente."
                            actions={
                                <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-primary hover:bg-primary/10 font-sans transition-colors duration-100" onClick={() => setShowAddCondition(true)}>
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                                </Button>
                            }
                        >
                            {conditions.length === 0 ? (
                                <EmptyState icon={Activity} title="No hay condiciones clínicas" message="El paciente no tiene diagnósticos registrados actualmente." />
                            ) : (
                                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/20">
                                    {conditions.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between p-4 bg-card hover:bg-muted/30 transition-colors duration-100">
                                            <div className="flex flex-col gap-0.5">
                                                <h4 className="text-sm font-bold text-foreground/90 font-sans">{c.code_display}</h4>
                                                <p className="text-[11px] text-muted-foreground font-sans tracking-tight tabular-nums">
                                                    {c.code} · Iniciado el {formatDate(c.onset_date)}
                                                </p>
                                            </div>
                                            <Badge variant={c.clinical_status === 'active' ? 'pill-success' : 'pill-neutral'} className="text-[11px]">
                                                {c.clinical_status === 'active' ? 'Activa' : 'Resuelta'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </PageSection>
                    )}

                    {/* ── PANEL: ALERGIAS ── */}
                    {activeTab === 'allergies' && (
                        <PageSection
                            title="Alergias e intolerancias"
                            description="Registro de sustancias o agentes que provocan reacciones adversas."
                            actions={
                                <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-primary hover:bg-primary/10 font-sans transition-colors duration-100" onClick={() => setShowAddAllergy(true)}>
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                                </Button>
                            }
                        >
                            {allergies.length === 0 ? (
                                <EmptyState icon={FlaskConical} title="Sin alergias registradas" message="No se han reportado alergias o intolerancias para este paciente." />
                            ) : (
                                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/20">
                                    {allergies.map((a) => (
                                        <div key={a.id} className="flex items-center gap-4 p-4 bg-card hover:bg-muted/30 transition-colors duration-100">
                                            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                                                <AlertCircle className="w-4 h-4 text-destructive" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-foreground/90 truncate font-sans">{a.code_display}</h4>
                                                <p className="text-[11px] text-muted-foreground font-sans">
                                                    {(Array.isArray(a.reactions) && (a.reactions as Array<{ text: string }>)[0]?.text) || 'Sin reacción especificada'}
                                                </p>
                                            </div>
                                            <Badge variant={a.criticality === 'high' ? 'pill-danger' : 'pill-warning'} className="text-[11px]">
                                                {a.criticality === 'high' ? 'Alta' : 'Normal'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </PageSection>
                    )}

                    {/* ── PANEL: CONSULTAS ── */}
                    {activeTab === 'history' && (
                        <PageSection
                            title="Historial evolutivo"
                            description="Cronología de encuentros clínicos y notas de seguimiento."
                        >
                            {loadingEncounters ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-20 w-full rounded-xl" />
                                </div>
                            ) : encounters.length === 0 ? (
                                <EmptyState icon={Calendar} title="Sin consultas previas" message="Este paciente aún no registra visitas clínicas." />
                            ) : (
                                <div className="space-y-3">
                                    {encounters.map((e) => (
                                        <button
                                            key={e.id}
                                            className="w-full text-left flex items-start p-5 gap-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all duration-150 group"
                                            onClick={() => router.push(`/history?patientId=${patient.id}&encounterId=${e.id}`)}
                                        >
                                            <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-150">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div className="w-px h-full bg-border/40 group-last:hidden" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-sans text-sm font-bold tracking-tight text-foreground/90 tabular-nums">{formatDate(e.start_time)}</p>
                                                    <Badge variant={e.status === 'finished' ? 'pill-success' : 'pill-info'} className="text-[11px]">
                                                        {e.status === 'finished' ? 'Cerrada' : 'Abierta'}
                                                    </Badge>
                                                </div>
                                                <p className="text-[11px] font-bold text-muted-foreground/70 mb-2 font-sans">
                                                    Dr. {e.practitioner?.name_family || 'No asignado'}
                                                </p>
                                                <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3 italic font-sans">
                                                    {e.clinical_note?.evolution_note || 'Sin nota evolutiva registrada en esta consulta.'}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 self-center group-hover:translate-x-1 group-hover:text-primary transition-all duration-150" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </PageSection>
                    )}
                </PageContainer>
            </div>

            <AddConditionDialog patientId={patient.id} open={showAddCondition} onOpenChange={setShowAddCondition} onSuccess={(c) => setConditions(prev => [c, ...prev])} />
            <AddAllergyDialog patientId={patient.id} open={showAddAllergy} onOpenChange={setShowAddAllergy} onSuccess={(a) => setAllergies(prev => [a, ...prev])} />

            <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
                <AlertDialogContent className="rounded-xl border-border/40">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-bold font-sans">¿Archivar paciente?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-sans">
                            El paciente será marcado como inactivo. Podrá reactivarlo desde esta misma vista en el futuro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 text-xs font-bold rounded-md border-border/40 font-sans">Cancelar</AlertDialogCancel>
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
                                const patientTab = findTabByUrl(`/patients/${patient.id}`);
                                if (patientTab) removeTab(patientTab.id);
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
