'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTabStore } from '@/store/useTabStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { getPatients, getPatientClinicalData, updatePatientAnamnesis } from '@/actions/patients';
import { saveEncounterDraft, finalizeEncounter, getEncounters } from '@/actions/encounters';
import type { Patient, Condition, AllergyIntolerance, EncounterWithClinicalNote } from '@/types/database.types';
import type { Json } from '@/types/database.types';
import SubjetivoSection from './sections/SubjetivoSection';
import ObjetivoSection from './sections/ObjetivoSection';
import EvaluacionSection from './sections/EvaluacionSection';
import AddendaSection from './sections/AddendaSection';
import AntecedentesSection from './sections/AntecedentesSection';
import AlergologiaSection from './sections/AlergologiaSection';
import EstudiosSection from './sections/EstudiosSection';
import { cn } from '@/lib/utils';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PageHeader, PageContainer } from '@/components/ui/PageLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Form & Validation
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';

// Icons
import {
    Save,
    MessageSquare,
    RefreshCw,
    CheckCircle2,
    RotateCcw,
    FileText,
    Pencil
} from 'lucide-react';

const encounterSchema = z.object({
    chiefComplaint: z.string().min(1, "El motivo de consulta es requerido"),
    currentIllness: z.object({
        suspectedDiagnosis: z.string().optional(),
        timeAmount: z.string().optional(),
        timeUnit: z.string().optional(),
        severity: z.string().optional(),
        course: z.string().optional(),
        status: z.string().optional(),
        adherence: z.string().optional(),
        tolerated: z.boolean().optional(),
        generalState: z.string().optional(),
        limitations: z.boolean().optional(),
        lifestyleCh: z.string().optional(),
        aggravatingFactors: z.string().optional(),
        alleviatingFactors: z.string().optional(),
        preventiveGoal: z.string().optional(),
        lastCheckupDate: z.string().optional(),
        mainConcerns: z.string().optional(),
        lifestyleGoals: z.string().optional(),
        onsetMode: z.string().optional(),
        pastTreatments: z.string().optional(),
        patientTheory: z.string().optional(),
        notes: z.string().optional()
    }),
    familyHistory: z.string().optional(),
    surgicalHistory: z.string().optional(),
    pastConditions: z.string().optional(),
    knownAllergies: z.string().optional(),
    currentMedications: z.string().optional(),
    hospitalizationHistory: z.string().optional(),
    reviewOfSystems: z.string().optional(),
    habitsHistory: z.string().optional(),
    laboratoryExams: z.string().optional(),
    imagingExams: z.string().optional(),
    physicalExam: z.object({
        headNeck: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        thorax: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        abdomen: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        pelvis: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        extremities: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        neurological: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        skin: z.object({ normal: z.boolean(), notes: z.string().optional() }),
    }),
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
    encounterCategory: z.string().optional(),
    encounterSubcategory: z.string().optional(),
});

type EncounterFormValues = z.infer<typeof encounterSchema>;

