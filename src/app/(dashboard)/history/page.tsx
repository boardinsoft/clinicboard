'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Button,
    Tag,
    Loading,
    InlineNotification,
    NumberInput,
    TextArea,
    TextInput,
    Tabs,
    Tab,
    TabList,
    TabPanels,
    TabPanel,
} from '@carbon/react';
import {
    Save,
    Chat,
    Add,
    ChevronLeft,
    ChevronRight,
    Stethoscope,
    Activity,
    UserAvatar,
    Reset,
    Search,
    Checkmark,
    Time,
    Warning,
    DocumentMultiple_01,
} from '@carbon/icons-react';
import { getPatients, getPatientClinicalData, createEncounter, getEncounters } from '@/actions/patients';
import { useSearchParams } from 'next/navigation';
import { useTabStore } from '@/store/useTabStore';
import SpecialtySidebar from './SpecialtySidebar';
import { useLayoutStore } from '@/store/useLayoutStore';

// ─── Types ─────────────────────────────────────────────────────────────────────
type SectionTab = 'subjective' | 'objective' | 'plan';
type VitalsKey = 'bpSystolic' | 'bpDiastolic' | 'heartRate' | 'temperature' | 'respRate' | 'spo2' | 'weight' | 'height';

interface FormState {
    chiefComplaint: string;
    currentIllness: string;
    familyHistory: string;
    surgicalHistory: string;
    vitals: Record<VitalsKey, number>;
    physicalExam: string;
    evolutionNote: string;
    diagnosisPrimary: string;
    diagnosisSecondary: string;
    treatmentPlan: string;
    selectedPatient: any;
    clinicalData: { conditions: any[]; allergies: any[] };
}

const defaultVitals: Record<VitalsKey, number> = {
    bpSystolic: 120, bpDiastolic: 80, heartRate: 72,
    temperature: 36.5, respRate: 18, spo2: 98, weight: 68, height: 165,
};

const defaultForm: FormState = {
    chiefComplaint: '', currentIllness: '', familyHistory: '',
    surgicalHistory: '', physicalExam: '', evolutionNote: '',
    diagnosisPrimary: '', diagnosisSecondary: '', treatmentPlan: '',
    vitals: defaultVitals,
    selectedPatient: null,
    clinicalData: { conditions: [], allergies: [] },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}
