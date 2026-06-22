'use client';

import React from 'react';
import { AlertTriangle, Pill, Calendar, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

function getDosageSummary(dosage: unknown): {
    dose: string;
    frequency: string;
    route: string;
    duration: string;
    instructions: string;
} {
    if (!dosage) return { dose: '', frequency: '', route: '', duration: '', instructions: '' };
    const arr = Array.isArray(dosage) ? dosage : [];
    const get = (prefix: string) => arr.find(s => s.startsWith(prefix))?.replace(prefix, '') || '';
    return {
        dose: get('500mg') || get('250mg') || arr[0] || '',
        frequency: get('Cada ') || get('q') || '',
        route: get('Vía: ') || '',
        duration: get('Duración: ') || '',
        instructions: arr.find(s => s.startsWith('Indicaciones: '))?.replace('Indicaciones: ', '') || '',
    };
}

export function PrescriptionBodyScreen({ prescription }: PrescriptionBodyScreenProps) {
    const dosage = getDosageSummary(prescription.dosage_instruction);

    return (
        <section
            aria-labelledby="prescription-body-title"
            className="space-y-4"
        >
            <h2 id="prescription-body-title" className="sr-only">
                Detalles de la prescripción
            </h2>

            {/* Prescription number */}
            {prescription.prescription_number && (
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-n-8 uppercase tracking-widest">
                        Receta
                    </span>
                    <span className="text-[11px] font-mono font-bold text-b-8 bg-b-2 px-2 py-0.5 rounded border border-b-8/20">
                        {prescription.prescription_number}
                    </span>
                </div>
            )}

            {/* Medication card */}
            <div className="bg-n-1 rounded-xl border border-n-5/30 p-6 space-y-5">
                {/* Drug name + dose */}
                <div className="flex items-start gap-4">
                    <div
                        className="w-10 h-10 rounded-lg bg-b-2 flex items-center justify-center shrink-0 mt-0.5"
                        aria-hidden="true"
                    >
                        <Pill className="w-5 h-5 text-b-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold text-n-11 leading-tight">
                            {prescription.medication_display}
                        </div>
                        {dosage.dose && (
                            <div className="text-[13px] font-mono text-n-8 mt-1">
                                {dosage.dose}
                            </div>
                        )}
                        {prescription.medication_code && (
                            <div className="text-[11px] font-mono text-n-7 mt-0.5">
                                {prescription.medication_code}
                            </div>
                        )}
                    </div>
                </div>

                {/* Dosage details */}
                <div className="flex flex-wrap items-center gap-2 pl-14">
                    {dosage.route && (
                        <Badge variant="pill-info" className="text-[10px] font-semibold gap-1.5">
                            <span className="font-mono">{getRouteLabel(dosage.route)}</span>
                        </Badge>
                    )}
                    {dosage.frequency && (
                        <Badge variant="pill-neutral" className="text-[10px] font-semibold gap-1.5">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            {getFrequencyLabel(dosage.frequency)}
                        </Badge>
                    )}
                    {dosage.duration && (
                        <Badge variant="pill-neutral" className="text-[10px] font-semibold">
                            {dosage.duration}
                        </Badge>
                    )}
                </div>

                {/* Special instructions / warnings */}
                {dosage.instructions && (
                    <div
                        role="alert"
                        className="ml-14 flex items-start gap-2.5 p-3 bg-s-warning-bg/70 rounded-lg border border-s-warning-br/40"
                    >
                        <AlertTriangle
                            className="w-4 h-4 text-s-warning shrink-0 mt-0.5"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-[11px] font-bold text-s-warning uppercase tracking-wider mb-0.5">
                                Indicación especial
                            </p>
                            <p className="text-[13px] text-n-11 leading-relaxed">
                                {dosage.instructions}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Additional notes */}
            {prescription.note && (
                <div className="bg-n-1 rounded-xl border border-n-5/30 p-4">
                    <div className="flex items-start gap-2.5">
                        <FileText
                            className="w-4 h-4 text-n-8 shrink-0 mt-0.5"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-[11px] font-bold text-n-8 uppercase tracking-wider mb-1">
                                Notas de la prescripción
                            </p>
                            <p className="text-[13px] text-n-11 leading-relaxed">
                                {prescription.note}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
