'use client';

import React, { useState } from 'react';
import {
    Button,
    Tile,
    TextInput,
    TextArea,
    Select,
    SelectItem,
    NumberInput,
    ProgressIndicator,
    ProgressStep,
    Tag,
} from '@carbon/react';
import {
    ArrowRight,
    ArrowLeft,
    Save,
    Chat,
    Stethoscope,
    Activity,
    UserAvatar,
} from '@carbon/icons-react';

// Medical History - 3-step form following v0 prototype
export default function HistoryPage() {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        'Datos Sociodemográficos',
        'Antecedentes Médicos',
        'Nota de Evolución',
    ];

    return (
        <div style={{ padding: 0 }}>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="page-header__title">Historia Clínica</h1>
                        <p className="page-header__subtitle">
                            Registro FHIR R4 — Patient · Condition · Encounter
                        </p>
                    </div>
                    <Button kind="primary" renderIcon={Save}>
                        Guardar
                    </Button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1px', background: 'var(--cds-border-subtle)' }}>
                {/* Patient Selector Sidebar */}
                <div style={{ width: '280px', background: 'var(--cds-layer-01)', flexShrink: 0 }}>
                    <div style={{ padding: '1rem' }}>
                        <TextInput
                            id="patient-search"
                            labelText=""
                            placeholder="Buscar paciente..."
                            size="md"
                        />
                    </div>

                    {/* Patient list */}
                    {[
                        { name: 'María García', age: 41, lastVisit: 'Hoy' },
                        { name: 'Carlos López', age: 48, lastVisit: 'Hoy' },
                        { name: 'Ana Rodríguez', age: 33, lastVisit: 'Ayer' },
                        { name: 'Luis Martínez', age: 61, lastVisit: '24 Feb' },
                    ].map((patient, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.875rem 1rem',
                                cursor: 'pointer',
                                background: i === 0 ? 'var(--cds-layer-02)' : 'transparent',
                                borderLeft: i === 0 ? '3px solid var(--cds-interactive)' : '3px solid transparent',
                                borderBottom: '1px solid var(--cds-border-subtle)',
                                transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={(e) => { if (i !== 0) e.currentTarget.style.backgroundColor = 'var(--cds-layer-02)'; }}
                            onMouseLeave={(e) => { if (i !== 0) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <UserAvatar size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                            <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{patient.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                                    {patient.age} años · {patient.lastVisit}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Form Area */}
                <div style={{ flex: 1, background: 'var(--cds-background)' }}>
                    {/* Progress Steps */}
                    <div style={{ padding: '1.5rem 2rem', background: 'var(--cds-layer-01)', borderBottom: '1px solid var(--cds-border-subtle)' }}>
                        <ProgressIndicator currentIndex={currentStep} spaceEqually>
                            {steps.map((step, i) => (
                                <ProgressStep
                                    key={i}
                                    label={step}
                                    complete={i < currentStep}
                                    current={i === currentStep}
                                    onClick={() => setCurrentStep(i)}
                                />
                            ))}
                        </ProgressIndicator>
                    </div>

                    {/* Form Content */}
                    <div style={{ padding: '2rem', maxWidth: '800px' }}>
                        {currentStep === 0 && (
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 400, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <UserAvatar size={24} style={{ color: 'var(--cds-interactive)' }} />
                                    Datos Sociodemográficos
                                </h3>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)', marginBottom: '2rem' }}>
                                    FHIR R4 Patient Resource — Información demográfica e identificación
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <TextInput id="given-name" labelText="Nombres" placeholder="Ingrese nombres" defaultValue="María" />
                                    <TextInput id="family-name" labelText="Apellidos" placeholder="Ingrese apellidos" defaultValue="García López" />
                                    <Select id="gender" labelText="Género" defaultValue="female">
                                        <SelectItem value="" text="Seleccionar" />
                                        <SelectItem value="male" text="Masculino" />
                                        <SelectItem value="female" text="Femenino" />
                                        <SelectItem value="other" text="Otro" />
                                    </Select>
                                    <TextInput id="birth-date" labelText="Fecha de Nacimiento" type="date" defaultValue="1985-03-15" />
                                    <TextInput id="doc-type" labelText="Tipo de Documento" placeholder="Cédula" defaultValue="Cédula" />
                                    <TextInput id="doc-number" labelText="Número de Documento" placeholder="000-0000000-0" defaultValue="001-1234567-8" />
                                    <TextInput id="phone" labelText="Teléfono" placeholder="+1 809-000-0000" defaultValue="+1 809-555-0101" />
                                    <TextInput id="email" labelText="Correo Electrónico" placeholder="paciente@email.com" />
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <TextInput id="address" labelText="Dirección" placeholder="Calle, número, sector, ciudad" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 400, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Stethoscope size={24} style={{ color: 'var(--cds-interactive)' }} />
                                    Antecedentes Médicos
                                </h3>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)', marginBottom: '2rem' }}>
                                    FHIR R4 Condition & AllergyIntolerance Resources
                                </p>

                                {/* Current Conditions */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Condiciones Activas</span>
                                        <Button kind="ghost" size="sm">+ Agregar Condición</Button>
                                    </div>
                                    {[
                                        { name: 'Hipertensión Arterial', code: 'I10', onset: '2020-06', status: 'active' },
                                        { name: 'Diabetes Mellitus Tipo 2', code: 'E11', onset: '2022-01', status: 'active' },
                                    ].map((condition, i) => (
                                        <Tile key={i} style={{ background: 'var(--cds-layer-01)', padding: '1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{condition.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>ICD-10: {condition.code} · Desde {condition.onset}</div>
                                            </div>
                                            <Tag type="green" size="sm">Activa</Tag>
                                        </Tile>
                                    ))}
                                </div>

                                {/* Allergies */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Alergias</span>
                                        <Button kind="ghost" size="sm">+ Agregar Alergia</Button>
                                    </div>
                                    {[
                                        { name: 'Penicilina', category: 'Medicamento', severity: 'Alta' },
                                    ].map((allergy, i) => (
                                        <Tile key={i} style={{ background: 'var(--cds-layer-01)', padding: '1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{allergy.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{allergy.category}</div>
                                            </div>
                                            <Tag type="red" size="sm">Severidad: {allergy.severity}</Tag>
                                        </Tile>
                                    ))}
                                </div>

                                {/* Family History */}
                                <TextArea
                                    id="family-history"
                                    labelText="Antecedentes Familiares"
                                    placeholder="Ingrese antecedentes familiares relevantes..."
                                    rows={3}
                                />
                                <div style={{ marginTop: '1rem' }}>
                                    <TextArea
                                        id="surgical-history"
                                        labelText="Antecedentes Quirúrgicos"
                                        placeholder="Ingrese antecedentes quirúrgicos..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 400, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={24} style={{ color: 'var(--cds-interactive)' }} />
                                    Nota de Evolución
                                </h3>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)', marginBottom: '2rem' }}>
                                    FHIR R4 Encounter Resource — Registro de consulta con signos vitales
                                </p>

                                {/* Vital Signs Grid */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <span style={{ fontWeight: 500, fontSize: '0.875rem', display: 'block', marginBottom: '1rem' }}>Signos Vitales</span>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                        <NumberInput id="bp-systolic" label="PA Sistólica" min={60} max={250} value={120} step={1} hideSteppers size="md" />
                                        <NumberInput id="bp-diastolic" label="PA Diastólica" min={40} max={160} value={80} step={1} hideSteppers size="md" />
                                        <NumberInput id="heart-rate" label="FC (lpm)" min={30} max={250} value={72} step={1} hideSteppers size="md" />
                                        <NumberInput id="temperature" label="Temp (°C)" min={34} max={43} value={36.5} step={0.1} hideSteppers size="md" />
                                        <NumberInput id="resp-rate" label="FR (rpm)" min={8} max={60} value={18} step={1} hideSteppers size="md" />
                                        <NumberInput id="spo2" label="SpO₂ (%)" min={60} max={100} value={98} step={1} hideSteppers size="md" />
                                        <NumberInput id="weight" label="Peso (kg)" min={1} max={400} value={68} step={0.1} hideSteppers size="md" />
                                        <NumberInput id="height" label="Talla (cm)" min={30} max={250} value={165} step={1} hideSteppers size="md" />
                                    </div>
                                </div>

                                {/* Evolution Note */}
                                <TextArea
                                    id="evolution-note"
                                    labelText="Nota de Evolución"
                                    placeholder="Describa la evolución del paciente, hallazgos relevantes, plan terapéutico..."
                                    rows={6}
                                />

                                {/* AI Scribe Card */}
                                <div className="ai-card" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <Chat size={16} style={{ color: 'var(--clinicboard-accent)' }} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clinicboard-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            AI Scribe
                                        </span>
                                        <Tag type="purple" size="sm" style={{ marginLeft: 'auto' }}>Beta</Tag>
                                    </div>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                                        Activa el AI Scribe para transcribir automáticamente la sesión de consulta y generar una nota de evolución estructurada basada en FHIR.
                                    </p>
                                    <Button kind="tertiary" size="sm" style={{ marginTop: '1rem' }} renderIcon={Chat}>
                                        Iniciar Transcripción
                                    </Button>
                                </div>

                                {/* Diagnosis */}
                                <div style={{ marginTop: '1.5rem' }}>
                                    <TextInput
                                        id="diagnosis"
                                        labelText="Diagnóstico (CIE-10)"
                                        placeholder="Buscar diagnóstico por nombre o código..."
                                    />
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <TextArea
                                        id="plan"
                                        labelText="Plan Terapéutico"
                                        placeholder="Indique el plan de tratamiento, indicaciones y seguimiento..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--cds-border-subtle)' }}>
                            <Button
                                kind="secondary"
                                renderIcon={ArrowLeft}
                                disabled={currentStep === 0}
                                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            >
                                Anterior
                            </Button>
                            {currentStep < steps.length - 1 ? (
                                <Button
                                    kind="primary"
                                    renderIcon={ArrowRight}
                                    onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                                >
                                    Siguiente
                                </Button>
                            ) : (
                                <Button kind="primary" renderIcon={Save}>
                                    Guardar Historia
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
