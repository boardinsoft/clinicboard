'use client';

import React, { useState, useEffect } from 'react';
import {
    Button,
    Tag,
    Pagination,
    Tabs,
    Tab,
    TabList,
    TabPanels,
    TabPanel,
    SkeletonText,
    SkeletonPlaceholder,
} from '@carbon/react';
import {
    Add,
    UserAvatar,
    Warning,
    Stethoscope,
    Medication,
    Activity,
    Calendar,
    ArrowRight,
    UserFollow,
} from '@carbon/icons-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLayoutStore } from '@/store/useLayoutStore';
import { DetailCard } from '@/components/ui/DetailCard';
import { getPatientClinicalData, getEncounters } from '@/actions/patients';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PatientsListViewProps {
    patients: any[];
    totalItems: number;
    page: number;
    pageSize: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

function calcAge(birthDate: string | null | undefined): string {
    if (!birthDate) return '—';
    const diff = Date.now() - new Date(birthDate).getTime();
    return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} años`;
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function NoPatientSelected() {
    return (
        <div className="pw-empty-state" role="status" aria-label="Sin paciente seleccionado">
            <UserFollow size={32} className="pw-empty-state__icon" aria-hidden="true" />
            <p className="pw-empty-state__title">Ningún paciente seleccionado</p>
            <p className="pw-empty-state__hint">
                Selecciona un paciente del panel lateral o usa <kbd>⌘K</kbd> para buscar
            </p>
        </div>
    );
}

// ─── Tab: Resumen ──────────────────────────────────────────────────────────────
function TabResumen({ patient }: { patient: any }) {
    if (!patient) return <NoPatientSelected />;

    const fullName = `${patient.name_given?.join(' ')} ${patient.name_family}`;
    const phone = (patient.telecom as any[])?.find((t: any) => t.system === 'phone')?.value ?? '—';
    const email = (patient.telecom as any[])?.find((t: any) => t.system === 'email')?.value ?? '—';
    const address = (patient.address as any[])?.[0]?.text ?? '—';
    const docId = (patient.identifiers as any[])?.[0]?.value ?? '—';

    return (
        <div className="pw-tab-content">
            {/* Patient card */}
            <div className="pw-patient-card">
                <div className="pw-patient-card__avatar" aria-hidden="true">
                    <UserAvatar size={40} />
                </div>
                <div className="pw-patient-card__info">
                    <h2 className="pw-patient-card__name">{fullName}</h2>
                    <div className="pw-patient-card__meta">
                        <span>{calcAge(patient.birth_date)}</span>
                        <span className="pw-sep" aria-hidden="true">·</span>
                        <span>{patient.gender === 'female' ? 'Femenino' : patient.gender === 'male' ? 'Masculino' : '—'}</span>
                        <span className="pw-sep" aria-hidden="true">·</span>
                        <Tag type="blue" size="sm">CI: {docId}</Tag>
                        {patient.active
                            ? <Tag type="green" size="sm">Activo</Tag>
                            : <Tag type="warm-gray" size="sm">Inactivo</Tag>
                        }
                    </div>
                </div>
            </div>

            {/* Info grid */}
            <dl className="pw-info-grid">
                <div className="pw-info-cell">
                    <dt className="pw-info-cell__label">Fecha de nacimiento</dt>
                    <dd className="pw-info-cell__value">{formatDate(patient.birth_date)}</dd>
                </div>
                <div className="pw-info-cell">
                    <dt className="pw-info-cell__label">Teléfono</dt>
                    <dd className="pw-info-cell__value">{phone}</dd>
                </div>
                <div className="pw-info-cell">
                    <dt className="pw-info-cell__label">Correo electrónico</dt>
                    <dd className="pw-info-cell__value">{email}</dd>
                </div>
                <div className="pw-info-cell">
                    <dt className="pw-info-cell__label">Dirección</dt>
                    <dd className="pw-info-cell__value">{address}</dd>
                </div>
            </dl>
        </div>
    );
}

// ─── Tab: Condiciones ──────────────────────────────────────────────────────────
function TabCondiciones({ patientId }: { patientId: string | null }) {
    const [conditions, setConditions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!patientId) return;
        setLoading(true);
        getPatientClinicalData(patientId).then(data => {
            setConditions(data.conditions);
            setLoading(false);
        });
    }, [patientId]);

    if (!patientId) return <NoPatientSelected />;

    return (
        <div className="pw-tab-content">
            <div className="pw-section-header">
                <span className="pw-section-header__title">Condiciones activas</span>
                <span className="pw-section-header__count">{conditions.length}</span>
            </div>
            {loading ? (
                <div className="pw-skeleton-list">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="pw-skeleton-item">
                            <SkeletonText heading={false} lineCount={2} />
                        </div>
                    ))}
                </div>
            ) : conditions.length === 0 ? (
                <div className="pw-empty-state pw-empty-state--sm" role="status">
                    <Stethoscope size={24} aria-hidden="true" />
                    <p>Sin condiciones registradas</p>
                </div>
            ) : (
                <ul className="pw-condition-list" role="list">
                    {conditions.map((c: any) => (
                        <li key={c.id} className="pw-condition-item" role="listitem">
                            <div className="pw-condition-item__code">
                                <Tag type="teal" size="sm">{c.code || '—'}</Tag>
                            </div>
                            <div className="pw-condition-item__info">
                                <span className="pw-condition-item__text">{c.code_text || 'Sin descripción'}</span>
                                {c.onset_date && (
                                    <span className="pw-condition-item__date">
                                        Desde: {formatDate(c.onset_date)}
                                    </span>
                                )}
                            </div>
                            {c.clinical_status && (
                                <Tag
                                    type={c.clinical_status === 'active' ? 'green' : 'warm-gray'}
                                    size="sm"
                                >
                                    {c.clinical_status}
                                </Tag>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Tab: Alergias ─────────────────────────────────────────────────────────────
function TabAlergias({ patientId }: { patientId: string | null }) {
    const [allergies, setAllergies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!patientId) return;
        setLoading(true);
        getPatientClinicalData(patientId).then(data => {
            setAllergies(data.allergies);
            setLoading(false);
        });
    }, [patientId]);

    if (!patientId) return <NoPatientSelected />;

    return (
        <div className="pw-tab-content">
            <div className="pw-section-header pw-section-header--danger">
                <Warning size={16} aria-hidden="true" />
                <span className="pw-section-header__title">Alergias e intolerancias</span>
                <span className="pw-section-header__count">{allergies.length}</span>
            </div>
            {loading ? (
                <div className="pw-skeleton-list">
                    {[1, 2].map(i => (
                        <div key={i} className="pw-skeleton-item">
                            <SkeletonText heading={false} lineCount={2} />
                        </div>
                    ))}
                </div>
            ) : allergies.length === 0 ? (
                <div className="pw-empty-state pw-empty-state--sm" role="status">
                    <Warning size={24} aria-hidden="true" />
                    <p>Sin alergias registradas</p>
                </div>
            ) : (
                <ul className="pw-condition-list" role="list">
                    {allergies.map((a: any) => (
                        <li key={a.id} className="pw-condition-item pw-condition-item--allergy" role="listitem">
                            <div className="pw-condition-item__code">
                                <Tag type="red" size="sm">ALERGIA</Tag>
                            </div>
                            <div className="pw-condition-item__info">
                                <span className="pw-condition-item__text">{a.code_text || 'Sin descripción'}</span>
                                {a.criticality && (
                                    <span className="pw-condition-item__date">
                                        Criticidad: {a.criticality}
                                    </span>
                                )}
                            </div>
                            {a.category && (
                                <Tag type="warm-gray" size="sm">{a.category}</Tag>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Tab: Encuentros ───────────────────────────────────────────────────────────
function TabEncuentros({ patientId, router }: { patientId: string | null; router: ReturnType<typeof useRouter> }) {
    const [encounters, setEncounters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!patientId) return;
        setLoading(true);
        getEncounters(patientId).then(({ data }) => {
            setEncounters(data || []);
            setLoading(false);
        });
    }, [patientId]);

    if (!patientId) return <NoPatientSelected />;

    return (
        <div className="pw-tab-content">
            <div className="pw-section-header">
                <Activity size={16} aria-hidden="true" />
                <span className="pw-section-header__title">Historial de consultas</span>
                <span className="pw-section-header__count">{encounters.length}</span>
            </div>
            {loading ? (
                <div className="pw-skeleton-list">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="pw-skeleton-item">
                            <SkeletonText heading={false} lineCount={3} />
                        </div>
                    ))}
                </div>
            ) : encounters.length === 0 ? (
                <div className="pw-empty-state pw-empty-state--sm" role="status">
                    <Calendar size={24} aria-hidden="true" />
                    <p>Sin consultas registradas</p>
                </div>
            ) : (
                <ul className="pw-encounter-list" role="list">
                    {encounters.map((enc: any) => (
                        <li key={enc.id} className="pw-encounter-item" role="listitem">
                            <div className="pw-encounter-item__header">
                                <span className="pw-encounter-item__date">{formatDate(enc.start_time)}</span>
                                <Tag
                                    type={enc.status === 'finished' ? 'green' : 'blue'}
                                    size="sm"
                                >
                                    {enc.status === 'finished' ? 'Completada' : 'En curso'}
                                </Tag>
                            </div>
                            <p className="pw-encounter-item__reason">
                                {enc.reason_code?.[0]?.text || 'Consulta general'}
                            </p>
                            {enc.evolution_note && (
                                <p className="pw-encounter-item__preview">
                                    {enc.evolution_note.substring(0, 100)}…
                                </p>
                            )}
                            <button
                                className="pw-encounter-item__link"
                                onClick={() => router.push(`/history?patientId=${patientId}`)}
                                aria-label={`Abrir historia clínica del encuentro del ${formatDate(enc.start_time)}`}
                            >
                                Ver en Historia Clínica
                                <ArrowRight size={14} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PatientsListView({ patients, totalItems, page, pageSize }: PatientsListViewProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { setSecondaryPanel } = useLayoutStore();

    // Track selected patient for tab content
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

    // Keep side panel in sync
    useEffect(() => {
        setSecondaryPanel(
            <div style={{ padding: '0.5rem 0' }}>
                {patients.map((p: any) => (
                    <DetailCard
                        key={p.id}
                        title={`${p.name_family}, ${p.name_given?.join(' ')}`}
                        subtitle={(p.identifiers as any[])?.[0]?.value || 'Sin ID'}
                        meta={p.birth_date ? formatDate(p.birth_date) : '—'}
                        extra={
                            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                                {(p.telecom as any[])?.[0]?.value || 'Sin teléfono'}
                            </div>
                        }
                        tags={p.active ? ['Activo'] : ['Inactivo']}
                        icon={<UserAvatar size={20} style={{ fill: 'var(--cds-text-secondary)' }} />}
                        onClick={() => {
                            setSelectedPatient(p);
                            router.push(`/patients/${p.id}`);
                        }}
                        active={pathname === `/patients/${p.id}`}
                    />
                ))}
            </div>,
            'Pacientes'
        );
    }, [patients, pathname]);

    const updateParams = (updates: Record<string, string | number>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, String(value));
            else params.delete(key);
        });
        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePagination = ({ page: p, pageSize: ps }: { page: number; pageSize: number }) => {
        updateParams({ page: p, pageSize: ps });
    };

    return (
        <section aria-label="Área de trabajo — Pacientes" className="pw-root">

            {/* ── Workspace Header ──────────────────────────────────────── */}
            <header className="pw-workspace-header" role="banner">
                <div className="pw-workspace-header__top">
                    <div className="pw-workspace-header__title-block">
                        <h1 className="pw-workspace-header__title">Pacientes</h1>
                        <p className="pw-workspace-header__subtitle">
                            <strong>{totalItems}</strong> paciente{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Button
                        kind="primary"
                        renderIcon={Add}
                        onClick={() => router.push('/patients/new')}
                        aria-label="Registrar nuevo paciente"
                    >
                        Nuevo Paciente
                    </Button>
                </div>

                {/* ── Carbon Tabs ─ */}
                <Tabs aria-label="Secciones del paciente">
                    <TabList aria-label="Secciones" className="pw-tab-list">
                        <Tab renderIcon={UserAvatar}>Resumen</Tab>
                        <Tab renderIcon={Stethoscope}>Condiciones</Tab>
                        <Tab renderIcon={Warning}>Alergias</Tab>
                        <Tab renderIcon={Activity}>Encuentros</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <TabResumen patient={selectedPatient} />
                        </TabPanel>
                        <TabPanel>
                            <TabCondiciones patientId={selectedPatient?.id ?? null} />
                        </TabPanel>
                        <TabPanel>
                            <TabAlergias patientId={selectedPatient?.id ?? null} />
                        </TabPanel>
                        <TabPanel>
                            <TabEncuentros patientId={selectedPatient?.id ?? null} router={router} />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </header>

            {/* ── Pagination ────────────────────────────────────────────── */}
            {totalItems > pageSize && (
                <div className="pw-pagination-bar">
                    <Pagination
                        backwardText="Anterior"
                        forwardText="Siguiente"
                        itemsPerPageText="Por página:"
                        onChange={handlePagination}
                        page={page}
                        pageSize={pageSize}
                        pageSizes={[10, 25, 50]}
                        totalItems={totalItems}
                    />
                </div>
            )}
        </section>
    );
}
