'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTabStore } from '@/store/useTabStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { getPatients, getPatientClinicalData, createEncounter, getEncounters } from '@/actions/patients';
import type { Patient, Condition, AllergyIntolerance, EncounterWithSpecialty } from '@/types/database.types';
import type { Path, UseFormRegister } from 'react-hook-form';
import SpecialtySidebar from './SpecialtySidebar';
import DiagnosisSearch from '@/components/clinical/DiagnosisSearch';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardAction, CardDescription } from '@/components/ui/card';
import { Field, FieldError, FieldLabel, FieldGroup, FieldDescription } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from '@/components/ui/input-group';
import { toast } from 'sonner';

// Form & Validation
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';

// Icons
import { Save, MessageSquare, Plus, Stethoscope, Activity, User, RefreshCw, AlertTriangle, X, Info, CheckCircle2 } from 'lucide-react';

const encounterSchema = z.object({
    chiefComplaint: z.string().min(1, "El motivo de consulta es requerido"),
    currentIllness: z.string(),
    familyHistory: z.string(),
    surgicalHistory: z.string(),
    physicalExam: z.string(),
    evolutionNote: z.string(),
    treatmentPlan: z.string(),
    vitals: z.object({
        bpSystolic: z.number().min(60).max(250),
        bpDiastolic: z.number().min(40).max(160),
        heartRate: z.number().min(30).max(250),
        temperature: z.number().min(34).max(43),
        respRate: z.number().min(8).max(60),
        spo2: z.number().min(60).max(100),
        weight: z.number().min(1).max(400),
        height: z.number().min(30).max(250),
    }),
    diagnoses: z.array(z.object({
        code: z.string(),
        description: z.string(),
        type: z.enum(['primary', 'secondary', 'other'])
    })),
    symptoms: z.array(z.string()),
});

type EncounterFormValues = z.infer<typeof encounterSchema>;

// ─── Helpers ────────────────────────────────────────────────────────────────────
const defaultVitals = {
    bpSystolic: 120, bpDiastolic: 80, heartRate: 72,
    temperature: 36.5, respRate: 18, spo2: 98, weight: 68, height: 165,
};

const defaultValues: EncounterFormValues = {
    chiefComplaint: '',
    currentIllness: '',
    familyHistory: '',
    surgicalHistory: '',
    physicalExam: '',
    evolutionNote: '',
    treatmentPlan: '',
    vitals: defaultVitals,
    diagnoses: [],
    symptoms: [],
};


