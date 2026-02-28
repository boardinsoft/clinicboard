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
    Tag,
} from '@carbon/react';
import {
    Add,
    TrashCan,
    Printer,
    DocumentPdf,
    Medication,
    UserAvatar,
} from '@carbon/icons-react';

interface PrescriptionItem {
    id: string;
    medication: string;
    dose: string;
    frequency: string;
    duration: string;
    route: string;
    instructions: string;
}

export default function PrescriptionsPage() {
    const [items, setItems] = useState<PrescriptionItem[]>([
        {
            id: '1',
            medication: 'Losartán',
            dose: '50mg',
            frequency: 'Cada 12 horas',
            duration: '30 días',
            route: 'Oral',
            instructions: 'Tomar en ayunas',
        },
        {
            id: '2',
            medication: 'Metformina',
            dose: '850mg',
            frequency: 'Cada 8 horas',
            duration: '30 días',
            route: 'Oral',
            instructions: 'Tomar con alimentos',
        },
    ]);

    const addItem = () => {
        setItems([
            ...items,
            {
                id: String(Date.now()),
                medication: '',
                dose: '',
                frequency: '',
                duration: '',
                route: 'Oral',
                instructions: '',
            },
        ]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    return (
        <div style={{ padding: 0 }}>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="page-header__title">Recetas</h1>
                        <p className="page-header__subtitle">
                            Diseñador de prescripciones — FHIR R4 MedicationRequest Resource
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button kind="secondary" renderIcon={Printer}>
                            Imprimir
                        </Button>
                        <Button kind="primary" renderIcon={DocumentPdf}>
                            Generar PDF
                        </Button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1px', background: 'var(--cds-border-subtle)' }}>
                {/* Prescription Form */}
                <div style={{ flex: 1, background: 'var(--cds-background)' }}>
                    {/* Patient Info Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', background: 'var(--cds-layer-01)', borderBottom: '1px solid var(--cds-border-subtle)' }}>
                        <UserAvatar size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                        <div>
                            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>María García López</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginLeft: '1rem' }}>
                                Cédula: 001-1234567-8 · 41 años
                            </span>
                        </div>
                        <Button kind="ghost" size="sm" style={{ marginLeft: 'auto' }}>Cambiar paciente</Button>
                    </div>

                    {/* Medications List */}
                    <div style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Medication size={20} style={{ color: 'var(--cds-interactive)' }} />
                                <span style={{ fontWeight: 500 }}>Medicamentos</span>
                                <Tag type="blue" size="sm">{items.length}</Tag>
                            </div>
                            <Button kind="tertiary" size="sm" renderIcon={Add} onClick={addItem}>
                                Agregar Medicamento
                            </Button>
                        </div>

                        {items.map((item, index) => (
                            <Tile
                                key={item.id}
                                style={{
                                    background: 'var(--cds-layer-01)',
                                    padding: '1.5rem',
                                    marginBottom: '1px',
                                    borderLeft: '3px solid var(--cds-interactive)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Medicamento #{index + 1}
                                    </span>
                                    <Button
                                        kind="danger--ghost"
                                        size="sm"
                                        hasIconOnly
                                        renderIcon={TrashCan}
                                        iconDescription="Eliminar"
                                        onClick={() => removeItem(item.id)}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <TextInput
                                        id={`med-${item.id}`}
                                        labelText="Medicamento"
                                        placeholder="Nombre del medicamento"
                                        defaultValue={item.medication}
                                    />
                                    <TextInput
                                        id={`dose-${item.id}`}
                                        labelText="Dosis"
                                        placeholder="Ej: 500mg"
                                        defaultValue={item.dose}
                                    />
                                    <Select id={`route-${item.id}`} labelText="Vía" defaultValue={item.route}>
                                        <SelectItem value="Oral" text="Oral" />
                                        <SelectItem value="IV" text="Intravenosa" />
                                        <SelectItem value="IM" text="Intramuscular" />
                                        <SelectItem value="SC" text="Subcutánea" />
                                        <SelectItem value="Tópica" text="Tópica" />
                                        <SelectItem value="Inhalada" text="Inhalada" />
                                    </Select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <TextInput
                                        id={`freq-${item.id}`}
                                        labelText="Frecuencia"
                                        placeholder="Ej: Cada 8 horas"
                                        defaultValue={item.frequency}
                                    />
                                    <TextInput
                                        id={`dur-${item.id}`}
                                        labelText="Duración"
                                        placeholder="Ej: 7 días"
                                        defaultValue={item.duration}
                                    />
                                </div>

                                <TextInput
                                    id={`inst-${item.id}`}
                                    labelText="Indicaciones Especiales"
                                    placeholder="Ej: Tomar con alimentos, evitar alcohol..."
                                    defaultValue={item.instructions}
                                />
                            </Tile>
                        ))}

                        {/* Notes */}
                        <div style={{ marginTop: '2rem' }}>
                            <TextArea
                                id="rx-notes"
                                labelText="Notas Adicionales"
                                placeholder="Indicaciones generales, dieta, reposo, próxima cita..."
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div style={{ width: '380px', background: 'var(--cds-layer-01)', flexShrink: 0, padding: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '1rem' }}>
                        Vista Previa
                    </span>

                    {/* Prescription Preview */}
                    <div style={{ background: '#fff', color: '#161616', padding: '2rem', minHeight: '500px' }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #0F62FE' }}>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F62FE' }}>Dr. Juan Pérez</div>
                            <div style={{ fontSize: '0.75rem', color: '#525252' }}>Médico Internista — Colegio Médico #12345</div>
                            <div style={{ fontSize: '0.75rem', color: '#525252' }}>Tel: +1 809-555-0000</div>
                        </div>

                        {/* Patient */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.6875rem', color: '#6F6F6F', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Paciente</div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>María García López</div>
                            <div style={{ fontSize: '0.75rem', color: '#525252' }}>Cédula: 001-1234567-8 · 41 años</div>
                        </div>

                        {/* Date */}
                        <div style={{ fontSize: '0.75rem', color: '#6F6F6F', marginBottom: '1.5rem' }}>
                            Fecha: {new Date().toLocaleDateString('es-ES')}
                        </div>

                        {/* Rx Header */}
                        <div style={{ fontSize: '1.5rem', fontWeight: 300, color: '#0F62FE', marginBottom: '1rem' }}>Rx</div>

                        {/* Items */}
                        {items.filter(i => i.medication).map((item, index) => (
                            <div key={item.id} style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E0E0E0' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                    {index + 1}. {item.medication} {item.dose}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#525252', lineHeight: 1.6 }}>
                                    {item.route} · {item.frequency} · {item.duration}
                                    {item.instructions && <><br />{item.instructions}</>}
                                </div>
                            </div>
                        ))}

                        {/* Signature */}
                        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                            <div style={{ borderTop: '1px solid #161616', width: '200px', margin: '0 auto', paddingTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>Dr. Juan Pérez</div>
                                <div style={{ fontSize: '0.6875rem', color: '#6F6F6F' }}>Firma y Sello</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