interface AddendumRow {
    id: string;
    encounter_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author?: {
        name_family: string;
        name_given: string[];
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
const defaultVitals = {
    bpSystolic: 120, bpDiastolic: 80, heartRate: 72,
    temperature: 36.5, respRate: 18, spo2: 98, weight: 68, height: 165,
};

const defaultValues: EncounterFormValues = {
    chiefComplaint: '',
    currentIllness: {
        suspectedDiagnosis: '',
        timeAmount: '',
        timeUnit: 'días',
        severity: 'Leve (1-3)',
        course: 'Agudo',
        status: 'Estable',
        adherence: 'Completa',
        tolerated: true,
        generalState: 'Bueno',
        limitations: false,
        lifestyleCh: '',
        aggravatingFactors: '',
        alleviatingFactors: '',
        preventiveGoal: 'Rutina Anual',
        lastCheckupDate: '',
        mainConcerns: '',
        lifestyleGoals: '',
        onsetMode: 'Gradual',
        pastTreatments: '',
        patientTheory: '',
        notes: '',
    },
    familyHistory: '',
    surgicalHistory: '',
    pastConditions: '',
    knownAllergies: '',
    currentMedications: '',
    hospitalizationHistory: '',
    reviewOfSystems: '',
    habitsHistory: '',
    laboratoryExams: '',
    imagingExams: '',
    physicalExam: {
        headNeck: { normal: true, notes: '' },
        thorax: { normal: true, notes: '' },
        abdomen: { normal: true, notes: '' },
        pelvis: { normal: true, notes: '' },
        extremities: { normal: true, notes: '' },
        neurological: { normal: true, notes: '' },
        skin: { normal: true, notes: '' },
    },
    evolutionNote: '',
    treatmentPlan: '',
    vitals: defaultVitals,
    diagnoses: [],
    symptoms: [],
    encounterCategory: '',
    encounterSubcategory: '',
};

type HistoryTab = 'consulta' | 'antecedentes' | 'alergologia' | 'exploracion' | 'estudios' | 'juicio';

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function HistoryPage() {
    const searchParams = useSearchParams();
    const { tabs, activeTabId, setTabData } = useTabStore();
    const { setRightPanelOpen } = useLayoutStore();

    const tabId = activeTabId || '/history';
    const currentTab = tabs.find(t => t.id === tabId);

    interface TabData { selectedPatient?: Patient; clinicalData?: { conditions: Condition[]; allergies: AllergyIntolerance[] }; formValues?: EncounterFormValues; }
    const tabData = currentTab?.data as TabData | undefined;

    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(tabData?.selectedPatient || null);
    const [clinicalData, setClinicalData] = useState<{ conditions: Condition[]; allergies: AllergyIntolerance[] }>(
        tabData?.clinicalData || { conditions: [], allergies: [] }
    );
    const [pastEncounters, setPastEncounters] = useState<EncounterWithClinicalNote[]>([]);
    const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [chiefComplaintSelectKey, setChiefComplaintSelectKey] = useState(0);
    const [familyHistorySelectKey, setFamilyHistorySelectKey] = useState(0);
    const [addenda, setAddenda] = useState<AddendumRow[]>([]);
    const [isAddingAddendum, setIsAddingAddendum] = useState(false);
    const [newAddendumContent, setNewAddendumContent] = useState('');
    const [isSavingAddendum, setIsSavingAddendum] = useState(false);
    const [activeHistoryTab, setActiveHistoryTab] = useState<HistoryTab>('consulta');

    const form = useForm<EncounterFormValues>({
        resolver: zodResolver(encounterSchema),
        defaultValues: tabData?.formValues || defaultValues,
    });

    const { fields: diagnosesFields, append: appendDiagnosis, remove: removeDiagnosis } = useFieldArray({
        control: form.control,
        name: "diagnoses",
    });

    useEffect(() => {
        setTabData(tabId, {
            formValues: form.getValues(),
            selectedPatient,
            clinicalData
        });
    }, [tabId, setTabData, selectedPatient, clinicalData]);

    const handleReset = useCallback(() => {
        if (confirm('¿Limpiar todos los datos del formulario actual?')) {
            form.reset(defaultValues);
        }
    }, [form]);

    const handleEncounterSelect = useCallback((id: string | null, enc: EncounterWithClinicalNote | null) => {
        setActiveEncounterId(id);
        const readOnly = enc?.status === 'finished';
        setIsReadOnly(readOnly);
        if (enc) {
            const rc = enc.clinical_note?.reason_code;
            const chiefComplaint = (Array.isArray(rc)
                ? (rc as Array<Record<string, string>>)[0]?.text
                : typeof rc === 'string' ? rc : '') || '';

            form.reset({
                ...defaultValues,
                evolutionNote: enc.clinical_note?.evolution_note || '',
                treatmentPlan: enc.clinical_note?.plan || '',
                chiefComplaint,
                vitals: (enc.vital_signs as Record<string, unknown>) || defaultVitals,
                physicalExam: (enc.clinical_note?.physical_exam as unknown as EncounterFormValues["physicalExam"]) || defaultValues.physicalExam,
                diagnoses: (enc.clinical_note?.diagnosis as unknown as EncounterFormValues["diagnoses"]) || [],
                encounterCategory: enc.encounter_category || '',
                encounterSubcategory: enc.encounter_subcategory || '',
            });

            if (readOnly) {
                import('@/actions/encounters').then(m => m.getAddenda(enc.id)).then(res => setAddenda(res.data));
            } else {
                setAddenda([]);
            }
        } else {
            if (confirm('¿Limpiar todos los datos del formulario actual?')) {
                form.reset(defaultValues);
            }
            setAddenda([]);
        }
    }, []);

    const onSave: SubmitHandler<EncounterFormValues> = async (values) => {
        if (!selectedPatient) {
            toast.error('Sin paciente', {
                description: 'Selecciona un paciente con ⌘K o desde el listado.'
            });
            return;
        }

        setIsSaving(true);

        const abnormalFindings = Object.entries(values.physicalExam)
            .filter(([, v]) => !v.normal)
            .map(([k, v]) => `${({ headNeck: 'Cabeza y Cuello', thorax: 'Tórax (Cardiopulmonar)', abdomen: 'Abdomen', pelvis: 'Pelvis / Genitourinario', extremities: 'Extremidades', neurological: 'Neurológico', skin: 'Piel y Faneras' } as Record<string,string>)[k] || k}: ${v.notes}`)
            .join(' | ');

        let illnessDesc = '';
        const illness = values.currentIllness;
        const category = values.encounterCategory || '';
        if (category.includes('Seguimiento') || category.includes('Revisión') || category.includes('Postoperatorio') || category.includes('Telemedicina')) {
            illnessDesc = `Estado: ${illness.status || '-'} | Adherencia: ${illness.adherence || '-'} | Tolerado: ${illness.tolerated ? 'Sí' : 'No.'}\nNotas: ${illness.notes || '-'}`;
        } else if (category.includes('Preventiva') || category.includes('Salud Ocupacional') || category.includes('Evaluación Preoperatoria')) {
            illnessDesc = `Estado General: ${illness.generalState || '-'} | Limitaciones: ${illness.limitations ? 'Sí' : 'No'} | Modif. Estilo Vida: ${illness.lifestyleCh || '-'} \nNotas: ${illness.notes || '-'}`;
        } else {
            illnessDesc = `Tiempo evolución: ${illness.timeAmount || '?'} ${illness.timeUnit || 'días'} | Severidad: ${illness.severity || '-'} | Curso: ${illness.course || '-'}\nSituación/Notas: ${illness.notes || '-'}`;
        }

        const reqAnamnesis = updatePatientAnamnesis(selectedPatient.id, {
            familyHistory: values.familyHistory,
            pastConditions: values.pastConditions,
            knownAllergies: values.knownAllergies,
            surgicalHistory: values.surgicalHistory,
            habitsHistory: values.habitsHistory,
        });

        const subjective = `MOTIVO: ${values.chiefComplaint} | ENFERMEDAD ACTUAL: ${illnessDesc.replace(/\n/g, ' ')}`;
        const objective = `SIGNOS VITALES: ${JSON.stringify(values.vitals)} | HALLAZGOS FÍSICOS: ${abnormalFindings || 'Normal'} | EVOLUCIÓN: ${values.evolutionNote}`;

        if (!activeEncounterId) {
            toast.error('Sin encuentro activo', {
                description: 'Para registrar una consulta, inicia el encuentro desde la agenda de citas.'
            });
            setIsSaving(false);
            return;
        }

        const res = await saveEncounterDraft(activeEncounterId, {
            subjective,
            objective,
            analysis: '',
            plan: values.treatmentPlan,
            evolution_note: values.evolutionNote,
            vital_signs: values.vitals,
            physical_exam: values.physicalExam as unknown as Json,
            diagnosis: values.diagnoses.map(d => ({ code: d.code, description: d.description, type: d.type })),
        });

        await reqAnamnesis;
        setIsSaving(false);

        if (res.error) {
            toast.error('Error al guardar borrador', {
                description: typeof res.error === 'string' ? res.error : 'No se pudo guardar el borrador.'
            });
        } else {
            toast.success('Borrador guardado', {
                description: 'Los cambios se guardaron como borrador del encuentro.'
            });

            const { data: encs } = await getEncounters(selectedPatient.id);
            setPastEncounters((encs || []) as EncounterWithClinicalNote[]);
        }
    };

    const handleFinalize = async () => {
        if (!activeEncounterId) return;
        setIsSaving(true);
        const res = await finalizeEncounter(activeEncounterId);
        setIsSaving(false);
        if (res.error) {
            toast.error('Error al finalizar', { description: res.error as string });
        } else {
            toast.success('Encuentro finalizado', {
                description: 'El acto médico ha sido cerrado y firmado con éxito.'
            });
            if (selectedPatient) {
                const { data: encs } = await getEncounters(selectedPatient.id);
                setPastEncounters((encs || []) as EncounterWithClinicalNote[]);
                const finished = (encs || []).find(e => e.id === activeEncounterId);
                if (finished) {
                    handleEncounterSelect(activeEncounterId, finished as EncounterWithClinicalNote);
                }
            }
        }
    };

    // Sidebar is now handled by AppSidebar component

    useEffect(() => {
        const pid = searchParams.get('patientId');
        const encId = searchParams.get('encounterId');

        if (!pid && !encId) return;

        let cancelled = false;

        async function init() {
            setIsLoadingEncounters(true);

            let patientId = pid;
            let encounterToLoad: EncounterWithClinicalNote | null = null;

            if (!pid && encId) {
                const { getEncounterById } = await import('@/actions/encounters');
                const encResult = await getEncounterById(encId);
                if (encResult.data && !cancelled) {
                    patientId = encResult.data.patient_id;
                    encounterToLoad = encResult.data as EncounterWithClinicalNote;
                }
            }

            if (cancelled) return;

            const { data: patients } = await getPatients();
            const patient = patientId ? patients?.find((p) => p.id === patientId) : null;

            if (!patient || cancelled) return;

            setSelectedPatient(patient as Patient);

            const p = patient as Patient;
            const famHist = Array.isArray(p.family_history) ? (p.family_history[0] as { text?: string })?.text || '' : '';
            const habitsHist = Array.isArray(p.habits) ? (p.habits[0] as { text?: string })?.text || '' : '';
            const persHist = Array.isArray(p.personal_history) ? p.personal_history as { label?: string, text?: string }[] : [];
            const pastCond = persHist.find(h => h.label === 'Patológicos')?.text || '';
            const surgHist = persHist.find(h => h.label === 'Quirúrgico')?.text || '';
            const ext = Array.isArray(p.extensions) ? p.extensions as { url?: string, valueString?: string }[] : [];
            const knownAllergies = ext.find(e => e.url === 'knownAllergies')?.valueString || '';

            form.reset({
                ...defaultValues,
                familyHistory: famHist,
                habitsHistory: habitsHist,
                pastConditions: pastCond,
                surgicalHistory: surgHist,
                knownAllergies: knownAllergies
            });

            try {
                const [cData, { data: encs }] = await Promise.all([
                    getPatientClinicalData(patient.id),
                    getEncounters(patient.id)
                ]);

                if (cancelled) return;

                setClinicalData(cData as { conditions: Condition[]; allergies: AllergyIntolerance[] });
                setPastEncounters((encs || []) as EncounterWithClinicalNote[]);

                if (encId && encs) {
                    const encounter = encs.find(e => e.id === encId);
                    if (encounter && !cancelled) {
                        setActiveEncounterId(encId);
                        const readOnly = encounter.status === 'finished';
                        setIsReadOnly(readOnly);

                        const rcEnc = encounter.clinical_note?.reason_code;
                        const chiefComplaint = (Array.isArray(rcEnc)
                            ? (rcEnc as Array<Record<string, string>>)[0]?.text
                            : typeof rcEnc === 'string' ? rcEnc : '') || '';

                        form.reset({
                            ...form.getValues(),
                            evolutionNote: encounter.clinical_note?.evolution_note || '',
                            treatmentPlan: encounter.clinical_note?.plan || '',
                            chiefComplaint,
                            vitals: (encounter.vital_signs as Record<string, unknown>) || defaultVitals,
                            physicalExam: (encounter.clinical_note?.physical_exam as unknown as EncounterFormValues["physicalExam"]) || defaultValues.physicalExam,
                            diagnoses: (encounter.clinical_note?.diagnosis as unknown as EncounterFormValues["diagnoses"]) || [],
                            encounterCategory: encounter.encounter_category || '',
                            encounterSubcategory: encounter.encounter_subcategory || '',
                        });

                        if (readOnly) {
                            import('@/actions/encounters').then(m => m.getAddenda(encounter.id)).then(res => setAddenda(res.data));
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching clinical data:', error);
            } finally {
                if (!cancelled) {
                    setIsLoadingEncounters(false);
                }
            }
        }

        init();

        return () => {
            cancelled = true;
        };
    }, [searchParams.get('patientId'), searchParams.get('encounterId')]);


    const patientName = selectedPatient
        ? `${selectedPatient.name_family}, ${selectedPatient.name_given?.join(' ')}`
        : 'Historia Clínica';

    const HISTORY_TABS: { value: HistoryTab; label: string }[] = [
        { value: 'consulta', label: 'Motivo de Consulta' },
        { value: 'antecedentes', label: 'Antecedentes' },
        { value: 'alergologia', label: 'Alergología' },
        { value: 'exploracion', label: 'Exploración' },
        { value: 'estudios', label: 'Estudios' },
        { value: 'juicio', label: 'Juicio Clínico' },
    ];

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <form id="history-form" onSubmit={form.handleSubmit(onSave as SubmitHandler<EncounterFormValues>)} className="flex flex-col h-full w-full">

                <PageHeader
                    title={patientName}
                    description={selectedPatient ? `Expediente: ${(selectedPatient?.identifiers as Array<Record<string, string>> | null)?.[0]?.value || 'S/D'}` : 'Seleccione un paciente para comenzar el registro clínico.'}
                    breadcrumbs={[
                        { label: 'Historia Clínica', href: '/history' },
                        ...(selectedPatient ? [{ label: patientName }] : [])
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            {isReadOnly ? (
                                <Badge variant="pill-warning" className="gap-1.5">
                                    <FileText className="w-3 h-3" />
                                    Nota Cerrada
                                </Badge>
                            ) : (
                                <>
                                    {activeEncounterId && (
                                        <Badge variant="pill-info" className="gap-1.5">
                                            <Pencil className="w-3 h-3" />
                                            Borrador
                                        </Badge>
                                    )}
                                </>
                            )}
                        </div>
                    }
className="pt-5 pb-4 px-6"
                >
                    <Tabs value={activeHistoryTab} onValueChange={(v) => setActiveHistoryTab(v as HistoryTab)} className="w-full mt-4">
                        <TabsList className="w-full justify-start gap-0 bg-transparent p-0 h-auto border-0">
                            {HISTORY_TABS.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="px-4 py-2 text-xs font-medium rounded-md border border-transparent data-[state=active]:border-n-5/30 data-[state=active]:bg-n-1 data-[state=active]:text-n-11 text-n-8 hover:text-n-11 hover:bg-n-2/50 transition-all duration-100"
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </PageHeader>

                <div className="flex-1 overflow-y-auto w-full bg-n-2">
                    <PageContainer size="full" className="pb-24">
                        <fieldset disabled={isReadOnly} className="border-none p-0 m-0">

                            {activeHistoryTab === 'consulta' && (
                                <SubjetivoSection
                                    form={form}
                                    selectedPatient={selectedPatient}
                                    chiefComplaintSelectKey={chiefComplaintSelectKey}
                                    setChiefComplaintSelectKey={setChiefComplaintSelectKey}
                                    isWizardOpen={isWizardOpen}
                                    setIsWizardOpen={setIsWizardOpen}
                                    wizardStep={wizardStep}
                                    setWizardStep={setWizardStep}
                                    familyHistorySelectKey={familyHistorySelectKey}
                                    setFamilyHistorySelectKey={setFamilyHistorySelectKey}
                                />
                            )}

                            {activeHistoryTab === 'antecedentes' && (
                                <AntecedentesSection
                                    form={form}
                                    selectedPatient={selectedPatient}
                                />
                            )}

                            {activeHistoryTab === 'alergologia' && (
                                <AlergologiaSection
                                    clinicalData={clinicalData}
                                    selectedPatient={selectedPatient}
                                    form={form}
                                />
                            )}

                            {activeHistoryTab === 'exploracion' && (
                                <ObjetivoSection
                                    form={form}
                                    selectedPatient={selectedPatient}
                                />
                            )}

                            {activeHistoryTab === 'juicio' && (
                                <>
                                    <div className="bg-b-8/5 border border-b-8/20 rounded-lg p-6 flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4 text-b-8">
                                            <div className="bg-b-8/20 p-3 rounded-full">
                                                <MessageSquare className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-n-11">AI Clinical Scribe</h4>
                                                <p className="text-xs text-n-8 font-medium">Transcripción inteligente y autogeneración de nota evolutiva.</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="border-n-5/30 text-n-11 hover:bg-n-2 font-medium text-xs h-8 px-5">
                                            Activar <span className="ml-2 text-[8px] bg-b-8 text-n-1 px-1.5 py-0.5 rounded font-bold">BETA</span>
                                        </Button>
                                    </div>
                                    <EvaluacionSection
                                        form={form}
                                        selectedPatient={selectedPatient}
                                        diagnosesFields={diagnosesFields}
                                        appendDiagnosis={appendDiagnosis}
                                        removeDiagnosis={removeDiagnosis}
                                    />
                                </>
                            )}

                            {activeHistoryTab === 'estudios' && (
                                <EstudiosSection
                                    form={form}
                                    selectedPatient={selectedPatient}
                                    encounterId={activeEncounterId}
                                    isReadOnly={isReadOnly}
                                />
                            )}

                        </fieldset>
                    </PageContainer>
                </div>
            </form>

            <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-n-5/30 bg-n-2/95 backdrop-blur-sm px-6 py-4 dark:bg-n-2/95">
                <div className="flex items-center justify-between gap-4 w-full max-w-7xl mx-auto">

                    {!isReadOnly && (
                        <Button
                            type="button"
                            variant="ghost"
   size="sm"
                            onClick={handleReset}
                            disabled={isSaving || !selectedPatient}
                            className="gap-2 text-n-8 hover:text-n-11 h-9 px-4"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reiniciar Nota
                        </Button>
                    )}

                    <div className="flex items-center gap-3">
                        {!isReadOnly && (
                            <Button
                                type="button"
                                variant="outline"
                                size="md"
                                onClick={() => form.handleSubmit(onSave as SubmitHandler<EncounterFormValues>)()}
                                disabled={isSaving || !selectedPatient}
                                className="gap-2 h-10 px-5 border-n-5/30 text-n-11 hover:bg-n-2 shadow-sm"
                            >
                                {isSaving ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Guardar Borrador
                            </Button>
                        )}

                        {!isReadOnly && activeEncounterId && (
                            <Button
                                type="button"
                                variant="default"
                                size="md"
                                className="gap-2 h-10 px-6 shadow-md"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (confirm('¿Firmar y cerrar este acto médico? Una vez finalizado, la nota clínica será permanente y no podrá editarse directamente.')) {
                                        handleFinalize();
                                    }
                                }}
                                disabled={isSaving}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Firmar Acto Médico
                            </Button>
                        )}

                        {isReadOnly && (
                            <span className="text-sm text-n-8 font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Nota clínica sellada
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}