function calcAge(birthDate: string | null): string {
    if (!birthDate) return '—';
    const diff = Date.now() - new Date(birthDate).getTime();
    return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} años`;
}

const COMMON_SYMPTOMS = ['Fiebre', 'Cefalea', 'Tos', 'Dolor abdominal', 'Diarrea', 'Vómitos', 'Disnea', 'Mialgia', 'Astenia', 'Rinorrea', 'Congestión nasal', 'Dolor de garganta'];

// ─── Subcomponents ────────────────────────────────────────────────────────────

function VitalInput({ name, label, min, max, step = 1, register, disabled }: {
    name: Path<EncounterFormValues>; label: string; min: number; max: number;
    step?: number; register: UseFormRegister<EncounterFormValues>; disabled?: boolean;
}) {
    return (
        <Field>
            <FieldLabel className="text-xs font-medium text-muted-foreground mb-1.5 truncate" title={label}>
                {label}
            </FieldLabel>
            <Input
                type="number"
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                {...register(name, { valueAsNumber: true })}
            />
        </Field>
    );
}

// ─── Workspace Header ─────────────────────────────────────────────────────────
function HistoryWorkspaceHeader({
    selectedPatient,
    isSaving,
    onSave,
    onReset,
    children
}: {
    selectedPatient: Patient | null;
    isSaving: boolean;
    onSave: () => void;
    onReset: () => void;
    children?: React.ReactNode;
}) {
    return (
        <header className="bg-background border-b border-border/10 z-10 sticky top-0 px-6 pt-6 pb-0 flex-shrink-0">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">Historia Clínica</h1>
                    {selectedPatient ? (
                        <p className="text-sm text-foreground flex items-center gap-2">
                            <span className="font-semibold text-primary">
                                {selectedPatient.name_family}, {selectedPatient.name_given?.join(' ')}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">
                                {calcAge(selectedPatient.birth_date)}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">
                                {selectedPatient.gender === 'female' ? 'Femenino' : 'Masculino'}
                            </span>
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Selecciona un paciente del panel lateral para comenzar
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onReset}
                        disabled={!selectedPatient}
                        aria-label="Limpiar formulario"
                        title="Limpiar formulario"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={isSaving || !selectedPatient}
                        className="gap-2 min-w-[120px]"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Guardando…' : 'Guardar'}
                    </Button>
                </div>
            </div>

            {children}
        </header>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function HistoryPage() {
    const searchParams = useSearchParams();
    const { tabs, activeTabId, setTabData } = useTabStore();
    const { setSecondaryPanel, setRightPanelOpen } = useLayoutStore();

    const tabId = activeTabId || '/history';
    const currentTab = tabs.find(t => t.id === tabId);

    // Contextual State (External to the encounter form itself)
    // Type the tab data to properly access persisted state
    interface TabData { selectedPatient?: Patient; clinicalData?: { conditions: Condition[]; allergies: AllergyIntolerance[] }; formValues?: EncounterFormValues; }
    const tabData = currentTab?.data as TabData | undefined;

    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(tabData?.selectedPatient || null);
    const [clinicalData, setClinicalData] = useState<{ conditions: Condition[]; allergies: AllergyIntolerance[] }>(
        tabData?.clinicalData || { conditions: [], allergies: [] }
    );
    const [pastEncounters, setPastEncounters] = useState<EncounterWithSpecialty[]>([]);
    const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize Form
    const form = useForm<EncounterFormValues>({
        resolver: zodResolver(encounterSchema),
        defaultValues: tabData?.formValues || defaultValues,
    });

    const { fields: diagnosesFields, append: appendDiagnosis, remove: removeDiagnosis } = useFieldArray({
        control: form.control,
        name: "diagnoses",
    });

    // Sync to tab store
    useEffect(() => {
        setTabData(tabId, {
            formValues: form.getValues(),
            selectedPatient,
            clinicalData
        });
    }, [form, tabId, setTabData, selectedPatient, clinicalData]);

    const handleReset = useCallback(() => {
        if (confirm('¿Limpiar todos los datos del formulario actual?')) {
            form.reset(defaultValues);
        }
    }, [form]);

    const handleEncounterSelect = useCallback((id: string | null, enc: EncounterWithSpecialty | null) => {
        setActiveEncounterId(id);
        if (enc) {
            form.reset({
                ...defaultValues,
                evolutionNote: enc.evolution_note || 'Sin nota clínica.',
                chiefComplaint: (Array.isArray(enc.reason_code) ? (enc.reason_code as Array<{ text?: string }>)[0]?.text : undefined) || '',
            });
        } else {
            handleReset();
        }
    }, [handleReset, form]);

    const onSave: SubmitHandler<EncounterFormValues> = async (values) => {
        if (!selectedPatient) {
            toast.error('Sin paciente', {
                description: 'Selecciona un paciente con ⌘K o desde el listado.'
            });
            return;
        }

        setIsSaving(true);

        const res = await createEncounter({
            patient_id: selectedPatient.id,
            evolution_note: `MOTIVO:\n${values.chiefComplaint}\n\nSÍNTOMAS ADICCIONALES:\n${values.symptoms.join(', ')}\n\nENFERMEDAD ACTUAL:\n${values.currentIllness}\n\nEXAMEN FÍSICO:\n${values.physicalExam}\n\nEVOLUCIÓN:\n${values.evolutionNote}`,
            vital_signs: values.vitals,
            diagnosis: values.diagnoses.map(d => ({ code: d.code, description: d.description, type: d.type })),
            plan: values.treatmentPlan,
            reason_code: [{ text: values.chiefComplaint }, ...values.symptoms.map(s => ({ text: s }))],
        });

        setIsSaving(false);

        if (res.error) {
            toast.error('Error al guardar', {
                description: typeof res.error === 'string' ? res.error : 'No se pudo registrar la consulta.'
            });
        } else {
            toast.success('Encuentro guardado', {
                description: 'La evolución clínica se registró correctamente.'
            });

            const { data: encs } = await getEncounters(selectedPatient.id);
            setPastEncounters((encs || []) as EncounterWithSpecialty[]);

            // Keep weight and height for next time
            form.reset({
                ...defaultValues,
                vitals: {
                    ...defaultVitals,
                    weight: values.vitals.weight,
                    height: values.vitals.height
                }
            });
        }
    };

    // Setup Sidebar
    useEffect(() => {
        setSecondaryPanel(
            <SpecialtySidebar
                selectedPatient={selectedPatient}
                encounters={pastEncounters}
                activeEncounterId={activeEncounterId}
                onSelectEncounter={handleEncounterSelect}
                isLoading={isLoadingEncounters}
                onNewEncounter={handleReset}
            />,
            'Especialidades'
        );
    }, [selectedPatient, pastEncounters, activeEncounterId, isLoadingEncounters, setSecondaryPanel, handleEncounterSelect, handleReset]);

    // Load initial data
    useEffect(() => {
        async function init() {
            const pid = searchParams.get('patientId');
            const encId = searchParams.get('encounterId');

            if (pid) {
                const { data } = await getPatients();
                const patient = data?.find((p) => p.id === pid);
                if (patient) {
                    setSelectedPatient(patient as Patient);
                    setIsLoadingDetails(true);
                    setIsLoadingEncounters(true);

                    try {
                        const [cData, { data: encs }] = await Promise.all([
                            getPatientClinicalData(patient.id),
                            getEncounters(patient.id)
                        ]);

                        setClinicalData(cData as { conditions: Condition[]; allergies: AllergyIntolerance[] });
                        setPastEncounters((encs || []) as EncounterWithSpecialty[]);

                        if (encId && encs) {
                            const encounter = encs?.find(e => e.id === encId);
                            if (encounter) {
                                setActiveEncounterId(encId);
                                form.setValue('evolutionNote', encounter.evolution_note || 'Sin nota clínica.');
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching clinical data:', error);
                    } finally {
                        setIsLoadingDetails(false);
                        setIsLoadingEncounters(false);
                        setRightPanelOpen(true);
                    }
                }
            }
        }
        init();
    }, [searchParams, setRightPanelOpen, form]);

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <form id="history-form" onSubmit={form.handleSubmit(onSave as SubmitHandler<EncounterFormValues>)} className="flex flex-col h-full w-full">
                <Tabs defaultValue="subjective" className="flex flex-col h-full w-full">

                    {/* ── Workspace Header ───────────────────────────────────────────── */}
                    <HistoryWorkspaceHeader
                        selectedPatient={selectedPatient}
                        isSaving={isSaving}
                        onSave={form.handleSubmit(onSave as SubmitHandler<EncounterFormValues>)}
                        onReset={handleReset}
                    >
                        <TabsList className="mb-4 bg-muted/10 border-border/10">
                            <TabsTrigger value="subjective" className="gap-2 px-6 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                                <User className="w-4 h-4" /> Subjetivo
                            </TabsTrigger>
                            <TabsTrigger value="objective" className="gap-2 px-6 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                                <Activity className="w-4 h-4" /> Objetivo
                            </TabsTrigger>
                            <TabsTrigger value="plan" className="gap-2 px-6 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">
                                <Stethoscope className="w-4 h-4" /> Evaluación y Plan
                            </TabsTrigger>
                        </TabsList>
                    </HistoryWorkspaceHeader>

                    {/* ── Body ────────────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto px-6 py-6 pb-24">

                        {/* Panels */}
                        <TabsContent value="subjective" className="m-0 space-y-8 outline-none focus:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="border-border/10 bg-card/20 backdrop-blur-sm overflow-hidden shadow-none">
                                <CardHeader className="border-b border-border/5 bg-muted/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold tracking-tight">Motivo de Consulta y Antecedentes</CardTitle>
                                            <CardDescription className="text-xs">Registre la información subjetiva proporcionada por el paciente.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-10">
                                    <Field>
                                        <FieldLabel className="text-xs font-medium text-muted-foreground mb-2.5">
                                            Motivo de consulta <span className="text-primary">*</span>
                                        </FieldLabel>
                                        <Textarea
                                            {...form.register("chiefComplaint")}
                                            placeholder="¿Por qué acude el paciente hoy?"
                                            rows={2}
                                            disabled={!selectedPatient}
                                            className="resize-none min-h-[80px]"
                                        />
                                        {form.formState.errors.chiefComplaint && (
                                            <FieldError className="text-[10px] mt-1.5">{form.formState.errors.chiefComplaint.message}</FieldError>
                                        )}

                                        {selectedPatient && (
                                            <div className="mt-4">
                                                <span className="text-xs font-medium text-muted-foreground/60 mr-2">Sugerencias:</span>
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {COMMON_SYMPTOMS.filter(s => !form.watch("symptoms").includes(s)).map(symptom => (
                                                        <Badge
                                                            key={symptom}
                                                            variant="secondary"
                                                            className="cursor-pointer bg-primary/5 hover:bg-primary/20 hover:text-primary transition-all py-0.5 text-[10px] border-0"
                                                            onClick={() => {
                                                                const current = form.getValues("symptoms");
                                                                form.setValue("symptoms", [...current, symptom]);
                                                            }}
                                                        >
                                                            + {symptom}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {form.watch("symptoms").length > 0 && (
                                            <div className="mt-4 bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-wrap gap-2 items-center">
                                                <span className="text-xs font-medium text-primary/60 w-full mb-1">Síntomas reportados:</span>
                                                {form.watch("symptoms").map(symptom => (
                                                    <Badge
                                                        key={symptom}
                                                        className="pl-2 pr-1 py-1 bg-primary text-primary-foreground text-[11px] font-medium border-0"
                                                    >
                                                        {symptom}
                                                        <button
                                                            type="button"
                                                            className="ml-1.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                                            onClick={() => {
                                                                const current = form.getValues("symptoms");
                                                                form.setValue("symptoms", current.filter(s => s !== symptom));
                                                            }}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </Field>

                                    <div className="grid grid-cols-1 gap-10">
                                        <Field>
                                            <FieldLabel className="text-xs font-medium text-muted-foreground mb-2.5">Enfermedad actual</FieldLabel>
                                            <Textarea
                                                {...form.register("currentIllness")}
                                                placeholder="Síntomas, cronología y severidad…"
                                                rows={4}
                                                disabled={!selectedPatient}
                                                className="resize-none"
                                            />
                                        </Field>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <Field>
                                                <FieldLabel className="text-xs font-medium text-muted-foreground mb-2.5">Antecedentes familiares</FieldLabel>
                                                <Textarea
                                                    {...form.register("familyHistory")}
                                                    placeholder="Cáncer, diabetes, etc."
                                                    rows={2}
                                                    disabled={!selectedPatient}
                                                    className="resize-none"
                                                />
                                            </Field>
                                            <Field>
                                                <FieldLabel className="text-xs font-medium text-muted-foreground mb-2.5">Historial quirúrgico / Tóxicos</FieldLabel>
                                                <Textarea
                                                    {...form.register("surgicalHistory")}
                                                    placeholder="Cirugías, tabaquismo..."
                                                    rows={2}
                                                    disabled={!selectedPatient}
                                                    className="resize-none"
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Conditions & Allergies Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="border-border/10 bg-card/20 backdrop-blur-sm shadow-none">
                                    <CardHeader className="flex flex-row items-center gap-3 border-b border-border/5 bg-muted/5 py-4">
                                        <div className="p-1.5 bg-primary/10 rounded-md">
                                            <Activity className="w-4 h-4 text-primary" />
                                        </div>
                                        <CardTitle className="text-sm font-semibold text-primary/80">Condiciones preexistentes</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="flex flex-wrap gap-2">
                                            {clinicalData.conditions.length > 0
                                                ? clinicalData.conditions.map((c) => (
                                                    <Badge key={c.id} variant="outline" className="border-border/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-tighter">
                                                        {c.code_display}
                                                    </Badge>
                                                ))
                                                : <span className="text-xs text-muted-foreground/40 font-medium">
                                                    {selectedPatient ? 'Sin condiciones registradas' : '—'}
                                                </span>
                                            }
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-sm shadow-none relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-destructive/40"></div>
                                    <CardHeader className="flex flex-row items-center gap-3 border-b border-destructive/10 bg-destructive/5 py-4">
                                        <div className="p-1.5 bg-destructive/10 rounded-md">
                                            <AlertTriangle className="w-4 h-4 text-destructive" />
                                        </div>
                                        <CardTitle className="text-sm font-semibold text-destructive/80">Alergias conocidas</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="flex flex-wrap gap-2">
                                            {clinicalData.allergies.length > 0
                                                ? clinicalData.allergies.map((a) => (
                                                    <Badge key={a.id} variant="destructive" className="bg-destructive text-white border-0 text-[10px] font-bold uppercase tracking-tighter shadow-sm shadow-destructive/20">
                                                        {a.code_display}
                                                    </Badge>
                                                ))
                                                : <span className="text-xs text-muted-foreground/40 font-medium">
                                                    {selectedPatient ? 'Sin alergias registradas' : '—'}
                                                </span>
                                            }
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="objective" className="m-0 space-y-8 outline-none focus:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="border-border/10 bg-card/20 backdrop-blur-sm overflow-hidden shadow-none">
                                <CardHeader className="border-b border-border/5 bg-muted/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Activity className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold tracking-tight">Signos Vitales y Exploración</CardTitle>
                                            <CardDescription className="text-xs">Mediciones fisiológicas e informe del examen físico.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 space-y-10">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6 bg-muted/10 p-8 rounded-2xl border border-border/10">
                                        <VitalInput name="vitals.bpSystolic" label="PA Sistólica (mmHg)" min={60} max={250} register={form.register} disabled={!selectedPatient} />
                                        <VitalInput name="vitals.bpDiastolic" label="PA Diastólica (mmHg)" min={40} max={160} register={form.register} disabled={!selectedPatient} />
                                        <VitalInput name="vitals.heartRate" label="FC (lpm)" min={30} max={250} register={form.register} disabled={!selectedPatient} />
                                        <VitalInput name="vitals.temperature" label="Temp (°C)" min={34} max={43} step={0.1} register={form.register} disabled={!selectedPatient} />
                                        <VitalInput name="vitals.respRate" label="FR (rpm)" min={8} max={60} register={form.register} disabled={!selectedPatient} />
                                        <VitalInput name="vitals.spo2" label="SpO₂ (%)" min={60} max={100} register={form.register} disabled={!selectedPatient} />
                                        <VitalInput name="vitals.weight" label="Peso (kg)" min={1} max={400} step={0.1} register={form.register} disabled={!selectedPatient} />
                                        <VitalInput name="vitals.height" label="Talla (cm)" min={30} max={250} register={form.register} disabled={!selectedPatient} />
                                    </div>

                                    <Field>
                                        <FieldLabel className="text-xs font-medium text-muted-foreground mb-2.5">Examen físico</FieldLabel>
                                        <Textarea
                                            {...form.register("physicalExam")}
                                            placeholder="Hallazgos por sistemas: Cabeza, Cuello, Tórax, Abdomen…"
                                            rows={6}
                                            disabled={!selectedPatient}
                                            className="resize-none min-h-[200px]"
                                        />
                                        <FieldDescription className="text-xs mt-2 text-muted-foreground/50">Describa anormalidades o hallazgos relevantes por sistema.</FieldDescription>
                                    </Field>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="plan" className="m-0 space-y-8 outline-none focus:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">

                            {/* AI Scribe Promo */}
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-between shadow-sm backdrop-blur-md">
                                <div className="flex items-center gap-4 text-primary">
                                    <div className="bg-primary/20 p-3 rounded-full animate-pulse">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">AI Clinical Scribe</h4>
                                        <p className="text-xs text-primary/70 font-medium">Transcripción inteligente y autogeneración de nota evolutiva.</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 font-medium text-xs h-8 px-5">
                                    Activar <span className="ml-2 text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">BETA</span>
                                </Button>
                            </div>

                            <Card className="border-border/10 bg-card/20 backdrop-blur-sm overflow-hidden shadow-none">
                                <CardHeader className="border-b border-border/5 bg-muted/5 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Stethoscope className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold tracking-tight">Evaluación, Diagnóstico y Plan</CardTitle>
                                            <CardDescription className="text-xs">Conclusión clínica, codificación CIE-10 e indicaciones terapéuticas.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-12">
                                    <Field>
                                        <FieldLabel className="text-xs font-medium text-muted-foreground mb-2.5">Nota de evolución / Impresión diagnóstica</FieldLabel>
                                        <Textarea
                                            {...form.register("evolutionNote")}
                                            placeholder="Resumen del análisis clínico y razonamiento del diagnóstico…"
                                            rows={6}
                                            disabled={!selectedPatient}
                                            className="resize-none"
                                        />
                                    </Field>

                                    <div className="space-y-6 pt-2">
                                        <div className="flex justify-between items-center bg-muted/5 p-4 rounded-xl border border-border/5">
                                            <div className="flex items-center gap-2">
                                                <Stethoscope className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-semibold text-foreground/80">Diagnósticos CIE-10</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => appendDiagnosis({ code: '', description: '', type: 'other' })}
                                                disabled={!selectedPatient}
                                                className="gap-2 h-8 text-xs font-medium border-primary/20 text-primary hover:bg-primary/10"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Agregar Código
                                            </Button>
                                        </div>

                                        <div className="space-y-4 bg-muted/5 p-6 rounded-2xl border border-border/10">
                                            {diagnosesFields.length === 0 && (
                                                <div className="bg-background/40 p-1.5 rounded-xl border border-border/10 focus-within:border-primary/40 transition-all">
                                                    <Controller
                                                        control={form.control}
                                                        name="diagnoses"
                                                        render={({ field }) => (
                                                            <DiagnosisSearch
                                                                id="diagnosis-initial"
                                                                label=""
                                                                placeholder="Busque por código o nombre (ej: J01.9)..."
                                                                value=""
                                                                onChange={val => {
                                                                    const [code, ...descParts] = val.split(' — ');
                                                                    const desc = descParts.join(' — ');
                                                                    if (code && desc) {
                                                                        appendDiagnosis({ code, description: desc, type: 'primary' });
                                                                    }
                                                                }}
                                                                disabled={!selectedPatient}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            )}

                                            {diagnosesFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-4 items-end bg-background/40 p-5 rounded-2xl border border-border/10 shadow-sm relative group animate-in slide-in-from-left-2 duration-200">
                                                    <div className="flex-1">
                                                        <Controller
                                                            control={form.control}
                                                            name={`diagnoses.${index}.code`}
                                                            render={({ field: diagnosisField }) => (
                                                                <DiagnosisSearch
                                                                    id={`diagnosis-${index}`}
                                                                    label={index === 0 ? "Diagnóstico principal" : `Relacionado #${index}`}
                                                                    placeholder="CIE-10..."
                                                                    value={`${form.watch(`diagnoses.${index}.code`)}${form.watch(`diagnoses.${index}.description`) ? ' — ' + form.watch(`diagnoses.${index}.description`) : ''}`}
                                                                    onChange={val => {
                                                                        const [code, ...descParts] = val.split(' — ');
                                                                        const desc = descParts.join(' — ');
                                                                        form.setValue(`diagnoses.${index}.code`, code);
                                                                        form.setValue(`diagnoses.${index}.description`, desc);
                                                                    }}
                                                                    disabled={!selectedPatient}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0 rounded-xl"
                                                            onClick={() => removeDiagnosis(index)}
                                                            title="Quitar"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Field className="pt-4">
                                        <FieldLabel className="text-xs font-medium text-muted-foreground mb-2.5">Plan terapéutico e indicaciones</FieldLabel>
                                        <Textarea
                                            {...form.register("treatmentPlan")}
                                            placeholder="Medicamentos, dosis, estudios solicitados, próxima cita…"
                                            rows={6}
                                            disabled={!selectedPatient}
                                            className="resize-none min-h-[160px]"
                                        />
                                    </Field>

                                    <div className="pt-8 border-t border-border/5">
                                        <div className="flex flex-wrap gap-3" role="group" aria-label="Acciones rápidas">
                                            {['Generar Receta', 'Orden de Laboratorios', 'Certificado Médico', 'Referencia'].map(action => (
                                                <Button key={action} variant="outline" size="sm" disabled={!selectedPatient} className="bg-background/5 hover:bg-primary/10 hover:text-primary border-border/10 hover:border-primary/30 transition-all font-medium text-xs h-8 px-4">
                                                    {action}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
            </form>
        </div>
    );
}

