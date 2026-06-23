'use client';

import React from 'react';
import { Pill, AlertTriangle } from 'lucide-react';
import { FormFieldRow } from './FormFieldRow';
import { FREQUENCIES, ROUTES } from '@/lib/schemas/prescription.schema';

interface PrescriptionBodyScreenProps {
    prescription: {
        prescription_number: string | null;
        medication_display: string;
        medication_code: string;
        dosage_instruction: unknown | null;
        note: string | null;
    };
}

function getFrequencyLabel(value: string): string {
    return FREQUENCIES.find(f => f.value === value)?.label || value;
}

function getRouteLabel(value: string): string {
    return ROUTES.find(r => r.value === value)?.label || value;
}

function parseDosage(dosage: unknown): {
    dose: string;
    frequency: string;
    route: string;
    duration: string;
    instructions: string;
} {
    const empty = { dose: '', frequency: '', route: '', duration: '', instructions: '' };
    if (!dosage) return empty;
    if (!Array.isArray(dosage)) return empty;

    const result = { ...empty };

    for (const item of dosage) {
        if (typeof item !== 'string') continue;

        if (item.startsWith('Vía: ')) {
            result.route = item.replace('Vía: ', '');
        } else if (item.startsWith('Duración: ')) {
            result.duration = item.replace('Duración: ', '');
        } else if (item.startsWith('Indicaciones: ')) {
            result.instructions = item.replace('Indicaciones: ', '');
        } else if (/^\d/.test(item) && !result.dose) {
            result.dose = item;
        } else if (!result.frequency) {
            result.frequency = item;
        }
    }

    return result;
}

export function PrescriptionBodyScreen({ prescription }: PrescriptionBodyScreenProps) {
    const { dose, frequency, route, duration, instructions } = parseDosage(prescription.dosage_instruction);

    const frequencyLabel = frequency ? getFrequencyLabel(frequency) : '';
    const routeLabel = route ? getRouteLabel(route) : '';

    const hasInstructions = Boolean(instructions);
    const hasNote = Boolean(prescription.note);

    return (
        <section aria-labelledby="prescription-body-title">
            <h2 id="prescription-body-title" className="sr-only">
                Detalles de la prescripción
            </h2>

            <div className="bg-n-1 rounded-lg border border-n-5/30">
                {/* Integrated subheader */}
                <div className="px-4 py-3 border-b border-n-5/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-b-2 flex items-center justify-center shrink-0">
                        <Pill className="w-4 h-4 text-b-8" strokeWidth={1.8} aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-n-11">Medicación e indicaciones</h3>
                        <p className="text-[11px] text-n-8 mt-0.5">Datos del fármaco y régimen posológico</p>
                    </div>
                </div>

                {/* Data rows */}
                <div className="divide-y divide-n-5/30">
                    <FormFieldRow
                    label="Fármaco"
                    description="Nombre del medicamento recetado"
                    value={prescription.medication_display}
                />
                <FormFieldRow
                    label="Código"
                    description="Identificador del catálogo"
                    value={prescription.medication_code}
                    mono
                />
                <FormFieldRow
                    label="Dosis"
                    description="Cantidad por toma"
                    value={dose}
                    mono
                />
                <FormFieldRow
                    label="Frecuencia"
                    description="Intervalo de administración"
                    value={frequencyLabel}
                />
                <FormFieldRow
                    label="Vía"
                    description="Ruta de administración"
                    value={routeLabel}
                />
                <FormFieldRow
                    label="Duración"
                    description="Tiempo total del tratamiento"
                    value={duration}
                    mono
                />

                {hasInstructions && (
                    <div className="px-5 py-4">
                        <div
                            role="alert"
                            className="flex items-start gap-2.5 p-3 bg-s-warning-bg/70 rounded-lg border border-s-warning-br/40"
                        >
                            <AlertTriangle
                                className="w-4 h-4 text-s-warning shrink-0 mt-0.5"
                                aria-hidden="true"
                                strokeWidth={1.8}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-s-warning uppercase tracking-wider mb-1">
                                    Indicación especial
                                </p>
                                <p className="text-base font-medium text-n-11 leading-relaxed">
                                    {instructions}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {hasNote && (
                    <FormFieldRow
                        label="Notas"
                        description="Notas adicionales del médico"
                        value={prescription.note}
                    />
                )}
                </div>
            </div>
        </section>
    );
}
