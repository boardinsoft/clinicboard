'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/date-utils';
import { FREQUENCIES, ROUTES } from '@/lib/schemas/prescription.schema';

interface PrescriptionBodyProps {
    prescription: {
        medication_display: string;
        medication_code: string;
        dosage_instruction: unknown | null;
        note: string | null;
        authored_on: string | null;
        valid_until: string | null;
        patient?: {
            name_given: string[];
            name_family: string;
            birth_date: string | null;
        } | null;
        prescriber?: {
            name_given: string[];
            name_family: string;
            specialty: string | null;
            license_number: string | null;
        } | null;
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
    indications: string;
} {
    if (!dosage) return { dose: '', frequency: '', route: '', duration: '', indications: '' };
    const arr = Array.isArray(dosage) ? dosage : [];
    const get = (prefix: string) => arr.find(s => s.startsWith(prefix))?.replace(prefix, '') || '';
    return {
        dose: get('500mg') || get('250mg') || arr[0] || '',
        frequency: get('Cada ') || get('q') || '',
        route: get('Vía: ') || '',
        duration: get('Duración: ') || '',
        indications: arr.find(s => s.startsWith('Indicaciones: '))?.replace('Indicaciones: ', '') || '',
    };
}

function calcAge(birthDate: string | null): string | null {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age}a`;
}

export function PrescriptionBody({ prescription }: PrescriptionBodyProps) {
    const patientName = prescription.patient
        ? `${prescription.patient.name_family}, ${(prescription.patient.name_given || []).join(' ')}`
        : '—';
    const age = calcAge(prescription.patient?.birth_date ?? null);
    const prescriberName = prescription.prescriber
        ? `${prescription.prescriber.name_family}, ${(prescription.prescriber.name_given || []).join(' ')}`
        : '—';
    const dosage = getDosageSummary(prescription.dosage_instruction);

    return (
        <section
            aria-labelledby="prescription-body-title"
            className="bg-white text-foreground rounded-lg border border-n-5/30 p-8"
        >
            <div className="max-w-[650px] mx-auto">
                {/* Header */}
                <header className="text-center mb-8 pb-6 border-b-2 border-b-8/20">
                    <div className="text-xl font-bold text-b-8 tracking-tight">
                        CLÍNICA MÉDICA
                    </div>
                </header>

                {/* Patient & Date */}
                <div className="mb-8 pb-6 border-b border-n-5/30">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-n-8 uppercase tracking-widest mb-1" id="prescription-patient-label">
                                Paciente
                            </p>
                            <div className="text-sm font-bold text-n-11">{patientName}</div>
                            {age && (
                                <div className="text-[11px] text-n-8 mt-0.5">{age}</div>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[10px] font-bold text-n-8 uppercase tracking-widest mb-1">
                                Fecha
                            </p>
                            <div className="text-sm font-bold text-n-11 font-mono">
                                {prescription.authored_on ? formatDate(prescription.authored_on) : '—'}
                            </div>
                            <div className="text-[11px] text-n-8 font-mono mt-0.5">
                                {prescription.authored_on ? formatTime(prescription.authored_on) : '—'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rx Title */}
                <div
                    aria-hidden="true"
                    className="text-4xl font-serif italic text-b-8/60 mb-8 border-b border-b-8/10 pb-4 font-bold"
                >
                    Rx
                </div>

                {/* Medication */}
                <h2 id="prescription-body-title" className="sr-only">
                    Detalles del medicamento recetado
                </h2>
                <div className="space-y-6 min-h-[100px]">
                    <div className="pb-6 border-b border-n-5/20">
                        <div className="font-bold text-[14px] mb-2 flex items-baseline gap-2">
                            <span className="text-b-8/60 text-[11px] font-mono font-bold" aria-hidden="true">1.</span>
                            {prescription.medication_display}
                            <span className="text-n-8 font-medium ml-2 text-[13px] font-mono">
                                {dosage.dose}
                            </span>
                        </div>
                        <div className="text-[12px] text-n-9 leading-relaxed pl-5 flex flex-wrap gap-x-2 gap-y-1">
                            {dosage.route && (
                                <>
                                    <span className="px-1.5 py-0.5 bg-n-2 text-n-8 text-[10px] font-medium rounded border border-n-5/30 font-mono">
                                        {getRouteLabel(dosage.route)}
                                    </span>
                                    <span className="text-n-5" aria-hidden="true">·</span>
                                </>
                            )}
                            {dosage.frequency && (
                                <>
                                    <span className="font-medium font-mono">
                                        {getFrequencyLabel(dosage.frequency)}
                                    </span>
                                    <span className="text-n-5" aria-hidden="true">·</span>
                                </>
                            )}
                            {dosage.duration && (
                                <span className="font-medium italic font-mono">{dosage.duration}</span>
                            )}
                        </div>
                        {dosage.indications && (
                            <div
                                role="alert"
                                className="mt-2 ml-5 text-[11px] font-medium bg-s-warning-bg/50 text-s-warning p-2 rounded border border-s-warning-br/30 flex items-start gap-1.5"
                            >
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>
                                    <span className="font-semibold">Indicación: </span>
                                    {dosage.indications}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                {prescription.note && (
                    <div className="mt-6 p-4 bg-n-2/50 rounded border border-n-5/30">
                        <p className="text-[10px] font-bold text-n-8 uppercase tracking-widest mb-2">
                            Notas adicionales
                        </p>
                        <p className="text-[12px] text-n-9 leading-relaxed">
                            {prescription.note}
                        </p>
                    </div>
                )}

                {/* Signature */}
                <div className="mt-16 text-center">
                    <div className="border-t border-n-5/30 w-56 mx-auto pt-3">
                        <div className="text-[13px] font-bold text-n-11">
                            Dr. {prescriberName}
                        </div>
                        {prescription.prescriber?.specialty && (
                            <div className="text-[10px] text-n-8 uppercase tracking-wider mt-1">
                                {prescription.prescriber.specialty}
                            </div>
                        )}
                        {prescription.prescriber?.license_number && (
                            <div className="text-[9px] text-n-7 font-mono mt-0.5">
                                Colegio Médico: {prescription.prescriber.license_number}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
