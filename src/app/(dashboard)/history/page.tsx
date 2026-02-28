'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
    Button,
    Tile,
    TextInput,
    TextArea,
    Select,
    SelectItem,
    NumberInput,
    Tag,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    ComboBox,
    Column,
    Grid,
    Loading,
    InlineNotification,
    ToastNotification,
} from '@carbon/react';
import {
    Save,
    Chat,
    Stethoscope,
    Activity,
    UserAvatar,
    Reset,
} from '@carbon/icons-react';
import { getPatients, getPatientClinicalData, createEncounter, getEncounters } from '@/actions/patients';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTabStore } from '@/store/useTabStore';

export default function HistoryPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { tabs, activeTabId, setTabData, historyTabIndex, setHistoryTab } = useTabStore();

    // Identify current tab to load/save state
    const tabId = activeTabId || '/history';
    const currentTab = tabs.find(t => t.id === tabId);

    // Form State
    const [formState, setFormState] = useState(currentTab?.data?.formState || {
        chiefComplaint: '',
        currentIllness: '',
        familyHistory: '',
        surgicalHistory: '',
        vitals: {
            bpSystolic: 120,
            bpDiastolic: 80,
            heartRate: 72,
            temperature: 36.5,
            respRate: 18,
            spo2: 98,
            weight: 68,
            height: 165
        },
        physicalExam: '',
        evolutionNote: '',
        diagnosisPrimary: '',
        diagnosisSecondary: '',
        treatmentPlan: '',
        selectedPatient: null,
        clinicalData: { conditions: [], allergies: [] }
    });

    // Sync formState to Store
    useEffect(() => {
        setTabData(tabId, { formState });
    }, [formState, tabId, setTabData]);

    // Helpers to access nested state easily
    const selectedPatient = formState.selectedPatient;
    const clinicalData = formState.clinicalData;

    const handleInputChange = (field: string, value: any) => {
        setFormState((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleVitalChange = (field: string, value: any) => {
        setFormState((prev: any) => ({
            ...prev,
            vitals: { ...prev.vitals, [field]: value }
        }));
    };

    // Patient State
    const [patients, setPatients] = useState<any[]>([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [pastEncounters, setPastEncounters] = useState<any[]>([]);
    const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', title: string, subtitle: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const fetchEncounters = async (patientId: string) => {
        setIsLoadingEncounters(true);
        const { data } = await getEncounters(patientId);
        setPastEncounters(data || []);
        setIsLoadingEncounters(false);
    };

    const handleSaveEncounter = async () => {
        if (!selectedPatient) {
            setNotification({
                type: 'error',
                title: 'Error de Validación',
                subtitle: 'Debe seleccionar un paciente antes de guardar el encuentro.'
            });
            return;
        }

        setIsSaving(true);
        setNotification(null);

        const encounterData = {
            patient_id: selectedPatient.id,
            evolution_note: `ANAMNESIS:\n${formState.currentIllness}\n\nEXAMEN FÍSICO:\n${formState.physicalExam}\n\nEVOLUCIÓN:\n${formState.evolutionNote}`,
            vital_signs: formState.vitals,
            diagnosis: [
                { code: formState.diagnosisPrimary, type: 'primary' },
                { code: formState.diagnosisSecondary, type: 'secondary' }
            ],
            plan: formState.treatmentPlan,
            reason_code: [{ text: formState.chiefComplaint }]
        };

        const result = await createEncounter(encounterData);
        setIsSaving(false);

        if (result.error) {
            setNotification({
                type: 'error',
                title: 'Error al Guardar',
                subtitle: result.error
            });
        } else {
            setNotification({
                type: 'success',
                title: 'Encuentro Guardado',
                subtitle: 'La evolución clínica se ha registrado correctamente.'
            });

            // 1. Refresh encounter list
            fetchEncounters(selectedPatient.id);

            // 2. Clear SPECIFIC fields (Reset current session data but keep patient)
            setFormState((prev: any) => ({
                ...prev,
                chiefComplaint: '',
                currentIllness: '',
                physicalExam: '',
                evolutionNote: '',
                diagnosisPrimary: '',
                diagnosisSecondary: '',
                treatmentPlan: '',
                // Keep vitals as a baseline or clear? User said "limpia la seccion", 
                // usually vitals should be cleared for a new encounter.
                vitals: {
                    bpSystolic: 120,
                    bpDiastolic: 80,
                    heartRate: 72,
                    temperature: 36.5,
                    respRate: 18,
                    spo2: 98,
                    weight: prev.vitals.weight, // Keep weight/height as reasonable defaults
                    height: prev.vitals.height
                }
            }));
        }
    };

    // Load patients on mount
    useEffect(() => {
        async function loadInitialPatients() {
            setIsLoadingPatients(true);
            const { data } = await getPatients();
            setPatients(data || []);

            // Check if patientId is in URL
            const patientIdFromUrl = searchParams.get('patientId');
            if (patientIdFromUrl && data) {
                const patient = data.find((p: any) => p.id === patientIdFromUrl);
                if (patient) {
                    handleInputChange('selectedPatient', patient);
                    // Fetch clinical details immediately
                    setIsLoadingDetails(true);
                    getPatientClinicalData(patient.id).then(cData => {
                        handleInputChange('clinicalData', cData);
                        setIsLoadingDetails(false);
                    });
                }
            }
            setIsLoadingPatients(false);
        }
        loadInitialPatients();
    }, [searchParams]);

    const handlePatientChange = async ({ selectedItem }: any) => {
        handleInputChange('selectedPatient', selectedItem);
        if (selectedItem) {
            // Update URL for workspace consistency
            const params = new URLSearchParams(searchParams.toString());
            params.set('patientId', selectedItem.id);
            window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);

            // Fetch clinical details
            setIsLoadingDetails(true);
            const data = await getPatientClinicalData(selectedItem.id);
            handleInputChange('clinicalData', data);
            setIsLoadingDetails(false);

            // Fetch past encounters
            fetchEncounters(selectedItem.id);
        } else {
            handleInputChange('selectedPatient', null);
            handleInputChange('clinicalData', { conditions: [], allergies: [] });
            setPastEncounters([]);
        }
    };

    const getFormattedPatients = () => {
        return patients.map(p => ({
            id: p.id,
            label: `${p.name_family}, ${p.name_given?.join(' ')} (${p.identifiers?.[0]?.value || 'S/ID'})`,
            ...p
        }));
    };

    return (
        <div className="history-page-container">
            <div className="page-header" style={{ marginBottom: 0, borderBottom: '1px solid var(--cds-border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-header__title">Historia Clínica</h1>
                        <p className="page-header__subtitle">
                            Registro Clínico — SOAP (Subjective, Objective, Assessment, Plan)
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                            kind="ghost"
                            renderIcon={Reset}
                            size="md"
                            onClick={() => {
                                if (confirm('¿Desea limpiar todos los datos del formulario actual?')) {
                                    setFormState({
                                        chiefComplaint: '',
                                        currentIllness: '',
                                        familyHistory: '',
                                        surgicalHistory: '',
                                        vitals: {
                                            bpSystolic: 120,
                                            bpDiastolic: 80,
                                            heartRate: 72,
                                            temperature: 36.5,
                                            respRate: 18,
                                            spo2: 98,
                                            weight: 68,
                                            height: 165
                                        },
                                        physicalExam: '',
                                        evolutionNote: '',
                                        diagnosisPrimary: '',
                                        diagnosisSecondary: '',
                                        treatmentPlan: '',
                                        selectedPatient: null,
                                        clinicalData: { conditions: [], allergies: [] }
                                    });
                                }
                            }}
                        >
                            Limpiar Formulario
                        </Button>
                        <Button
                            kind="primary"
                            renderIcon={Save}
                            size="md"
                            onClick={handleSaveEncounter}
                            disabled={isSaving || !selectedPatient}
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Encuentro'}
                        </Button>
                    </div>
                </div>
            </div>

            {notification && (
                <div style={{ padding: '1rem 2rem 0 2rem' }}>
                    <InlineNotification
                        kind={notification.type}
                        title={notification.title}
                        subtitle={notification.subtitle}
                        onClose={() => setNotification(null)}
                        onCloseButtonClick={() => setNotification(null)}
                    />
                </div>
            )}

            {/* Sticky Patient Selector Container */}
            <div style={{
                padding: '1rem 2rem',
                background: 'var(--cds-layer-01)',
                borderBottom: '1px solid var(--cds-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem'
            }}>
                <div style={{ width: '400px' }}>
                    <ComboBox
                        id="patient-selector"
                        items={getFormattedPatients()}
                        onChange={handlePatientChange}
                        placeholder="Seleccionar paciente por nombre o ID..."
                        titleText="Paciente"
                        initialSelectedItem={selectedPatient ? {
                            id: selectedPatient.id,
                            label: `${selectedPatient.name_family}, ${selectedPatient.name_given?.join(' ')}`
                        } : undefined}
                        size="md"
                    />
                </div>

                {selectedPatient && (
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ borderLeft: '1px solid var(--cds-border-subtle)', height: '24px' }} />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Resumen de Paciente</div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                {selectedPatient.gender === 'female' ? 'Femenino' : 'Masculino'} · {selectedPatient.birth_date || 'N/A'}
                            </div>
                        </div>
                        <Tag type="blue" size="sm">CIB: {selectedPatient.identifiers?.[0]?.value || 'N/A'}</Tag>
                    </div>
                )}
            </div>

            {/* Content Area with Main Form and Side Panel */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Side: Main Form Tabs */}
                <div style={{ flex: 1, overflowY: 'auto' }} className="history-tabs-wrapper">
                    <Tabs selectedIndex={historyTabIndex} onChange={({ selectedIndex }) => setHistoryTab(selectedIndex)}>
                        <TabList aria-label="Secciones de Historia Clínica" contained>
                            <Tab renderIcon={UserAvatar}>1. Subjetivo / Antecedentes</Tab>
                            <Tab renderIcon={Activity}>2. Objetivo / Signos Vitales</Tab>
                            <Tab renderIcon={Stethoscope}>3. Evolución y Plan</Tab>
                        </TabList>
                        <TabPanels>
                            {/* TAB 1: SUBJETIVO */}
                            <TabPanel>
                                <div style={{ padding: '2rem', maxWidth: '1000px' }}>
                                    <Grid>
                                        <Column lg={8} md={8} sm={4}>
                                            <h3 className="section-title">Motivo de Consulta y Antecedentes</h3>
                                            <div style={{ marginTop: '1.5rem' }}>
                                                <TextArea
                                                    id="chief-complaint"
                                                    labelText="Motivo de Consulta"
                                                    placeholder="¿Por qué acude el paciente hoy?"
                                                    rows={3}
                                                    value={formState.chiefComplaint}
                                                    onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                                                />
                                            </div>
                                            <div style={{ marginTop: '1.5rem' }}>
                                                <TextArea
                                                    id="current-illness"
                                                    labelText="Enfermedad Actual"
                                                    placeholder="Desglose de los síntomas, cronología y severidad..."
                                                    rows={5}
                                                    value={formState.currentIllness}
                                                    onChange={(e) => handleInputChange('currentIllness', e.target.value)}
                                                />
                                            </div>
                                        </Column>
                                        <Column lg={8} md={8} sm={4}>
                                            <h3 className="section-title">Revisión de Antecedentes</h3>
                                            <div style={{ marginTop: '1.5rem' }}>
                                                <Tile style={{ padding: '1rem', border: '1px solid var(--cds-border-subtle)', position: 'relative' }}>
                                                    {isLoadingDetails && (
                                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                                            <Loading withOverlay={false} small />
                                                        </div>
                                                    )}
                                                    <div style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Antecedentes Patológicos</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {clinicalData.conditions.length > 0 ? (
                                                            clinicalData.conditions.map((c: any) => (
                                                                <Tag key={c.id} type="green" size="sm" title={c.clinical_status}>{c.code_text}</Tag>
                                                            ))
                                                        ) : (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                                                                {selectedPatient ? 'Sin condiciones registradas' : 'Seleccione un paciente'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Tile>
                                            </div>
                                            <div style={{ marginTop: '1rem' }}>
                                                <Tile style={{ padding: '1rem', border: '1px solid var(--cds-border-subtle)' }}>
                                                    <div style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>Alergias / Intolerancias</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {clinicalData.allergies.length > 0 ? (
                                                            clinicalData.allergies.map((a: any) => (
                                                                <Tag key={a.id} type="red" size="sm">{a.code_text}</Tag>
                                                            ))
                                                        ) : (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                                                                {selectedPatient ? 'Sin alergias registradas' : 'Seleccione un paciente'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Tile>
                                            </div>
                                            <div style={{ marginTop: '1rem' }}>
                                                <TextArea
                                                    id="family-history"
                                                    labelText="Antecedentes Familiares"
                                                    placeholder="Cáncer, enfermedades cardiovasculares, etc."
                                                    rows={2}
                                                    value={formState.familyHistory}
                                                    onChange={(e) => handleInputChange('familyHistory', e.target.value)}
                                                />
                                            </div>
                                            <div style={{ marginTop: '1rem' }}>
                                                <TextArea
                                                    id="surgical-history"
                                                    labelText="Antecedentes Quirúrgicos/Tóxicos"
                                                    placeholder="Cirugías previas, tabaquismo, alcohol..."
                                                    rows={2}
                                                    value={formState.surgicalHistory}
                                                    onChange={(e) => handleInputChange('surgicalHistory', e.target.value)}
                                                />
                                            </div>
                                        </Column>
                                    </Grid>
                                </div>
                            </TabPanel>

                            {/* TAB 2: OBJETIVO */}
                            <TabPanel>
                                <div style={{ padding: '2rem', maxWidth: '1000px' }}>
                                    <h3 className="section-title" style={{ marginBottom: '2rem' }}>Exploración Física y Signos Vitales</h3>

                                    <Grid style={{ marginBottom: '2rem' }}>
                                        <Column lg={4} md={4} sm={2}>
                                            <NumberInput id="bp-systolic" label="PA Sistólica (mmHg)" min={60} max={250} value={formState.vitals.bpSystolic} step={1} hideSteppers size="md" onChange={(_, { value }) => handleVitalChange('bpSystolic', value)} />
                                        </Column>
                                        <Column lg={4} md={4} sm={2}>
                                            <NumberInput id="bp-diastolic" label="PA Diastólica (mmHg)" min={40} max={160} value={formState.vitals.bpDiastolic} step={1} hideSteppers size="md" onChange={(_, { value }) => handleVitalChange('bpDiastolic', value)} />
                                        </Column>
                                        <Column lg={4} md={4} sm={2}>
                                            <NumberInput id="heart-rate" label="FC (lpm)" min={30} max={250} value={formState.vitals.heartRate} step={1} hideSteppers size="md" onChange={(_, { value }) => handleVitalChange('heartRate', value)} />
                                        </Column>
                                        <Column lg={4} md={4} sm={2}>
                                            <NumberInput id="temperature" label="Temp (°C)" min={34} max={43} value={formState.vitals.temperature} step={0.1} hideSteppers size="md" onChange={(_, { value }) => handleVitalChange('temperature', value)} />
                                        </Column>
                                        <Column lg={4} md={4} sm={2}>
                                            <NumberInput id="resp-rate" label="FR (rpm)" min={8} max={60} value={formState.vitals.respRate} step={1} hideSteppers size="md" onChange={(_, { value }) => handleVitalChange('respRate', value)} />
                                        </Column>
                                        <Column lg={4} md={4} sm={2}>
                                            <NumberInput id="spo2" label="SpO₂ (%)" min={60} max={100} value={formState.vitals.spo2} step={1} hideSteppers size="md" onChange={(_, { value }) => handleVitalChange('spo2', value)} />
                                        </Column>
                                        <Column lg={4} md={4} sm={2}>
                                            <NumberInput id="weight" label="Peso (kg)" min={1} max={400} value={formState.vitals.weight} step={0.1} hideSteppers size="md" onChange={(_, { value }) => handleVitalChange('weight', value)} />
                                        </Column>
                                        <Column lg={4} md={4} sm={2}>
                                            <NumberInput id="height" label="Talla (cm)" min={30} max={250} value={formState.vitals.height} step={1} hideSteppers size="md" onChange={(_, { value }) => handleVitalChange('height', value)} />
                                        </Column>
                                    </Grid>

                                    <div style={{ marginTop: '2rem' }}>
                                        <TextArea
                                            id="physical-exam"
                                            labelText="Hallazgos del Examen Físico"
                                            placeholder="Describa los hallazgos por sistemas (Cabeza, Cuello, Tórax, Abdomen...)"
                                            rows={6}
                                            value={formState.physicalExam}
                                            onChange={(e) => handleInputChange('physicalExam', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </TabPanel>

                            {/* TAB 3: PLAN / EVOLUCIÓN */}
                            <TabPanel>
                                <div style={{ padding: '2rem', maxWidth: '1000px' }}>
                                    <Grid>
                                        <Column lg={10} md={8} sm={4}>
                                            <h3 className="section-title">Análisis, Diagnóstico y Plan</h3>

                                            {/* AI Scribe Card */}
                                            <div className="ai-card" style={{ padding: '1.25rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                    <Chat size={16} style={{ color: 'var(--clinicboard-accent)' }} />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clinicboard-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        AI Scribe
                                                    </span>
                                                    <Tag type="purple" size="sm" style={{ marginLeft: 'auto' }}>Optimizado</Tag>
                                                </div>
                                                <p style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                                                    Transcribe la sesión para generar automáticamente la nota de evolución estructurada.
                                                </p>
                                                <Button kind="tertiary" size="sm" style={{ marginTop: '1rem' }} renderIcon={Chat}>
                                                    Iniciar AI Scribe
                                                </Button>
                                            </div>

                                            <div style={{ marginTop: '1.5rem' }}>
                                                <TextArea
                                                    id="evolution-note"
                                                    labelText="Nota de Evolución / Impresión Diagnóstica"
                                                    placeholder="Resumen del análisis clínico..."
                                                    rows={5}
                                                    value={formState.evolutionNote}
                                                    onChange={(e) => handleInputChange('evolutionNote', e.target.value)}
                                                />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                                                <TextInput id="diagnosis-primary" labelText="Diagnóstico Principal (CIE-10)" placeholder="E11.9 - Diabetes Mellitus..." value={formState.diagnosisPrimary} onChange={(e) => handleInputChange('diagnosisPrimary', e.target.value)} />
                                                <TextInput id="diagnosis-secondary" labelText="Diagnóstico Secundario" placeholder="I10 - Hipertensión..." value={formState.diagnosisSecondary} onChange={(e) => handleInputChange('diagnosisSecondary', e.target.value)} />
                                            </div>

                                            <div style={{ marginTop: '1.5rem' }}>
                                                <TextArea
                                                    id="treatment-plan"
                                                    labelText="Plan Terapéutico e Indicaciones"
                                                    placeholder="Medicamentos, dosis, estudios solicitados, próxima cita..."
                                                    rows={5}
                                                    value={formState.treatmentPlan}
                                                    onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                                                />
                                            </div>
                                        </Column>
                                        <Column lg={6} md={8} sm={4}>
                                            <Tile style={{ background: 'var(--cds-layer-02)', padding: '1.5rem', border: '1px solid var(--cds-border-subtle)' }}>
                                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>Acciones Rápidas</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    <Button kind="ghost" size="sm">Generar Receta Médica</Button>
                                                    <Button kind="ghost" size="sm">Solicitar Laboratorios</Button>
                                                    <Button kind="ghost" size="sm">Certificado Médico</Button>
                                                    <Button kind="ghost" size="sm">Referencia a Especialista</Button>
                                                </div>
                                            </Tile>
                                        </Column>
                                    </Grid>
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </div>

                {/* Right Side: Encounter History (Cards) */}
                <aside className="history-sidebar">
                    <div className="sidebar-header">
                        <h3 className="sidebar-title">Encuentros Pasados</h3>
                        <span className="sidebar-count">{pastEncounters.length} registros</span>
                    </div>

                    <div className="sidebar-content">
                        {isLoadingEncounters ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <Loading withOverlay={false} small />
                            </div>
                        ) : pastEncounters.length > 0 ? (
                            <div className="encounter-list">
                                {pastEncounters.map((enc) => (
                                    <div key={enc.id} className="encounter-card">
                                        <div className="card-indicator" />
                                        <div className="card-content">
                                            <div className="card-date">
                                                {new Date(enc.start_time).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="card-reason">
                                                {enc.reason_code?.[0]?.text || 'Consulta General'}
                                            </div>
                                            <div className="card-meta">
                                                Dr. {enc.practitioner?.name_family}
                                            </div>
                                            <div className="card-note-preview">
                                                {enc.evolution_note?.substring(0, 100)}...
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-history">
                                <Chat size={24} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                <p>No hay encuentros previos seleccionados</p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            <style jsx>{`
                .history-page-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: var(--cds-background);
                }
                .section-title {
                    font-size: 1.125rem;
                    font-weight: 500;
                    color: var(--cds-text-primary);
                }
                .history-tabs-wrapper :global(.cds--tabs__nav) {
                    border-bottom: 1px solid var(--cds-border-subtle);
                }
                .ai-card {
                    background: var(--cds-layer-01);
                    border: 1px solid var(--cds-border-subtle);
                    transition: border-color 0.2s;
                }
                .ai-card:hover {
                    border-color: var(--clinicboard-accent);
                }
                .history-sidebar {
                    width: 320px;
                    background: var(--cds-background);
                    border-left: 1px solid var(--cds-border-subtle);
                    display: flex;
                    flex-direction: column;
                }
                .sidebar-header {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--cds-border-subtle);
                }
                .sidebar-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    margin: 0;
                }
                .sidebar-count {
                    font-size: 0.75rem;
                    color: var(--cds-text-secondary);
                }
                .sidebar-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                }
                .encounter-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .encounter-card {
                    background: var(--cds-layer-01);
                    border: 1px solid var(--cds-border-subtle);
                    display: flex;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                .encounter-card:hover {
                    border-color: var(--clinicboard-accent);
                    background: var(--cds-layer-hover-01);
                }
                .card-indicator {
                    width: 3px;
                    background: var(--clinicboard-accent);
                    opacity: 0.7;
                }
                .card-content {
                    padding: 0.75rem 1rem;
                    flex: 1;
                }
                .card-date {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--cds-text-primary);
                    margin-bottom: 0.25rem;
                }
                .card-reason {
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: var(--cds-text-primary);
                    margin-bottom: 0.25rem;
                }
                .card-meta {
                    font-size: 0.6875rem;
                    color: var(--cds-text-secondary);
                    margin-bottom: 0.5rem;
                }
                .card-note-preview {
                    font-size: 0.75rem;
                    color: var(--cds-text-secondary);
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .empty-history {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: var(--cds-text-secondary);
                    font-size: 0.8125rem;
                    text-align: center;
                }
                .history-sidebar {
                    width: 320px;
                    background: var(--cds-background);
                    border-left: 1px solid var(--cds-border-subtle);
                    display: flex;
                    flex-direction: column;
                }
                .sidebar-header {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--cds-border-subtle);
                }
                .sidebar-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    margin: 0;
                }
                .sidebar-count {
                    font-size: 0.75rem;
                    color: var(--cds-text-secondary);
                }
                .sidebar-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                }
                .encounter-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .encounter-card {
                    background: var(--cds-layer-01);
                    border: 1px solid var(--cds-border-subtle);
                    display: flex;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                .encounter-card:hover {
                    border-color: var(--clinicboard-accent);
                    background: var(--cds-layer-hover-01);
                }
                .card-indicator {
                    width: 3px;
                    background: var(--clinicboard-accent);
                    opacity: 0.7;
                }
                .card-content {
                    padding: 0.75rem 1rem;
                    flex: 1;
                }
                .card-date {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--cds-text-primary);
                    margin-bottom: 0.25rem;
                }
                .card-reason {
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: var(--cds-text-primary);
                    margin-bottom: 0.25rem;
                }
                .card-meta {
                    font-size: 0.6875rem;
                    color: var(--cds-text-secondary);
                    margin-bottom: 0.5rem;
                }
                .card-note-preview {
                    font-size: 0.75rem;
                    color: var(--cds-text-secondary);
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .empty-history {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: var(--cds-text-secondary);
                    font-size: 0.8125rem;
                    text-align: center;
                }
            `}</style>
        </div>
    );
}
