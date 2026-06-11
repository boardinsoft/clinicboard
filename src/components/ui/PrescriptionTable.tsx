'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Calendar, Clock, Pill, User2, FileText, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from '@/lib/date-utils';
import {
    PRESCRIPTION_STATUS_LABELS,
    PRESCRIPTION_STATUS_VARIANT,
} from '@/lib/table-status';

interface PrescriptionForPreview {
    id: string;
    authored_on: string | null;
    status: string | null;
    medication_code: string;
    medication_display: string;
    dosage_instruction: unknown | null;
    note: string | null;
    patient?: {
        id: string;
        name_given: string[];
        name_family: string;
        birth_date: string | null;
    } | null;
    prescriber?: {
        name_given: string[];
        name_family: string;
    } | null;
    encounter_id?: string | null;
}

interface PrescriptionTableProps {
    prescriptions: PrescriptionForPreview[];
    toolbar?: React.ReactNode;
    className?: string;
}

function getDosageSummary(dosage: unknown): string {
    if (!dosage) return '—';
    if (Array.isArray(dosage)) {
        return dosage.join('; ');
    }
    return String(dosage);
}

export default function PrescriptionTable({ prescriptions, toolbar, className }: PrescriptionTableProps) {
    const router = useRouter();
    const params = useParams();
    const slug = (params.clinicSlug as string) || '';

    if (prescriptions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center border border-dashed border-border">
                    <Pill className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-foreground">No hay recetas registradas</h3>
                    <p className="text-[12px] text-n-8 max-w-[280px] mx-auto">
                        Aún no se han creado recetas médicas para este periodo.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-8"
                    onClick={() => router.push(`/${slug}/prescriptions/new`)}
                >
                    <Pill className="w-3.5 h-3.5 mr-2" />
                    Nueva Receta
                </Button>
            </div>
        );
    }

    return (
        <div className={`flex-1 flex flex-col min-h-0 bg-background overflow-hidden ${className ?? ''}`}>
            {(toolbar || true) && (
                <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border/40 bg-background">
                    <div className="flex-1">{toolbar}</div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 gap-1 text-b-8 hover:bg-b-1"
                        onClick={() => router.push(`/${slug}/prescriptions/new`)}
                    >
                        <Pill className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">+ Receta</span>
                    </Button>
                </div>
            )}
            <div className="overflow-x-auto min-h-0 flex-1 no-scrollbar">
                <table className="table-clinic">
                    <thead className="sticky top-0 z-30 shadow-xs">
                    <tr>
                        <th>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Fecha
                            </div>
                        </th>
                        <th>
                            <div className="flex items-center gap-1.5">
                                <User2 className="w-3 h-3" /> Paciente
                            </div>
                        </th>
                        <th className="hidden md:table-cell">
                            <div className="flex items-center gap-1.5">
                                <Pill className="w-3 h-3" /> Medicamento
                            </div>
                        </th>
                        <th>Estado</th>
                        <th className="hidden lg:table-cell">
                            <div className="flex items-center gap-1.5">
                                <FileText className="w-3 h-3" /> Dosis
                            </div>
                        </th>
                        <th className="hidden lg:table-cell text-right">
                            <div className="flex items-center justify-end gap-1.5">
                                <User2 className="w-3 h-3" /> Prescriptor
                            </div>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {prescriptions.map((rx) => {
                        const status = rx.status || 'draft';
                        const variant = PRESCRIPTION_STATUS_VARIANT[status] || 'pill-neutral';
                        const label = PRESCRIPTION_STATUS_LABELS[status] || status;
                        const patientName = rx.patient
                            ? `${rx.patient.name_family}, ${(rx.patient.name_given || []).join(' ')}`
                            : '—';
                        const age = rx.patient?.birth_date
                            ? calcAge(rx.patient.birth_date)
                            : null;
                        const prescriberName = rx.prescriber
                            ? `${rx.prescriber.name_family}, ${(rx.prescriber.name_given || []).join(' ')}`
                            : '—';
                        const dosageSummary = getDosageSummary(rx.dosage_instruction);

                        return (
                            <tr
                                key={rx.id}
                                onClick={() => router.push(`/${slug}/prescriptions/${rx.id}`)}
                                className="group transition-colors cursor-pointer"
                            >
                                <td className="whitespace-nowrap">
                                    <div className="text-xs font-bold text-foreground group-hover:text-b-8 transition-colors">
                                        {rx.authored_on ? formatDate(rx.authored_on) : '—'}
                                    </div>
                                    <div className="text-[10px] text-n-8 mono mt-0.5">
                                        {rx.authored_on ? formatTime(rx.authored_on) : '—'}
                                    </div>
                                </td>

                                <td>
                                    <div className="table-name truncate max-w-[180px]">
                                        {patientName}
                                    </div>
                                    {age && (
                                        <div className="text-[10px] text-n-8 mt-0.5 mono">{age}</div>
                                    )}
                                </td>

                                <td className="hidden md:table-cell">
                                    <div className="max-w-[200px]">
                                        <div className="text-xs font-medium text-foreground truncate" title={rx.medication_display}>
                                            {rx.medication_display}
                                        </div>
                                        <div className="text-[10px] text-n-8 mono mt-0.5">
                                            {rx.medication_code}
                                        </div>
                                    </div>
                                </td>

                                <td className="whitespace-nowrap">
                                    <Badge variant={variant}>
                                        {label}
                                    </Badge>
                                </td>

                                <td className="hidden lg:table-cell max-w-[200px]">
                                    <p className="text-xs text-n-9 truncate" title={dosageSummary}>
                                        {dosageSummary}
                                    </p>
                                </td>

                                <td className="hidden lg:table-cell whitespace-nowrap text-right">
                                    <span className="text-[11px] text-n-8">
                                        {prescriberName}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function calcAge(birthDate: string | null): string | null {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return `${age}a`;
}