function calcAge(birthDate: string | null): string {
    if (!birthDate) return '—';
    const diff = Date.now() - new Date(birthDate).getTime();
    return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} años`;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

// Vitals grid input
function VitalInput({ id, label, value, min, max, step = 1, onChange }: {
    id: string; label: string; value: number; min: number; max: number;
    step?: number; onChange: (v: number) => void;
}) {
    return (
        <div className="hc-vital-cell">
            <label htmlFor={id} className="hc-vital-label">{label}</label>
            <NumberInput
                id={id}
                min={min}
                max={max}
                step={step}
                value={value}
                hideSteppers
                size="sm"
                label=""
                onChange={(_: any, { value: v }: any) => onChange(Number(v))}
                aria-label={label}
            />
        </div>
    );
}

// ─── Workspace Header with Tabs ────────────────────────────────────────────────
function HistoryWorkspaceHeader({
    selectedPatient,
    isSaving,
    onSave,
    onReset,
    children
}: {
    selectedPatient: any;
    isSaving: boolean;
    onSave: () => void;
    onReset: () => void;
    children?: React.ReactNode;
}) {
    return (
        <header className="pw-workspace-header" role="banner">
            <div className="pw-workspace-header__top">
                <div className="pw-workspace-header__title-block">
                    <h1 className="pw-workspace-header__title">Historia Clínica</h1>
                    {selectedPatient ? (
                        <p className="pw-workspace-header__subtitle" aria-label="Paciente activo">
                            <span className="pw-workspace-header__subtitle-main">
                                {selectedPatient.name_family}, {selectedPatient.name_given?.join(' ')}
                            </span>
                            <span className="pw-workspace-header__subtitle-meta">
                                · {calcAge(selectedPatient.birth_date)}
                                · {selectedPatient.gender === 'female' ? 'Femenino' : 'Masculino'}
                            </span>
                        </p>
                    ) : (
                        <p className="pw-workspace-header__subtitle">
                            Selecciona un paciente del panel lateral para comenzar
                        </p>
                    )}
                </div>

                <div className="pw-workspace-header__actions">
                    <Button
                        kind="ghost"
                        size="sm"
                        hasIconOnly
                        renderIcon={Reset}
                        iconDescription="Limpiar formulario"
                        tooltipAlignment="end"
                        onClick={onReset}
                        disabled={!selectedPatient}
                        aria-label="Limpiar formulario"
                    />
                    <Button
                        kind="primary"
                        size="sm"
                        renderIcon={Save}
                        onClick={onSave}
                        disabled={isSaving || !selectedPatient}
                        aria-label={isSaving ? 'Guardando encuentro' : 'Guardar encuentro'}
                        aria-busy={isSaving}
                    >
                        {isSaving ? 'Guardando…' : 'Guardar'}
                    </Button>
                </div>
            </div>

            {children && (
                <div className="pw-workspace-header__bottom">
                    {children}
                </div>
            )}
        </header>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function HistoryPage() {
    const searchParams = useSearchParams();
    const { tabs, activeTabId, setTabData } = useTabStore();

    const tabId = activeTabId || '/history';
    const currentTab = tabs.find(t => t.id === tabId);

    const [form, setForm] = useState<FormState>(currentTab?.data?.formState || defaultForm);
    const [patients, setPatients] = useState<any[]>([]);
    const [pastEncounters, setPastEncounters] = useState<any[]>([]);
    const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; title: string; subtitle: string } | null>(null);
    const { setSecondaryPanel, setSecondaryPanelOpen, setRightPanelOpen, rightPanelOpen } = useLayoutStore();

    // Sync form to tab store
    useEffect(() => {
        setTabData(tabId, { formState: form });
    }, [form, tabId, setTabData]);

    const { selectedPatient, clinicalData } = form;

    const setField = useCallback((field: string, value: any) =>
        setForm(prev => ({ ...prev, [field]: value })), []);

    const setVital = useCallback((key: VitalsKey, value: number) =>
        setForm(prev => ({ ...prev, vitals: { ...prev.vitals, [key]: value } })), []);

    // Load patient from URL param
    useEffect(() => {
        async function init() {
            const { data } = await getPatients();
            setPatients(data || []);

            const pid = searchParams.get('patientId');
            if (pid && data) {
                const patient = data.find((p: any) => p.id === pid);
                if (patient) {
                    setField('selectedPatient', patient);
                    setIsLoadingDetails(true);
                    const [cData, { data: encs }] = await Promise.all([
                        getPatientClinicalData(patient.id),
                        getEncounters(patient.id)
                    ]);
                    setField('clinicalData', cData);
                    setPastEncounters(encs || []);
                    setRightPanelOpen(true);
                    setIsLoadingDetails(false);
                }
            }
        }
        init();
    }, [searchParams, setRightPanelOpen]);

    // Also sync SpecialtySidebar when patient or encounters change
    useEffect(() => {
        if (!selectedPatient) {
            setSecondaryPanelOpen(false);
            return;
        }

        setSecondaryPanel(
            <SpecialtySidebar
                selectedPatient={selectedPatient}
                encounters={pastEncounters}
                activeEncounterId={activeEncounterId}
                onSelectEncounter={setActiveEncounterId}
                isLoading={isLoadingEncounters}
                onNewEncounter={handleReset}
            />,
            'Especialidades'
        );
        setSecondaryPanelOpen(true);
    }, [selectedPatient, pastEncounters, activeEncounterId, setSecondaryPanel, setSecondaryPanelOpen]);

    const handleSave = async () => {
        if (!selectedPatient) {
            setNotification({ type: 'error', title: 'Sin paciente', subtitle: 'Selecciona un paciente con ⌘K.' });
            return;
        }
        setIsSaving(true);
        setNotification(null);

        const res = await createEncounter({
            patient_id: selectedPatient.id,
            evolution_note: `MOTIVO:\n${form.chiefComplaint}\n\nENFERMEDAD ACTUAL:\n${form.currentIllness}\n\nEXAMEN FÍSICO:\n${form.physicalExam}\n\nEVOLUCIÓN:\n${form.evolutionNote}`,
            vital_signs: form.vitals,
            diagnosis: [
                { code: form.diagnosisPrimary, type: 'primary' },
                { code: form.diagnosisSecondary, type: 'secondary' },
            ],
            plan: form.treatmentPlan,
            reason_code: [{ text: form.chiefComplaint }],
        });

        setIsSaving(false);

        if (res.error) {
            setNotification({ type: 'error', title: 'Error al guardar', subtitle: res.error });
        } else {
            setNotification({ type: 'success', title: 'Encuentro guardado', subtitle: 'La evolución clínica se registró correctamente.' });
            const { data: encs } = await getEncounters(selectedPatient.id);
            setPastEncounters(encs || []);
            setForm(prev => ({
                ...prev,
                chiefComplaint: '', currentIllness: '', physicalExam: '',
                evolutionNote: '', diagnosisPrimary: '', diagnosisSecondary: '',
                treatmentPlan: '', vitals: { ...defaultVitals, weight: prev.vitals.weight, height: prev.vitals.height },
            }));
        }
    };

    const handleReset = () => {
        if (confirm('¿Limpiar todos los datos del formulario actual?')) {
            setForm(prev => ({ ...defaultForm, selectedPatient: prev.selectedPatient, clinicalData: prev.clinicalData }));
        }
    };

    return (
        <div className="hc-root">
            <Tabs>
                {/* ── Workspace Header ───────────────────────────────────────────── */}
                <HistoryWorkspaceHeader
                    selectedPatient={selectedPatient}
                    isSaving={isSaving}
                    onSave={handleSave}
                    onReset={handleReset}
                >
                    <TabList aria-label="Secciones del formulario clínico" className="pw-tab-list">
                        <Tab renderIcon={UserAvatar}>Subjetivo</Tab>
                        <Tab renderIcon={Activity}>Objetivo</Tab>
                        <Tab renderIcon={Stethoscope}>Evaluación y Plan</Tab>
                    </TabList>
                </HistoryWorkspaceHeader>

                {/* ── 3-column layout ────────────────────────────────────────────── */}
                <div className="hc-body">
                    {/* Center: main form area */}
                    <main className="hc-main" aria-label="Formulario de historia clínica">
                        {/* Notification */}
                        {notification && (
                            <div role="alert" aria-live="assertive">
                                <InlineNotification
                                    kind={notification.type}
                                    title={notification.title}
                                    subtitle={notification.subtitle}
                                    onClose={() => setNotification(null)}
                                    onCloseButtonClick={() => setNotification(null)}
                                    lowContrast
                                />
                            </div>
                        )}

                        {/* Form panels */}
                        <TabPanels>
                            {/* Panel: Subjetivo */}
                            <TabPanel className="hc-form-panel">
                                <div className="hc-form-group">
                                    <TextArea
                                        id="chief-complaint"
                                        labelText="Motivo de Consulta"
                                        placeholder="¿Por qué acude el paciente hoy?"
                                        rows={2}
                                        value={form.chiefComplaint}
                                        onChange={e => setField('chiefComplaint', e.target.value)}
                                        disabled={!selectedPatient}
                                    />
                                </div>
                                <div className="hc-form-group">
                                    <TextArea
                                        id="current-illness"
                                        labelText="Enfermedad Actual"
                                        placeholder="Síntomas, cronología y severidad…"
                                        rows={4}
                                        value={form.currentIllness}
                                        onChange={e => setField('currentIllness', e.target.value)}
                                        disabled={!selectedPatient}
                                    />
                                </div>
                                <div className="hc-form-group">
                                    <TextArea
                                        id="family-history"
                                        labelText="Antecedentes Familiares"
                                        placeholder="Cáncer, enfermedades cardiovasculares, diabetes…"
                                        rows={2}
                                        value={form.familyHistory}
                                        onChange={e => setField('familyHistory', e.target.value)}
                                        disabled={!selectedPatient}
                                    />
                                </div>
                                <div className="hc-form-group">
                                    <TextArea
                                        id="surgical-history"
                                        labelText="Antecedentes Quirúrgicos / Tóxicos"
                                        placeholder="Cirugías previas, tabaquismo, alcohol…"
                                        rows={2}
                                        value={form.surgicalHistory}
                                        onChange={e => setField('surgicalHistory', e.target.value)}
                                        disabled={!selectedPatient}
                                    />
                                </div>

                                {/* Conditions & Allergies */}
                                <div className="hc-inline-grid">
                                    <div className="hc-chip-section" aria-label="Condiciones del paciente">
                                        <span className="hc-chip-label">Condiciones</span>
                                        <div className="hc-chip-list" role="list">
                                            {clinicalData.conditions.length > 0
                                                ? clinicalData.conditions.map((c: any) => (
                                                    <Tag key={c.id} type="green" size="sm" role="listitem">{c.code_text}</Tag>
                                                ))
                                                : <span className="hc-chip-empty">
                                                    {selectedPatient ? 'Sin condiciones' : '—'}
                                                </span>
                                            }
                                        </div>
                                    </div>
                                    <div className="hc-chip-section" aria-label="Alergias del paciente">
                                        <span className="hc-chip-label">
                                            <Warning size={16} aria-hidden="true" className="hc-icon--error" />
                                            Alergias
                                        </span>
                                        <div className="hc-chip-list" role="list">
                                            {clinicalData.allergies.length > 0
                                                ? clinicalData.allergies.map((a: any) => (
                                                    <Tag key={a.id} type="red" size="sm" role="listitem">{a.code_text}</Tag>
                                                ))
                                                : <span className="hc-chip-empty">
                                                    {selectedPatient ? 'Sin alergias' : '—'}
                                                </span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>

                            {/* Panel: Objetivo */}
                            <TabPanel className="hc-form-panel">
                                <div className="hc-vitals-grid" aria-label="Signos vitales" role="group">
                                    <VitalInput id="v-bps" label="PA Sistólica (mmHg)" value={form.vitals.bpSystolic} min={60} max={250} onChange={v => setVital('bpSystolic', v)} />
                                    <VitalInput id="v-bpd" label="PA Diastólica (mmHg)" value={form.vitals.bpDiastolic} min={40} max={160} onChange={v => setVital('bpDiastolic', v)} />
                                    <VitalInput id="v-hr" label="FC (lpm)" value={form.vitals.heartRate} min={30} max={250} onChange={v => setVital('heartRate', v)} />
                                    <VitalInput id="v-temp" label="Temp (°C)" value={form.vitals.temperature} min={34} max={43} step={0.1} onChange={v => setVital('temperature', v)} />
                                    <VitalInput id="v-fr" label="FR (rpm)" value={form.vitals.respRate} min={8} max={60} onChange={v => setVital('respRate', v)} />
                                    <VitalInput id="v-spo2" label="SpO₂ (%)" value={form.vitals.spo2} min={60} max={100} onChange={v => setVital('spo2', v)} />
                                    <VitalInput id="v-wt" label="Peso (kg)" value={form.vitals.weight} min={1} max={400} step={0.1} onChange={v => setVital('weight', v)} />
                                    <VitalInput id="v-ht" label="Talla (cm)" value={form.vitals.height} min={30} max={250} onChange={v => setVital('height', v)} />
                                </div>
                                <div className="hc-form-group hc-form-group--vitals-footer">
                                    <TextArea
                                        id="physical-exam"
                                        labelText="Examen Físico"
                                        placeholder="Hallazgos por sistemas: Cabeza, Cuello, Tórax, Abdomen…"
                                        rows={5}
                                        value={form.physicalExam}
                                        onChange={e => setField('physicalExam', e.target.value)}
                                        disabled={!selectedPatient}
                                    />
                                </div>
                            </TabPanel>

                            {/* Panel: Evaluación y Plan */}
                            <TabPanel className="hc-form-panel">
                                <div className="hc-ai-hint" aria-label="AI Scribe disponible">
                                    <Chat size={16} aria-hidden="true" />
                                    <span>AI Scribe disponible — transcribe la sesión automáticamente</span>
                                    <Button kind="ghost" size="sm" className="hc-ai-hint__action">
                                        Activar
                                    </Button>
                                </div>

                                <div className="hc-form-group">
                                    <TextArea
                                        id="evolution-note"
                                        labelText="Nota de Evolución / Impresión Diagnóstica"
                                        placeholder="Resumen del análisis clínico…"
                                        rows={4}
                                        value={form.evolutionNote}
                                        onChange={e => setField('evolutionNote', e.target.value)}
                                        disabled={!selectedPatient}
                                    />
                                </div>

                                <div className="hc-two-col">
                                    <TextInput
                                        id="diagnosis-primary"
                                        labelText="Diagnóstico Principal (CIE-10)"
                                        placeholder="E11.9 — Diabetes Mellitus…"
                                        value={form.diagnosisPrimary}
                                        onChange={e => setField('diagnosisPrimary', e.target.value)}
                                        disabled={!selectedPatient}
                                        size="sm"
                                    />
                                    <TextInput
                                        id="diagnosis-secondary"
                                        labelText="Diagnóstico Secundario"
                                        placeholder="I10 — Hipertensión…"
                                        value={form.diagnosisSecondary}
                                        onChange={e => setField('diagnosisSecondary', e.target.value)}
                                        disabled={!selectedPatient}
                                        size="sm"
                                    />
                                </div>

                                <div className="hc-form-group">
                                    <TextArea
                                        id="treatment-plan"
                                        labelText="Plan Terapéutico e Indicaciones"
                                        placeholder="Medicamentos, dosis, estudios, próxima cita…"
                                        rows={5}
                                        value={form.treatmentPlan}
                                        onChange={e => setField('treatmentPlan', e.target.value)}
                                        disabled={!selectedPatient}
                                    />
                                </div>

                                <div className="hc-quick-actions" role="group" aria-label="Acciones rápidas">
                                    {['Receta Médica', 'Laboratorios', 'Certificado', 'Referencia'].map(action => (
                                        <Button key={action} kind="ghost" size="sm" disabled={!selectedPatient}>
                                            {action}
                                        </Button>
                                    ))}
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </main>
                </div>
            </Tabs>
        </div>
    );
}
