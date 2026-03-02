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

// Empty state when no patient selected
function EmptyState() {
    return (
        <div className="hc-empty-state" role="status" aria-label="Sin paciente seleccionado">
            <div className="hc-empty-state__icon">
                <Search size={24} aria-hidden="true" />
            </div>
            <p className="hc-empty-state__title">Ningún paciente seleccionado</p>
            <p className="hc-empty-state__hint">
                Usa <kbd>⌘K</kbd> para buscar un paciente y abrir su historia clínica
            </p>
        </div>
    );
}

// Encounter card in left sidebar
function EncounterItem({ enc, isActive, onClick }: { enc: any; isActive: boolean; onClick: () => void }) {
    const status = enc.status || 'finished';
    const tagType = status === 'finished' ? 'green' : 'warm-gray';
    const tagLabel = status === 'finished' ? 'Completada' : 'En curso';
    const TagIcon = status === 'finished' ? Checkmark : Time;

    return (
        <button
            className={`hc-enc-item${isActive ? ' hc-enc-item--active' : ''}`}
            onClick={onClick}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`Encuentro del ${formatDate(enc.start_time)}: ${enc.reason_code?.[0]?.text || 'Consulta General'}`}
        >
            <span className="hc-enc-item__bar" aria-hidden="true" />
            <span className="hc-enc-item__body">
                <span className="hc-enc-item__date">
                    <span className="hc-enc-item__date-text">{formatDate(enc.start_time)}</span>
                    <Tag type={tagType} size="sm" renderIcon={TagIcon}>{tagLabel}</Tag>
                </span>
                <span className="hc-enc-item__reason">
                    {enc.reason_code?.[0]?.text || 'Consulta General'}
                </span>
                <span className="hc-enc-item__preview">
                    {enc.evolution_note?.substring(0, 80) || enc.plan?.substring(0, 80) || 'Sin nota registrada'}
                </span>
            </span>
        </button>
    );
}

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
}: {
    selectedPatient: any;
    isSaving: boolean;
    onSave: () => void;
    onReset: () => void;
}) {
    return (
        <header className="pw-workspace-header" role="banner">
            <div className="pw-workspace-header__top">
                <div className="pw-workspace-header__title-block">
                    <h1 className="pw-workspace-header__title">Historia Clínica</h1>
                    {selectedPatient ? (
                        <p className="pw-workspace-header__subtitle" aria-label="Paciente activo">
                            <strong>
                                {selectedPatient.name_family}, {selectedPatient.name_given?.join(' ')}
                            </strong>
                            <span style={{ marginLeft: '0.5rem', fontWeight: 400 }}>
                                · {calcAge(selectedPatient.birth_date)}
                                · {selectedPatient.gender === 'female' ? 'Femenino' : 'Masculino'}
                            </span>
                        </p>
                    ) : (
                        <p className="pw-workspace-header__subtitle">
                            Busca un paciente con <kbd style={{ fontFamily: 'IBM Plex Mono, monospace', background: 'var(--cds-layer-02)', border: '1px solid var(--cds-border-strong)', padding: '1px 5px', fontSize: '0.75rem' }}>⌘K</kbd> para comenzar
                        </p>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {selectedPatient && (
                        <>
                            <Button
                                kind="ghost"
                                size="sm"
                                hasIconOnly
                                renderIcon={Reset}
                                iconDescription="Limpiar formulario"
                                tooltipAlignment="end"
                                onClick={onReset}
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
                        </>
                    )}
                </div>
            </div>

            {/* Tabs: Nueva Consulta / Ver Historial */}
            <div className="hc-workspace-tabs" role="tablist" aria-label="Modo de historia clínica">
                <button
                    className="hc-workspace-tab hc-workspace-tab--active"
                    role="tab"
                    aria-selected="true"
                    id="hc-wt-encounter"
                >
                    <DocumentMultiple_01 size={14} aria-hidden="true" />
                    Nueva Consulta
                </button>
            </div>
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
    const [sectionTab, setSectionTab] = useState<SectionTab>('subjective');
    const [rightPanelOpen, setRightPanelOpen] = useState(true);

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
                    const cData = await getPatientClinicalData(patient.id);
                    setField('clinicalData', cData);
                    setIsLoadingDetails(false);
                    setIsLoadingEncounters(true);
                    const { data: encs } = await getEncounters(patient.id);
                    setPastEncounters(encs || []);
                    setIsLoadingEncounters(false);
                }
            }
        }
        init();
    }, [searchParams]);

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

    const sectionTabs: { id: SectionTab; label: string; icon: React.ComponentType<any> }[] = [
        { id: 'subjective', label: 'Subjetivo', icon: UserAvatar },
        { id: 'objective', label: 'Objetivo', icon: Activity },
        { id: 'plan', label: 'Evaluación y Plan', icon: Stethoscope },
    ];

    return (
        <div className="hc-root">
            {/* ── Workspace Header ───────────────────────────────────────────── */}
            <HistoryWorkspaceHeader
                selectedPatient={selectedPatient}
                isSaving={isSaving}
                onSave={handleSave}
                onReset={handleReset}
            />

            {/* ── 3-column layout ────────────────────────────────────────────── */}
            <div className="hc-body">
                {/* Left sidebar: encounter history */}
                <aside className="hc-sidebar" aria-label="Historial de encuentros">
                    <div className="hc-sidebar__header">
                        <span className="hc-sidebar__title">Historial</span>
                        {pastEncounters.length > 0 && (
                            <span className="hc-sidebar__badge" aria-label={`${pastEncounters.length} encuentros`}>
                                {pastEncounters.length}
                            </span>
                        )}
                        <Button
                            kind="ghost"
                            size="sm"
                            hasIconOnly
                            renderIcon={Add}
                            iconDescription="Nuevo encuentro"
                            tooltipAlignment="end"
                            onClick={() => {
                                setActiveEncounterId(null);
                                setForm(prev => ({
                                    ...defaultForm,
                                    selectedPatient: prev.selectedPatient,
                                    clinicalData: prev.clinicalData,
                                }));
                            }}
                            aria-label="Nuevo encuentro"
                        />
                    </div>

                    <div className="hc-sidebar__body" role="list" aria-label="Lista de encuentros">
                        {!selectedPatient ? (
                            <EmptyState />
                        ) : isLoadingEncounters ? (
                            <div className="hc-sidebar__loading" aria-live="polite" aria-busy="true">
                                <Loading withOverlay={false} small description="Cargando encuentros..." />
                            </div>
                        ) : pastEncounters.length === 0 ? (
                            <div className="hc-empty-state hc-empty-state--sm" role="status">
                                <Chat size={20} aria-hidden="true" />
                                <p>Sin encuentros previos</p>
                            </div>
                        ) : (
                            <div role="list">
                                {pastEncounters.map(enc => (
                                    <div key={enc.id} role="listitem">
                                        <EncounterItem
                                            enc={enc}
                                            isActive={activeEncounterId === enc.id}
                                            onClick={() => setActiveEncounterId(enc.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

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

                    {/* Section tabs — VSCode style */}
                    <nav className="hc-section-tabs" aria-label="Secciones del formulario clínico" role="tablist">
                        {sectionTabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                role="tab"
                                aria-selected={sectionTab === id}
                                aria-controls={`hc-panel-${id}`}
                                id={`hc-tab-${id}`}
                                className={`hc-section-tab${sectionTab === id ? ' hc-section-tab--active' : ''}`}
                                onClick={() => setSectionTab(id)}
                            >
                                <Icon size={14} aria-hidden="true" />
                                <span>{label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Form panels */}
                    <div className="hc-form-scroll">
                        {/* Panel: Subjetivo */}
                        <section
                            id="hc-panel-subjective"
                            role="tabpanel"
                            aria-labelledby="hc-tab-subjective"
                            hidden={sectionTab !== 'subjective'}
                            className="hc-form-panel"
                        >
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
                                        <Warning size={12} aria-hidden="true" style={{ color: 'var(--cds-support-error)' }} />
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
                        </section>

                        {/* Panel: Objetivo */}
                        <section
                            id="hc-panel-objective"
                            role="tabpanel"
                            aria-labelledby="hc-tab-objective"
                            hidden={sectionTab !== 'objective'}
                            className="hc-form-panel"
                        >
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
                            <div className="hc-form-group" style={{ marginTop: '1.25rem' }}>
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
                        </section>

                        {/* Panel: Evaluación y Plan */}
                        <section
                            id="hc-panel-plan"
                            role="tabpanel"
                            aria-labelledby="hc-tab-plan"
                            hidden={sectionTab !== 'plan'}
                            className="hc-form-panel"
                        >
                            <div className="hc-ai-hint" aria-label="AI Scribe disponible">
                                <Chat size={13} aria-hidden="true" />
                                <span>AI Scribe disponible — transcribe la sesión automáticamente</span>
                                <Button kind="ghost" size="sm" style={{ marginLeft: 'auto', padding: '0 0.5rem' }}>
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
                        </section>
                    </div>
                </main>

                {/* Right panel: patient summary */}
                <aside
                    className={`hc-right-panel${rightPanelOpen ? '' : ' hc-right-panel--collapsed'}`}
                    aria-label="Resumen del paciente"
                    aria-expanded={rightPanelOpen}
                >
                    <button
                        className="hc-right-panel__toggle"
                        onClick={() => setRightPanelOpen(v => !v)}
                        aria-label={rightPanelOpen ? 'Colapsar panel de resumen' : 'Expandir panel de resumen'}
                    >
                        {rightPanelOpen ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronLeft size={14} aria-hidden="true" />}
                    </button>

                    {rightPanelOpen && (
                        <div className="hc-right-panel__content">
                            <div className="hc-right-panel__header">
                                <span>Resumen</span>
                            </div>

                            {!selectedPatient ? (
                                <div className="hc-rp-empty" role="status">
                                    <span>Selecciona un paciente</span>
                                </div>
                            ) : (
                                <>
                                    <div className="hc-rp-section" aria-label="Alergias del paciente">
                                        <div className="hc-rp-section__title hc-rp-section__title--danger">
                                            <Warning size={12} aria-hidden="true" />
                                            Alergias
                                        </div>
                                        <div className="hc-chip-list" role="list">
                                            {clinicalData.allergies.length > 0
                                                ? clinicalData.allergies.map((a: any) => (
                                                    <Tag key={a.id} type="red" size="sm" role="listitem">{a.code_text}</Tag>
                                                ))
                                                : <span className="hc-chip-empty">Sin alergias</span>
                                            }
                                        </div>
                                    </div>

                                    <div className="hc-rp-section" aria-label="Condiciones del paciente">
                                        <div className="hc-rp-section__title">Condiciones activas</div>
                                        <div className="hc-chip-list" role="list">
                                            {clinicalData.conditions.length > 0
                                                ? clinicalData.conditions.map((c: any) => (
                                                    <Tag key={c.id} type="teal" size="sm" role="listitem">{c.code_text}</Tag>
                                                ))
                                                : <span className="hc-chip-empty">Sin condiciones</span>
                                            }
                                        </div>
                                    </div>

                                    {pastEncounters[0]?.vital_signs && (
                                        <div className="hc-rp-section" aria-label="Últimos signos vitales">
                                            <div className="hc-rp-section__title">Últimos signos vitales</div>
                                            <dl className="hc-rp-vitals">
                                                {Object.entries(pastEncounters[0].vital_signs as Record<string, number>)
                                                    .slice(0, 6)
                                                    .map(([k, v]) => (
                                                        <div key={k} className="hc-rp-vital-row">
                                                            <dt className="hc-rp-vital-key">{k}</dt>
                                                            <dd className="hc-rp-vital-val">{String(v)}</dd>
                                                        </div>
                                                    ))}
                                            </dl>
                                        </div>
                                    )}

                                    {pastEncounters[0] && (
                                        <div className="hc-rp-section">
                                            <div className="hc-rp-section__title">Última consulta</div>
                                            <span className="hc-rp-date">{formatDate(pastEncounters[0].start_time)}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
