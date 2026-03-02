'use client';

import React, { useState, useEffect } from 'react';
import {
    Button,
    Tag,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    StructuredListWrapper,
    StructuredListRow,
    StructuredListCell,
    StructuredListBody,
    DataTable,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell,
    TableContainer,
    Loading,
    Form,
    FormGroup,
    TextInput,
} from '@carbon/react';
import {
    Edit,
    User,
    Stethoscope,
    Add,
    Phone,
    Email,
    Location,
    Identification,
    Activity,
    Chemistry,
    Calendar,
    WarningAlt,
    CheckmarkFilled,
    Information,
} from '@carbon/icons-react';
import { useRouter } from 'next/navigation';
import { getEncounters, getPatientClinicalData } from '@/actions/patients';

interface PatientDetailViewProps {
    patient: any;
    conditions: any[];
    allergies: any[];
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDate(dateString: string | null): string {
    if (!dateString) return '—';
    const date = dateString.includes('T')
        ? new Date(dateString)
        : new Date(`${dateString}T00:00:00`);
    return isNaN(date.getTime())
        ? '—'
        : date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcAge(birthDate: string | null): string {
    if (!birthDate) return '';
    const diff = Date.now() - new Date(birthDate).getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return `${age} años`;
}

function getGenderLabel(gender: string): string {
    const map: Record<string, string> = {
        male: 'Masculino', female: 'Femenino', other: 'Otro', unknown: 'Desconocido',
    };
    return map[gender] || gender || '—';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WorkspaceHeader({ patient, router, children }: { patient: any; router: any; children?: React.ReactNode }) {
    const phone = patient.telecom?.find((t: any) => t.system === 'phone')?.value;
    const email = patient.telecom?.find((t: any) => t.system === 'email')?.value;
    const address = patient.address?.[0]?.text;

    return (
        <header className="pw-workspace-header pw-workspace-header--expanded" role="banner">
            <div className="pw-workspace-header__top">
                <div className="pw-workspace-header__left" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="pd-avatar pd-avatar--large" aria-hidden="true">
                        <User size={32} />
                    </div>
                    <div className="pw-workspace-header__info pw-workspace-header__title-block">
                        <h1 className="pw-workspace-header__title" style={{ fontSize: '1.5rem' }}>
                            {patient.name_given?.join(' ')} {patient.name_family}
                        </h1>
                        <div className="pw-workspace-header__subtitle" role="text" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '4px' }}>
                            <Tag type={patient.active ? 'green' : 'gray'} size="sm" aria-label={`Estado: ${patient.active ? 'Activo' : 'Inactivo'}`}>
                                {patient.active ? 'Activo' : 'Inactivo'}
                            </Tag>

                            <div className="pd-header-meta-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="pd-header-meta">
                                    <strong>Edad:</strong> {calcAge(patient.birth_date)}
                                </span>
                                <span className="pd-header-meta-divider" aria-hidden="true">•</span>
                                <span className="pd-header-meta">
                                    <strong>Género:</strong> {getGenderLabel(patient.gender)}
                                </span>
                            </div>

                            {patient.identifiers?.[0]?.value && (
                                <>
                                    <span className="pd-header-meta-divider pd-header-meta-divider--strong" aria-hidden="true">|</span>
                                    <span className="pd-header-meta pd-header-meta--mono">
                                        <Identification size={14} aria-hidden="true" />
                                        {patient.identifiers[0].value}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="pw-workspace-header__actions">
                    <Button
                        kind="ghost"
                        size="md"
                        renderIcon={Edit}
                        onClick={() => router.push(`/patients/${patient.id}/edit`)}
                        aria-label="Editar perfil del paciente"
                    >
                        Editar Perfil
                    </Button>
                    <Button
                        kind="primary"
                        size="md"
                        renderIcon={Stethoscope}
                        onClick={() => router.push(`/history?patientId=${patient.id}`)}
                        aria-label="Iniciar nueva evolución clínica"
                    >
                        Nueva Evolución
                    </Button>
                </div>
            </div>

            <div className="pw-workspace-header__middle">
                <div className="pd-summary-grid">
                    <div className="pd-summary-item">
                        <span className="pd-summary-label">Contacto</span>
                        <div className="pd-summary-value">
                            {phone && <span title="Teléfono"><Phone size={14} /> {phone}</span>}
                            {email && <span title="Email" style={{ marginLeft: '1rem' }}><Email size={14} /> {email}</span>}
                            {!phone && !email && <span className="pd-text-muted">No registrado</span>}
                        </div>
                    </div>
                    <div className="pd-summary-item">
                        <span className="pd-summary-label">Residencia</span>
                        <div className="pd-summary-value">
                            {address || <span className="pd-text-muted">Sin dirección registrada</span>}
                        </div>
                    </div>
                    <div className="pd-summary-item">
                        <span className="pd-summary-label">Notas rápidas</span>
                        <div className="pd-summary-value pd-text-muted">
                            Paciente requiere atención especial en toma de muestras...
                        </div>
                    </div>
                </div>
            </div>

            <div className="pw-workspace-header__bottom">
                {children}
            </div>
        </header>
    );
}

function EmptyState({ icon: Icon, title, message }: { icon?: React.ElementType; title: string; message: string }) {
    return (
        <div className="pw-empty-state" role="status">
            {Icon && <Icon size={32} className="pw-empty-state__icon" aria-hidden="true" />}
            <h4 className="pw-empty-state__title">{title}</h4>
            <p className="pw-empty-state__text">{message}</p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientDetailView({ patient, conditions: initialConditions, allergies: initialAllergies }: PatientDetailViewProps) {
    const router = useRouter();
    const [encounters, setEncounters] = useState<any[]>([]);
    const [loadingEncounters, setLoadingEncounters] = useState(false);

    useEffect(() => {
        const fetchEncounters = async () => {
            setLoadingEncounters(true);
            const { data } = await getEncounters(patient.id);
            setEncounters(data || []);
            setLoadingEncounters(false);
        };
        fetchEncounters();
    }, [patient.id]);

    const phone = patient.telecom?.find((t: any) => t.system === 'phone')?.value;
    const email = patient.telecom?.find((t: any) => t.system === 'email')?.value;
    const address = patient.address?.[0]?.text;

    return (
        <div className="pw-root" role="main">
            <Tabs aria-label="Navegación de detalles del paciente">
                <WorkspaceHeader patient={patient} router={router}>
                    <TabList aria-label="Secciones de información" className="pw-tab-list">
                        <Tab renderIcon={User}>Resumen</Tab>
                        <Tab renderIcon={Stethoscope}>Condiciones</Tab>
                        <Tab renderIcon={WarningAlt}>Alergias</Tab>
                        <Tab renderIcon={Calendar}>Consultas</Tab>
                        <Tab renderIcon={Activity}>Signos Vitales</Tab>
                    </TabList>
                </WorkspaceHeader>

                <TabPanels>
                    {/* ── PANEL: RESUMEN ────────────────────────────────── */}
                    <TabPanel className="pw-tab-content">
                        <div style={{ maxWidth: '800px' }}>
                            <Form aria-label="Información del paciente">
                                <FormGroup legendText="Información General">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <TextInput
                                            id="patient-name"
                                            labelText="Nombre Completo"
                                            value={`${patient.name_given?.join(' ')} ${patient.name_family}`}
                                            readOnly
                                        />
                                        <TextInput
                                            id="patient-id"
                                            labelText="Cédula / ID"
                                            value={patient.identifiers?.[0]?.value || '—'}
                                            readOnly
                                        />
                                        <TextInput
                                            id="patient-dob"
                                            labelText="Fecha de Nacimiento"
                                            value={`${formatDate(patient.birth_date)} (${calcAge(patient.birth_date)})`}
                                            readOnly
                                        />
                                        <TextInput
                                            id="patient-gender"
                                            labelText="Género"
                                            value={getGenderLabel(patient.gender)}
                                            readOnly
                                        />
                                    </div>
                                </FormGroup>

                                <FormGroup legendText="Contacto y Ubicación">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <TextInput
                                            id="patient-phone"
                                            labelText="Teléfono"
                                            value={phone || '—'}
                                            readOnly
                                        />
                                        <TextInput
                                            id="patient-email"
                                            labelText="Correo Electrónico"
                                            value={email || '—'}
                                            readOnly
                                        />
                                        <TextInput
                                            id="patient-address"
                                            labelText="Dirección"
                                            value={address || '—'}
                                            style={{ gridColumn: '1 / span 2' }}
                                            readOnly
                                        />
                                    </div>
                                </FormGroup>
                            </Form>
                        </div>
                    </TabPanel>

                    {/* ── PANEL: CONDICIONES ───────────────────────────── */}
                    <TabPanel className="pw-tab-content">
                        <div className="pd-tab-header">
                            <h3>Condiciones Clínicas</h3>
                            <Button kind="ghost" size="sm" renderIcon={Add}>Agregar Condición</Button>
                        </div>
                        {initialConditions.length === 0 ? (
                            <EmptyState
                                icon={Activity}
                                title="No hay condiciones clínicas"
                                message="El paciente no tiene diagnósticos o condiciones registradas."
                            />
                        ) : (
                            <div className="pd-list-container">
                                {initialConditions.map((c: any) => (
                                    <div key={c.id} className="pd-list-item">
                                        <div className="pd-list-item__icon pd-list-item__icon--teal">
                                            <Activity size={16} />
                                        </div>
                                        <div className="pd-list-item__content">
                                            <span className="pd-list-item__title">{c.code_text}</span>
                                            <span className="pd-list-item__subtitle">Registrado: {formatDate(c.recorded_date)}</span>
                                        </div>
                                        <Tag type={c.clinical_status === 'active' ? 'red' : 'green'} size="sm">
                                            {c.clinical_status === 'active' ? 'Activa' : 'Resuelta'}
                                        </Tag>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabPanel>

                    {/* ── PANEL: ALERGIAS ──────────────────────────────── */}
                    <TabPanel className="pw-tab-content">
                        <div className="pd-tab-header">
                            <h3>Alergias e Intolerancias</h3>
                            <Button kind="ghost" size="sm" renderIcon={Add}>Agregar Alergia</Button>
                        </div>
                        {initialAllergies.length === 0 ? (
                            <EmptyState
                                icon={Chemistry}
                                title="Sin alergias registradas"
                                message="No se han reportado alergias o intolerancias para este paciente."
                            />
                        ) : (
                            <div className="pd-list-container">
                                {initialAllergies.map((a: any) => (
                                    <div key={a.id} className="pd-list-item">
                                        <div className="pd-list-item__icon pd-list-item__icon--red">
                                            <Chemistry size={16} />
                                        </div>
                                        <div className="pd-list-item__content">
                                            <span className="pd-list-item__title">{a.code_text}</span>
                                            <span className="pd-list-item__subtitle">{a.reaction_text || 'Reacción no especificada'}</span>
                                        </div>
                                        <Tag type={a.criticality === 'high' ? 'red' : 'warm-gray'} size="sm">
                                            {a.criticality === 'high' ? 'Alta' : 'Normal'}
                                        </Tag>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabPanel>

                    {/* ── PANEL: CONSULTAS ────────────────────────────── */}
                    <TabPanel className="pw-tab-content">
                        <div className="pd-tab-header">
                            <h3>Historial de Consultas</h3>
                            <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={Add}
                                onClick={() => router.push(`/history?patientId=${patient.id}`)}
                            >
                                Nueva Consulta
                            </Button>
                        </div>
                        {loadingEncounters ? (
                            <div className="pd-loading-overlay"><Loading withOverlay={false} /></div>
                        ) : encounters.length === 0 ? (
                            <EmptyState
                                icon={Calendar}
                                title="Sin consultas previas"
                                message="Este paciente aún no registra visitas o evoluciones clínicas."
                            />
                        ) : (
                            <div className="pd-encounters-timeline">
                                {encounters.map((e: any) => (
                                    <div
                                        key={e.id}
                                        className="pd-timeline-item"
                                        onClick={() => router.push(`/history?patientId=${patient.id}&encounterId=${e.id}`)}
                                    >
                                        <div className="pd-timeline-date">
                                            <span className="pd-timeline-day">{new Date(e.start_time).getDate()}</span>
                                            <span className="pd-timeline-month">
                                                {new Date(e.start_time).toLocaleDateString('es-VE', { month: 'short' }).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="pd-timeline-content">
                                            <div className="pd-timeline-header">
                                                <span className="pd-timeline-year">{new Date(e.start_time).getFullYear()}</span>
                                                <span className="pd-timeline-dot">•</span>
                                                <span className="pd-timeline-practitioner">Dr. {e.practitioner?.name_family}</span>
                                            </div>
                                            <p className="pd-timeline-note">
                                                {e.evolution_note ? (e.evolution_note.substring(0, 120) + (e.evolution_note.length > 120 ? '...' : '')) : 'Sin notas evolutivas.'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabPanel>

                    {/* ── PANEL: SIGNOS VITALES ───────────────────────── */}
                    <TabPanel className="pw-tab-content">
                        <div className="pd-tab-header">
                            <h3>Signos Vitales</h3>
                        </div>
                        <EmptyState
                            icon={Activity}
                            title="Próximamente"
                            message="Gráficas de evolución y tendencias de signos vitales estarán disponibles aquí."
                        />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>
    );
}
