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
} from '@carbon/react';
import { Edit, WarningAlt, CheckmarkFilled, User } from '@carbon/icons-react';
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
        // Use T00:00:00 to avoid timezone shifts when parsing YYYY-MM-DD
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
        <div className="patient-detail-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: '#e0e0e0',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <User size={32} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0 }}>
                            {patient.name_given?.join(' ')} {patient.name_family}
                        </h1>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <Tag type="blue">{getGenderLabel(patient.gender)}</Tag>
                            <Tag type="warm-gray">{formatDate(patient.birth_date)}</Tag>
                        </div>
                    </div>
                </div>
                <Button
                    kind="ghost"
                    renderIcon={Edit}
                    onClick={() => router.push(`/patients/${patient.id}/edit`)}
                >
                    Editar
                </Button>
            </div>

            <Tabs>
                <TabList aria-label="Información del paciente">
                    <Tab>Perfil General</Tab>
                    <Tab>Condiciones ({conditions.length})</Tab>
                    <Tab>Alergias ({allergies.length})</Tab>
                    <Tab>Citas</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <Grid style={{ padding: '1rem 0' }}>
                            <Column lg={8} md={8} sm={4}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3>Información Personal</h3>
                                    <p><strong>Cédula / ID:</strong> {patient.identifiers?.[0]?.value || 'N/A'}</p>
                                    <p><strong>Fecha de Nacimiento:</strong> {formatDate(patient.birth_date)}</p>
                                    <p><strong>Género:</strong> {getGenderLabel(patient.gender)}</p>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3>Contacto</h3>
                                    <p><strong>Teléfono:</strong> {patient.telecom?.find((t: any) => t.system === 'phone')?.value || 'N/A'}</p>
                                    <p><strong>Correo:</strong> {patient.telecom?.find((t: any) => t.system === 'email')?.value || 'N/A'}</p>
                                    <p><strong>Dirección:</strong> {patient.address?.[0]?.text || 'N/A'}</p>
                                </div>
                            </Column>
                            <Column lg={8} md={8} sm={4}>
                                <div style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '4px' }}>
                                    <h3>Resumen Clínico</h3>
                                    <p>Próximamente: Integración con historial de encuentros.</p>
                                </div>
                            </Column>
                        </Grid>
                    </TabPanel>
                    <TabPanel>
                        {conditions.length === 0 ? (
                            <p style={{ padding: '2rem 0' }}>No se encontraron condiciones registradas.</p>
                        ) : (
                            <div style={{ padding: '1rem 0' }}>
                                {conditions.map((condition) => (
                                    <div key={condition.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                                        <WarningAlt style={{ color: condition.clinical_status === 'active' ? '#da1e28' : '#6f6f6f' }} />
                                        <div>
                                            <h4 style={{ margin: 0 }}>{condition.code_text}</h4>
                                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6f6f6f' }}>
                                                Estado: {condition.clinical_status} | Desde: {formatDate(condition.recorded_date)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabPanel>
                    <TabPanel>
                        {allergies.length === 0 ? (
                            <p style={{ padding: '2rem 0' }}>No se encontraron alergias registradas.</p>
                        ) : (
                            <div style={{ padding: '1rem 0' }}>
                                {allergies.map((allergy) => (
                                    <div key={allergy.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: allergy.criticality === 'high' ? '#da1e28' : '#f1c21b' }} />
                                        <div>
                                            <h4 style={{ margin: 0 }}>{allergy.code_text}</h4>
                                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6f6f6f' }}>
                                                Severidad: {allergy.criticality || 'Normal'} | Reacción: {allergy.reaction_text || 'Desconocida'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabPanel>
                    <TabPanel>
                        <p style={{ padding: '2rem 0' }}>Módulo de citas en desarrollo.</p>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>
    );
}
