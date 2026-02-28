'use client';

import React from 'react';
import {
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Grid,
    Column,
    Tag,
    Breadcrumb,
    BreadcrumbItem,
    StructuredListWrapper,
    StructuredListHead,
    StructuredListRow,
    StructuredListCell,
    StructuredListBody,
} from '@carbon/react';
import {
    Edit,
    WarningAlt,
    User,
    Activity,
    Chemistry,
    Calendar,
    Information,
    Add,
} from '@carbon/icons-react';
import { useRouter } from 'next/navigation';
import { useTabStore } from '@/store/useTabStore';

interface PatientDetailViewProps {
    patient: any;
    conditions: any[];
    allergies: any[];
}

export default function PatientDetailView({ patient, conditions, allergies }: PatientDetailViewProps) {
    const router = useRouter();
    const { patientViewState, setPatientTab } = useTabStore();

    // Get initial index from store or default to 0
    const initialTabIndex = patientViewState[patient.id] || 0;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = dateString.includes('T') ? new Date(dateString) : new Date(`${dateString}T00:00:00`);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('es-VE');
    };

    const getGenderLabel = (gender: string) => {
        switch (gender) {
            case 'male': return 'Masculino';
            case 'female': return 'Femenino';
            case 'other': return 'Otro';
            case 'unknown': return 'Desconocido';
            default: return gender || 'N/A';
        }
    };

    return (
        <section aria-label="Detalle del Paciente">
            <div className="page-header">
                <Breadcrumb noTrailingSlash style={{ marginBottom: '1rem' }}>
                    <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
                    <BreadcrumbItem href="/patients">Pacientes</BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        {patient.name_family}, {patient.name_given?.[0]}
                    </BreadcrumbItem>
                </Breadcrumb>

                <div className="patient-header">
                    <div className="patient-avatar-wrapper">
                        <div className="patient-avatar">
                            <User size={32} />
                        </div>
                        <div>
                            <h1 className="page-header__title">
                                {patient.name_given?.join(' ')} {patient.name_family}
                            </h1>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <Tag type="blue" size="sm">{getGenderLabel(patient.gender)}</Tag>
                                <Tag type="warm-gray" size="sm">ID: {patient.identifiers?.[0]?.value || 'N/A'}</Tag>
                                {patient.active && <Tag type="green" size="sm">Activo</Tag>}
                            </div>
                        </div>
                    </div>
                    <Button
                        kind="ghost"
                        renderIcon={Edit}
                        onClick={() => router.push(`/patients/${patient.id}/edit`)}
                    >
                        Editar Perfil
                    </Button>
                </div>
            </div>

            <div className="patient-content-wrapper">
                <Tabs
                    selectedIndex={initialTabIndex}
                    onChange={({ selectedIndex }) => setPatientTab(patient.id, selectedIndex)}
                >
                    <TabList aria-label="Información detallada" contained>
                        <Tab renderIcon={Information}>Información General</Tab>
                        <Tab renderIcon={Activity}>Condiciones ({conditions.length})</Tab>
                        <Tab renderIcon={Chemistry}>Alergias ({allergies.length})</Tab>
                        <Tab renderIcon={Calendar}>Citas</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <Grid className="patient-tab-content">
                                <Column lg={10} md={8} sm={4}>
                                    <div className="patient-info-section">
                                        <h3 className="patient-info-section__title">Datos Personales</h3>
                                        <StructuredListWrapper isFlush>
                                            <StructuredListBody>
                                                <StructuredListRow>
                                                    <StructuredListCell noWrap><strong>Nombre completo</strong></StructuredListCell>
                                                    <StructuredListCell>{patient.name_given?.join(' ')} {patient.name_family}</StructuredListCell>
                                                </StructuredListRow>
                                                <StructuredListRow>
                                                    <StructuredListCell noWrap><strong>Fecha de nacimiento</strong></StructuredListCell>
                                                    <StructuredListCell>{formatDate(patient.birth_date)}</StructuredListCell>
                                                </StructuredListRow>
                                                <StructuredListRow>
                                                    <StructuredListCell noWrap><strong>Género</strong></StructuredListCell>
                                                    <StructuredListCell>{getGenderLabel(patient.gender)}</StructuredListCell>
                                                </StructuredListRow>
                                            </StructuredListBody>
                                        </StructuredListWrapper>
                                    </div>

                                    <div className="patient-info-section" style={{ marginTop: '2rem' }}>
                                        <h3 className="patient-info-section__title">Contacto y Ubicación</h3>
                                        <StructuredListWrapper isFlush>
                                            <StructuredListBody>
                                                <StructuredListRow>
                                                    <StructuredListCell noWrap><strong>Teléfono principal</strong></StructuredListCell>
                                                    <StructuredListCell>{patient.telecom?.find((t: any) => t.system === 'phone')?.value || 'N/A'}</StructuredListCell>
                                                </StructuredListRow>
                                                <StructuredListRow>
                                                    <StructuredListCell noWrap><strong>Correo electrónico</strong></StructuredListCell>
                                                    <StructuredListCell>{patient.telecom?.find((t: any) => t.system === 'email')?.value || 'N/A'}</StructuredListCell>
                                                </StructuredListRow>
                                                <StructuredListRow>
                                                    <StructuredListCell noWrap><strong>Dirección de habitación</strong></StructuredListCell>
                                                    <StructuredListCell>{patient.address?.[0]?.text || 'No registrada'}</StructuredListCell>
                                                </StructuredListRow>
                                            </StructuredListBody>
                                        </StructuredListWrapper>
                                    </div>
                                </Column>
                                <Column lg={6} md={8} sm={4}>
                                    <div className="clinical-summary-card">
                                        <h3 className="patient-info-section__title">Resumen Clínico</h3>
                                        <p className="page-header__subtitle" style={{ fontSize: '0.875rem' }}>
                                            Última consulta: 26 Feb 2026<br />
                                            Próxima cita: Sin citas programadas
                                        </p>
                                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <Button
                                                kind="primary"
                                                size="md"
                                                style={{ width: '100%' }}
                                                renderIcon={Add}
                                                onClick={() => router.push(`/history?patientId=${patient.id}`)}
                                            >
                                                Nueva Evolución
                                            </Button>
                                            <Button kind="tertiary" size="md" style={{ width: '100%' }}>
                                                Ver Historial Completo
                                            </Button>
                                        </div>
                                    </div>
                                </Column>
                            </Grid>
                        </TabPanel>

                        <TabPanel>
                            {conditions.length === 0 ? (
                                <div className="empty-state">
                                    <p className="page-header__subtitle">No se encontraron condiciones clínicas registradas para este paciente.</p>
                                </div>
                            ) : (
                                <div className="conditions-list">
                                    {conditions.map((condition) => (
                                        <div key={condition.id} className="condition-item">
                                            <WarningAlt
                                                size={20}
                                                style={{ color: condition.clinical_status === 'active' ? 'var(--cds-support-error)' : 'var(--cds-text-secondary)' }}
                                            />
                                            <div className="condition-item__content">
                                                <h4 className="condition-item__title">{condition.code_text}</h4>
                                                <p className="condition-item__subtitle">
                                                    Estado: {condition.clinical_status} • Registrado el {formatDate(condition.recorded_date)}
                                                </p>
                                            </div>
                                            <Tag size="sm" type={condition.clinical_status === 'active' ? 'red' : 'gray'}>
                                                {condition.clinical_status}
                                            </Tag>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabPanel>

                        <TabPanel>
                            {allergies.length === 0 ? (
                                <div className="empty-state">
                                    <p className="page-header__subtitle">No se han registrado alergias o intolerancias.</p>
                                </div>
                            ) : (
                                <div className="allergies-list">
                                    {allergies.map((allergy) => (
                                        <div key={allergy.id} className="condition-item">
                                            <div className={`allergy-dot allergy-dot--${allergy.criticality || 'low'}`} />
                                            <div className="condition-item__content">
                                                <h4 className="condition-item__title">{allergy.code_text}</h4>
                                                <p className="condition-item__subtitle">
                                                    Criticidad: {allergy.criticality || 'No especificada'} • Reacción: {allergy.reaction_text || 'No documentada'}
                                                </p>
                                            </div>
                                            {allergy.criticality === 'high' && <Tag type="red" size="sm">Alta Prioridad</Tag>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabPanel>

                        <TabPanel>
                            <div className="empty-state">
                                <Calendar size={32} style={{ marginBottom: '1rem', color: 'var(--cds-text-secondary)' }} />
                                <h3 className="patient-info-section__title">Agenda de Citas</h3>
                                <p className="page-header__subtitle">El historial de citas y programación estará disponible en la siguiente fase de integración.</p>
                            </div>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </div>

            <style jsx>{`
                .patient-content-wrapper {
                    background-color: var(--cds-background);
                }
                .patient-tab-content {
                    padding: 2rem 0;
                }
                .empty-state {
                    padding: 4rem 2rem;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .conditions-list, .allergies-list {
                    padding: 1rem 0;
                }
            `}</style>
        </section>
    );
}
