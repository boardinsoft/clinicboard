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
} from '@carbon/react';
import {
    Edit,
    WarningAlt,
    User,
    Activity,
    Chemistry,
    Calendar,
    Information
} from '@carbon/icons-react';
import { useRouter } from 'next/navigation';

interface PatientDetailViewProps {
    patient: any;
    conditions: any[];
    allergies: any[];
}

export default function PatientDetailView({ patient, conditions, allergies }: PatientDetailViewProps) {
    const router = useRouter();

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
                <Tabs>
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
                                        <div className="patient-data-grid">
                                            <div className="patient-data-item">
                                                <span className="patient-data-item__label">Nombre completo</span>
                                                <span className="patient-data-item__value">{patient.name_given?.join(' ')} {patient.name_family}</span>
                                            </div>
                                            <div className="patient-data-item">
                                                <span className="patient-data-item__label">Fecha de nacimiento</span>
                                                <span className="patient-data-item__value">{formatDate(patient.birth_date)}</span>
                                            </div>
                                            <div className="patient-data-item">
                                                <span className="patient-data-item__label">Género</span>
                                                <span className="patient-data-item__value">{getGenderLabel(patient.gender)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="patient-info-section">
                                        <h3 className="patient-info-section__title">Contacto y Ubicación</h3>
                                        <div className="patient-data-grid">
                                            <div className="patient-data-item">
                                                <span className="patient-data-item__label">Teléfono principal</span>
                                                <span className="patient-data-item__value">{patient.telecom?.find((t: any) => t.system === 'phone')?.value || 'N/A'}</span>
                                            </div>
                                            <div className="patient-data-item">
                                                <span className="patient-data-item__label">Correo electrónico</span>
                                                <span className="patient-data-item__value">{patient.telecom?.find((t: any) => t.system === 'email')?.value || 'N/A'}</span>
                                            </div>
                                            <div className="patient-data-item">
                                                <span className="patient-data-item__label">Dirección de habitación</span>
                                                <span className="patient-data-item__value">{patient.address?.[0]?.text || 'No registrada'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Column>
                                <Column lg={6} md={8} sm={4}>
                                    <div className="clinical-summary-card">
                                        <h3 className="patient-info-section__title">Resumen Clínico</h3>
                                        <p className="page-header__subtitle">
                                            Última consulta: 26 Feb 2026<br />
                                            Próxima cita: Sin citas programadas
                                        </p>
                                        <div style={{ marginTop: '1.5rem' }}>
                                            <Button kind="tertiary" size="sm" style={{ width: '100%' }}>
                                                Nueva Evolución
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
