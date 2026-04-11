'use client';

import React, { useState, useEffect } from 'react';
import {
    Edit,
    User,
    Stethoscope,
    Plus,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Activity,
    FlaskConical,
    MoreVertical,
    FileText,
    ExternalLink,
    Trash,
    Calendar,
    AlertTriangle,
    ChevronRight,
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
import { archivePatient } from '@/actions/patients';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useTabStore } from '@/store/useTabStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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

// Typed helpers for patient JSONB columns
interface PatientIdentifier { value?: string }
interface PatientTelecom { system?: string; value?: string }
interface PatientAddress { text?: string }

interface PatientDetailViewProps {
    patient: Patient;
    conditions: Condition[];
    allergies: AllergyIntolerance[];
}

import { formatDate, calcAge, getGenderLabel } from '@/lib/clinical';

// ─── Sub-components ───────────────────────────────────────────────────────────

function WorkspaceHeader({ patient, router, onArchive, children }: { patient: Patient; router: ReturnType<typeof useRouter>; onArchive: () => void; children?: React.ReactNode }) {
    const phone = (patient.telecom as PatientTelecom[] | null)?.find(t => t.system === 'phone')?.value;
    const email = (patient.telecom as PatientTelecom[] | null)?.find(t => t.system === 'email')?.value;
    const address = (patient.address as PatientAddress[] | null)?.[0]?.text;

    return (
        <header className="bg-background border-b border-border/10 shadow-none">
            <div className="px-8 py-8 flex items-center justify-between">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <User className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
                            {patient.name_given?.join(' ')} {patient.name_family}
                            <Badge variant={patient.active ? "outline" : "secondary"} className={cn(
                                "font-medium border-0",
                                patient.active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"
                            )}>
                                {patient.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground">Edad:</span> {calcAge(patient.birth_date)}
                            </div>
                            <span className="text-border">•</span>
                            <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground">Género:</span> {getGenderLabel(patient.gender)}
                            </div>
                            {Array.isArray(patient.identifiers) && (patient.identifiers as PatientIdentifier[])[0]?.value && (
                                <>
                                    <span className="text-border">|</span>
                                    <div className="flex items-center gap-1.5 font-mono text-xs bg-muted px-2 py-0.5 rounded-md text-foreground">
                                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                        {(patient.identifiers as PatientIdentifier[])[0].value}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        onClick={() => router.push(`/history?patientId=${patient.id}`)}
                        className="shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Evolución
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="border-border/40">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 border-border/30">
                            <DropdownMenuLabel>Acciones del Paciente</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/20" />
                            <DropdownMenuItem onClick={() => router.push(`/patients/${patient.id}/edit`)}>
                                <Edit className="w-4 h-4 mr-2" /> Editar Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/api/patients/${patient.id}/fhir`, '_blank')}>
                                <FileText className="w-4 h-4 mr-2" /> Ver FHIR JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                                <ExternalLink className="w-4 h-4 mr-2" /> Abrir en Portal
                                <span className="ml-auto text-[10px] text-muted-foreground">Pronto</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/20" />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/5"
                                onClick={onArchive}
                            >
                                <Trash className="w-4 h-4 mr-2" /> Archivar Paciente
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="px-8 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Contacto</span>
                        <div className="space-y-1">
                            {phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> {phone}</div>}
                            {email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" /> {email}</div>}
                            {!phone && !email && <span className="text-muted-foreground">No registrado</span>}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Residencia</span>
                        <div>
                            {address ? (
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{address}</span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground">Sin dirección registrada</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Notas rápidas</span>
                        <div className="text-muted-foreground line-clamp-2">
                            Paciente requiere atención especial en toma de muestras...
                        </div>
                    </div>
                </div>
            </div>
            {children}
        </header>
    );
}

function EmptyState({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed border-border/60 bg-muted/20">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium text-foreground mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TAB_VALUES = ['overview', 'conditions', 'allergies', 'history', 'vitals'] as const;

export default function PatientDetailView({ patient, conditions: initialConditions, allergies: initialAllergies }: PatientDetailViewProps) {
    const router = useRouter();
    const [encounters, setEncounters] = useState<EncounterWithSpecialty[]>([]);
    const [loadingEncounters, setLoadingEncounters] = useState(false);
    const [conditions, setConditions] = useState<Condition[]>(initialConditions);
    const [allergies, setAllergies] = useState<AllergyIntolerance[]>(initialAllergies);
    const [showAddCondition, setShowAddCondition] = useState(false);
    const [showAddAllergy, setShowAddAllergy] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const { setRightPanelOpen } = useLayoutStore();
    const { patientViewState, setPatientTab } = useTabStore();
    const savedTab = TAB_VALUES[patientViewState[patient.id] ?? 0] ?? 'overview';
    const [activeTab, setActiveTab] = useState(savedTab);

    useEffect(() => {
        const fetchEncounters = async () => {
            setLoadingEncounters(true);
            const { data } = await getEncounters(patient.id);
            setEncounters((data || []) as EncounterWithSpecialty[]);
            setLoadingEncounters(false);
        };
        fetchEncounters();
    }, [patient.id]);

    useEffect(() => {
        setRightPanelOpen(true);
    }, [patient, setRightPanelOpen]);

    const phone = (patient.telecom as PatientTelecom[] | null)?.find(t => t.system === 'phone')?.value;
    const email = (patient.telecom as PatientTelecom[] | null)?.find(t => t.system === 'email')?.value;
    const address = (patient.address as PatientAddress[] | null)?.[0]?.text;

    return (
        <div className="h-full flex flex-col bg-background">
            <Tabs
                value={activeTab}
                onValueChange={(val) => {
                    setActiveTab(val as typeof TAB_VALUES[number]);
                    const idx = TAB_VALUES.indexOf(val as typeof TAB_VALUES[number]);
                    if (idx !== -1) setPatientTab(patient.id, idx);
                }}
                className="flex-1 flex flex-col"
            >
                <WorkspaceHeader patient={patient} router={router} onArchive={() => setShowArchiveConfirm(true)}>
                    <div className="px-8 mt-2">
                        <TabsList className="mb-4">
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
                                    className="gap-2"
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </WorkspaceHeader>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-5xl">
                        {/* ── PANEL: RESUMEN ────────────────────────────────── */}
                        <TabsContent value="overview" className="m-0 focus-visible:outline-none data-[state=inactive]:hidden">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Información General</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Nombre Completo</Label>
                                                <div className="font-medium">{`${patient.name_given?.join(' ')} ${patient.name_family}`}</div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Cédula / ID</Label>
                                                <div className="font-medium">{Array.isArray(patient.identifiers) ? (patient.identifiers as PatientIdentifier[])[0]?.value || '—' : '—'}</div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Fecha de Nacimiento</Label>
                                                <div className="font-medium">{`${formatDate(patient.birth_date)} (${calcAge(patient.birth_date)})`}</div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Género</Label>
                                                <div className="font-medium">{getGenderLabel(patient.gender)}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Contacto y Ubicación</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Teléfono</Label>
                                                <div className="font-medium">{phone || '—'}</div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Correo Electrónico</Label>
                                                <div className="font-medium">{email || '—'}</div>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className="text-muted-foreground">Dirección Completa</Label>
                                                <div className="font-medium">{address || '—'}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* ── PANEL: CONDICIONES ───────────────────────────── */}
                        <TabsContent value="conditions" className="m-0 focus-visible:outline-none data-[state=inactive]:hidden space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">Condiciones Clínicas</h3>
                                <Button variant="outline" size="sm" onClick={() => setShowAddCondition(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar Condición
                                </Button>
                            </div>
                            {conditions.length === 0 ? (
                                <EmptyState
                                    icon={Activity}
                                    title="No hay condiciones clínicas"
                                    message="El paciente no tiene diagnósticos o condiciones registradas."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {conditions.map((c) => (
                                        <Card key={c.id}>
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-base font-semibold truncate">{c.code_display}</h4>
                                                    <p className="text-sm text-muted-foreground">Registrado: {formatDate(c.onset_date)}</p>
                                                </div>
                                                <Badge variant={c.clinical_status === 'active' ? 'destructive' : 'secondary'} className="shrink-0 border-0">
                                                    {c.clinical_status === 'active' ? 'Activa' : 'Resuelta'}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* ── PANEL: ALERGIAS ──────────────────────────────── */}
                        <TabsContent value="allergies" className="m-0 focus-visible:outline-none data-[state=inactive]:hidden space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">Alergias e Intolerancias</h3>
                                <Button variant="outline" size="sm" onClick={() => setShowAddAllergy(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar Alergia
                                </Button>
                            </div>
                            {allergies.length === 0 ? (
                                <EmptyState
                                    icon={FlaskConical}
                                    title="Sin alergias registradas"
                                    message="No se han reportado alergias o intolerancias para este paciente."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {allergies.map((a) => (
                                        <Card key={a.id}>
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                                                    <FlaskConical className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-base font-semibold truncate">{a.code_display}</h4>
                                                    <p className="text-sm text-muted-foreground truncate">{(Array.isArray(a.reactions) && (a.reactions as Array<{ text?: string }>)[0]?.text) || 'Reacción no especificada'}</p>
                                                </div>
                                                <Badge variant={a.criticality === 'high' ? 'destructive' : 'outline'} className="shrink-0 bg-background">
                                                    {a.criticality === 'high' ? 'Alta' : 'Normal'}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* ── PANEL: CONSULTAS ────────────────────────────── */}
                        <TabsContent value="history" className="m-0 focus-visible:outline-none data-[state=inactive]:hidden space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">Historial de Consultas</h3>
                                <Button variant="outline" size="sm" onClick={() => router.push(`/history?patientId=${patient.id}`)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Nueva Consulta
                                </Button>
                            </div>
                            {loadingEncounters ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                </div>
                            ) : encounters.length === 0 ? (
                                <EmptyState
                                    icon={Calendar}
                                    title="Sin consultas previas"
                                    message="Este paciente aún no registra visitas o evoluciones clínicas."
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {encounters.map((e) => (
                                        <Card
                                            key={e.id}
                                            className="cursor-pointer hover:border-primary/40 hover:bg-accent/5 transition-all group overflow-hidden"
                                            onClick={() => router.push(`/history?patientId=${patient.id}&encounterId=${e.id}`)}
                                        >
                                            <CardContent className="p-0">
                                                <div className="flex items-start p-5 gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/10 transition-colors">
                                                        <Calendar className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="font-semibold text-sm">{formatDate(e.start_time)}</p>
                                                            <Badge variant={e.status === 'finished' ? 'outline' : 'default'} className={cn(
                                                                "font-medium border-0 h-5 text-[10px]",
                                                                e.status === 'finished' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-primary/10 text-primary'
                                                            )}>
                                                                {e.status === 'finished' ? 'Completada' : 'En curso'}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                                                            <User className="w-3.5 h-3.5" />
                                                            Dr. {e.practitioner?.name_family || 'No asignado'}
                                                        </div>
                                                        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
                                                            {e.evolution_note || <span className="text-muted-foreground">Sin notas evolutivas registradas en esta consulta.</span>}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-muted-foreground self-center group-hover:text-primary transition-colors" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* ── PANEL: SIGNOS VITALES ───────────────────────── */}
                        <TabsContent value="vitals" className="m-0 focus-visible:outline-none data-[state=inactive]:hidden space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">Signos Vitales</h3>
                            </div>
                            <EmptyState
                                icon={Activity}
                                title="Próximamente"
                                message="Gráficas de evolución y tendencias de signos vitales estarán disponibles aquí en futuras versiones."
                            />
                        </TabsContent>
                    </div>
                </div>
            </Tabs>

            <AddConditionDialog
                patientId={patient.id}
                open={showAddCondition}
                onOpenChange={setShowAddCondition}
                onSuccess={(c) => setConditions(prev => [c, ...prev])}
            />

            <AddAllergyDialog
                patientId={patient.id}
                open={showAddAllergy}
                onOpenChange={setShowAddAllergy}
                onSuccess={(a) => setAllergies(prev => [a, ...prev])}
            />

            <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Archivar paciente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            El paciente será marcado como inactivo. Podrá reactivarlo editando su perfil.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: 'destructive' })}
                            onClick={async () => {
                                const result = await archivePatient(patient.id);
                                if (result.error) {
                                    toast.error('Error al archivar', { description: result.error });
                                    return;
                                }
                                toast.success('Paciente archivado');
                                router.push('/patients');
                            }}
                        >
                            Archivar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
