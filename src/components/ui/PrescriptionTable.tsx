'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Calendar,
    Clock,
    Pill,
    User2,
    FileText,
    Stethoscope,
    MoreVertical,
    Eye,
    Printer,
    Ban,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatTime } from '@/lib/date-utils';
import {
    PRESCRIPTION_STATUS_LABELS,
    PRESCRIPTION_STATUS_VARIANT,
} from '@/lib/table-status';

function getClinicSlug(pathname: string): string {
    const parts = pathname.split('/').filter(Boolean);
    return parts[0] || '';
}

interface PrescriptionForPreview {
    id: string;
    authored_on: string | null;
    status: string | null;
    medication_code: string;
    medication_display: string;
    dosage_instruction: unknown | null;
    note: string | null;
    prescription_number: string | null;
    patient?: {
        id: string;
        name_given: string[];
        name_family: string;
        birth_date: string | null;
        national_id: string | null;
    } | null;
    prescriber?: {
        name_given: string[];
        name_family: string;
    } | null;
    encounter_id?: string | null;
}

interface PrescriptionTableProps {
    prescriptions: PrescriptionForPreview[];
    isLoading?: boolean;
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

function LoadingSkeleton() {
    return (
        <div className="flex flex-col">
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 px-4 py-3 border-b border-border/30 last:border-0"
                >
                    <Skeleton className="h-9 w-20 rounded" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40 hidden md:block" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-32 hidden lg:block" />
                    <Skeleton className="h-4 w-24 hidden lg:block ml-auto" />
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            ))}
        </div>
    );
}

export default function PrescriptionTable({ prescriptions, isLoading, toolbar, className }: PrescriptionTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const clinicSlug = getClinicSlug(pathname);
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className={`flex-1 flex flex-col min-h-0 bg-background overflow-hidden ${className ?? ''}`}>
                <LoadingSkeleton />
            </div>
        );
    }

    if (prescriptions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center border border-dashed border-border">
                    <Pill className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-foreground">No hay recetas registradas</h3>
                    <p className="text-[12px] text-n-8 max-w-[280px] mx-auto">
                        Las recetas médicas se crean desde un encuentro clínico activo.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex-1 flex flex-col min-h-0 bg-background overflow-hidden ${className ?? ''}`}>
            <div className="overflow-x-auto min-h-0 flex-1 no-scrollbar">
                <table className="table-clinic">
                    <thead className="sticky top-0 z-30">
                    <tr>
                        <th className="w-12 text-center">#</th>
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
                                <Stethoscope className="w-3 h-3" /> Prescriptor
                            </div>
                        </th>
                        <th className="w-12"></th>
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
                        const patientNationalId = rx.patient?.national_id || null;
                        const prescriberName = rx.prescriber
                            ? `${rx.prescriber.name_family}, ${(rx.prescriber.name_given || []).join(' ')}`
                            : '—';
                        const dosageSummary = getDosageSummary(rx.dosage_instruction);

                        return (
                            <tr
                                key={rx.id}
                                onClick={() => router.push(`/${clinicSlug}/prescriptions/${rx.id}`)}
                                className="group transition-colors cursor-pointer"
                            >
                                <td className="text-center">
                                    <span className="text-[10px] font-mono text-n-8 hover:text-b-8 transition-colors">
                                        {rx.prescription_number || '—'}
                                    </span>
                                </td>

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
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {age && (
                                            <span className="text-[10px] text-n-8 mono">{age}</span>
                                        )}
                                        {age && patientNationalId && (
                                            <span className="text-[10px] text-n-6">·</span>
                                        )}
                                        {patientNationalId && (
                                            <span className="text-[10px] text-n-8 mono">{patientNationalId}</span>
                                        )}
                                    </div>
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

                                <td className="text-right">
                                    <div className="flex items-center justify-end gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Popover
                                            open={openPopoverId === rx.id}
                                            onOpenChange={(open) => setOpenPopoverId(open ? rx.id : null)}
                                        >
                                            <PopoverTrigger asChild>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1.5 hover:bg-n-3 rounded text-n-8 hover:text-n-12 transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-44 p-1 bg-n-1 border border-n-5 shadow-lg"
                                                align="end"
                                                side="left"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex flex-col">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/${clinicSlug}/prescriptions/${rx.id}`);
                                                            setOpenPopoverId(null);
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-[6px] text-n-12 cursor-pointer hover:bg-n-3 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4 text-n-8" />
                                                        Ver receta
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(`/api/prescriptions/${rx.id}/pdf`, '_blank');
                                                            setOpenPopoverId(null);
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-[6px] text-n-12 cursor-pointer hover:bg-n-3 transition-colors"
                                                    >
                                                        <Printer className="w-4 h-4 text-n-8" />
                                                        Imprimir PDF
                                                    </button>
                                                    {(rx.status === 'draft' || rx.status === 'on-hold') && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/${clinicSlug}/prescriptions/${rx.id}`);
                                                                setOpenPopoverId(null);
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-[6px] text-s-danger cursor-pointer hover:bg-s-danger/10 transition-colors"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
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
