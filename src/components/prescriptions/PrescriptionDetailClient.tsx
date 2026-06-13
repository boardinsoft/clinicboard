'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, RotateCcw, Ban, CheckCircle, PauseCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    activatePrescription,
    cancelPrescription,
    completePrescription,
    pausePrescription,
    resumePrescription,
} from '@/actions/prescriptions';
import { formatDate, formatTime } from '@/lib/date-utils';
import { FREQUENCIES, ROUTES } from '@/lib/schemas/prescription.schema';
import type { MedicationRequestStatus } from '@/lib/fhir/types';

interface AuditEntry {
    id: string;
    action: string;
    old_status: string | null;
    new_status: string | null;
    changed_at: string;
    reason: string | null;
    changed_by_practitioner?: {
        name_given: string[];
        name_family: string;
    } | null;
}

interface PrescriptionDetailClientProps {
    prescription: {
        id: string;
        authored_on: string | null;
        status: MedicationRequestStatus | null;
        medication_code: string;
        medication_display: string;
        dosage_instruction: unknown | null;
        note: string | null;
        intent: string | null;
        patient?: {
            id: string;
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
        encounter?: {
            id: string;
            status: string;
            patient_id: string;
        } | null;
    };
    auditLog: AuditEntry[];
    clinicSlug: string;
}

function getFrequencyLabel(value: string): string {
    return FREQUENCIES.find(f => f.value === value)?.label || value;
}

function getRouteLabel(value: string): string {
    return ROUTES.find(r => r.value === value)?.label || value;
}

function getDosageSummary(dosage: unknown): { dose: string; frequency: string; route: string; duration: string; indications: string } {
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

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' | 'success' | 'warning' | 'info' | 'neutral' }> = {
    'draft': { label: 'Borrador', variant: 'secondary' },
    'active': { label: 'Activa', variant: 'success' },
    'on-hold': { label: 'Pausada', variant: 'warning' },
    'completed': { label: 'Completada', variant: 'neutral' },
    'cancelled': { label: 'Cancelada', variant: 'destructive' },
    'stopped': { label: 'Detenida', variant: 'destructive' },
    'unknown': { label: 'Desconocido', variant: 'secondary' },
};

export default function PrescriptionDetailClient({ prescription, auditLog, clinicSlug }: PrescriptionDetailClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(prescription.status as MedicationRequestStatus);
    const [showCancelReason, setShowCancelReason] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG['unknown'];
    const patientName = prescription.patient
        ? `${prescription.patient.name_family}, ${(prescription.patient.name_given || []).join(' ')}`
        : '—';
    const prescriberName = prescription.prescriber
        ? `${prescription.prescriber.name_family}, ${(prescription.prescriber.name_given || []).join(' ')}`
        : '—';
    const patientAge = prescription.patient?.birth_date
        ? (() => {
            const today = new Date();
            const birth = new Date(prescription.patient!.birth_date!);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            return `${age}a`;
        })()
        : null;

    const dosage = getDosageSummary(prescription.dosage_instruction);

    const handleAction = async (action: () => Promise<{ error?: string }>) => {
        setIsLoading(true);
        const result = await action();
        setIsLoading(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('Acción ejecutada');
            router.refresh();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-n-2">
            <div className="shrink-0 bg-n-1 border-b border-n-5/30">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 pl-0 pr-3 gap-1.5"
                            onClick={() => router.push(`/${clinicSlug}/prescriptions`)}
                        >
                            <ArrowLeft className="w-4 h-4 text-n-8" />
                            <span className="text-xs font-medium text-n-8">Volver</span>
                        </Button>
                        <div className="w-px h-6 bg-n-5/30" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-b-8/10 flex items-center justify-center">
                                <span className="text-b-8 text-sm font-bold">Rx</span>
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-n-11">Receta médica</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant={statusConfig.variant as any} className="text-[10px]">
                                        {statusConfig.label}
                                    </Badge>
                                    <span className="text-[10px] text-n-8 mono">
                                        {prescription.authored_on ? formatDate(prescription.authored_on) : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-[11px]"
                            onClick={handlePrint}
                        >
                            <Printer className="w-3.5 h-3.5 mr-1.5" />
                            Imprimir
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-6 space-y-6">
                    <div className="flex items-start gap-3 p-4 bg-n-1 rounded-lg border border-n-5/30">
                        <div className="w-10 h-10 rounded-full bg-b-8/10 flex items-center justify-center text-b-8 text-sm font-bold shrink-0">
                            {patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-n-11">{patientName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                {patientAge && (
                                    <>
                                        <span className="text-[11px] text-n-8">{patientAge}</span>
                                        <span className="text-[10px] text-n-6">·</span>
                                    </>
                                )}
                                <span className="text-[11px] text-n-8">Dr. {prescriberName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white text-black rounded-lg border border-n-5/30 p-8">
                        <div className="max-w-[650px] mx-auto">
                            <div className="text-center mb-8 pb-6 border-b-2 border-b-8/20">
                                <div className="text-xl font-bold text-b-8 tracking-tight">
                                    CLÍNICA MÉDICA
                                </div>
                            </div>

                            <div className="mb-8 pb-6 border-b border-n-5/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-bold text-n-8 uppercase tracking-widest mb-1">
                                            Paciente
                                        </div>
                                        <div className="text-sm font-bold text-n-11">{patientName}</div>
                                        {patientAge && (
                                            <div className="text-[11px] text-n-8 mt-0.5">{patientAge}</div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-n-8 uppercase tracking-widest mb-1">
                                            Fecha
                                        </div>
                                        <div className="text-sm font-bold text-n-11 mono">
                                            {prescription.authored_on ? formatDate(prescription.authored_on) : '—'}
                                        </div>
                                        <div className="text-[11px] text-n-8 mono mt-0.5">
                                            {prescription.authored_on ? formatTime(prescription.authored_on) : '—'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-4xl font-serif italic text-b-8/60 mb-8 border-b border-b-8/10 pb-4 font-bold">
                                Rx
                            </div>

                            <div className="space-y-6 min-h-[100px]">
                                <div className="pb-6 border-b border-n-5/20">
                                    <div className="font-bold text-[14px] mb-2 flex items-baseline gap-2">
                                        <span className="text-b-8/60 text-[11px] font-mono">1.</span>
                                        {prescription.medication_display}
                                        <span className="text-n-8 font-medium ml-2 text-[13px] font-mono">
                                            {dosage.dose}
                                        </span>
                                    </div>
                                    <div className="text-[12px] text-n-9 leading-relaxed pl-5 flex flex-wrap gap-x-2 gap-y-1">
                                        {dosage.route && (
                                            <>
                                                <span className="px-1.5 py-0.5 bg-n-2 text-n-8 text-[10px] font-medium rounded border border-n-5/30">
                                                    {getRouteLabel(dosage.route)}
                                                </span>
                                                <span className="text-n-5">·</span>
                                            </>
                                        )}
                                        {dosage.frequency && (
                                            <>
                                                <span className="font-medium font-mono">{getFrequencyLabel(dosage.frequency)}</span>
                                                <span className="text-n-5">·</span>
                                            </>
                                        )}
                                        {dosage.duration && (
                                            <span className="font-medium italic font-mono">{dosage.duration}</span>
                                        )}
                                    </div>
                                    {dosage.indications && (
                                        <div className="mt-2 ml-5 text-[11px] font-medium bg-s-warning-bg/50 text-s-warning p-2 rounded border border-s-warning-br/30">
                                            Indicación: {dosage.indications}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {prescription.note && (
                                <div className="mt-6 p-4 bg-n-2/50 rounded border border-n-5/30">
                                    <div className="text-[10px] font-bold text-n-8 uppercase tracking-widest mb-2">
                                        Notas adicionales
                                    </div>
                                    <div className="text-[12px] text-n-9 leading-relaxed">
                                        {prescription.note}
                                    </div>
                                </div>
                            )}

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
                                        <div className="text-[9px] text-n-6 font-mono mt-0.5">
                                            Colegio Médico: {prescription.prescriber.license_number}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 rounded-full bg-b-8" />
                            <h2 className="text-sm font-semibold text-n-11">Acciones de estado</h2>
                        </div>

                        <div className="p-4 bg-n-1 rounded-lg border border-n-5/30 space-y-3">
                            {currentStatus === 'draft' && (
                                <Button
                                    size="sm"
                                    className="h-9 px-4 text-[12px] bg-b-8 hover:bg-b-9 active:scale-95"
                                    onClick={() => handleAction(() => activatePrescription(prescription.id))}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                                    Activar receta
                                </Button>
                            )}

                            {currentStatus === 'active' && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-4 text-[12px]"
                                        onClick={() => handleAction(() => completePrescription(prescription.id))}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                                        Completar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-4 text-[12px]"
                                        onClick={() => handleAction(() => pausePrescription(prescription.id))}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <PauseCircle className="w-3.5 h-3.5 mr-1.5" />}
                                        Pausar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-4 text-[12px] border-s-danger/30 text-s-danger hover:bg-s-danger/10"
                                        onClick={() => setShowCancelReason(true)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Ban className="w-3.5 h-3.5 mr-1.5" />}
                                        Cancelar
                                    </Button>
                                </>
                            )}

                            {currentStatus === 'on-hold' && (
                                <>
                                    <Button
                                        size="sm"
                                        className="h-9 px-4 text-[12px] bg-b-8 hover:bg-b-9 active:scale-95"
                                        onClick={() => handleAction(() => resumePrescription(prescription.id))}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
                                        Reanudar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-4 text-[12px] border-s-danger/30 text-s-danger hover:bg-s-danger/10"
                                        onClick={() => setShowCancelReason(true)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Ban className="w-3.5 h-3.5 mr-1.5" />}
                                        Cancelar
                                    </Button>
                                </>
                            )}

                            {(currentStatus === 'completed' || currentStatus === 'cancelled') && (
                                <p className="text-xs text-n-8">Esta receta ya no permite cambios de estado.</p>
                            )}

                            {showCancelReason && (
                                <div className="flex items-center gap-2 pt-2 border-t border-n-5/20">
                                    <input
                                        type="text"
                                        placeholder="Motivo de cancelación..."
                                        value={cancelReason}
                                        onChange={e => setCancelReason(e.target.value)}
                                        className="flex-1 h-9 px-3 text-sm border border-n-5 rounded-md bg-n-1 focus:outline-none focus:border-b-8"
                                    />
                                    <Button
                                        size="sm"
                                        className="h-9 px-4 text-[12px] bg-s-danger hover:bg-s-danger/90"
                                        onClick={() => {
                                            handleAction(() => cancelPrescription(prescription.id, cancelReason));
                                            setShowCancelReason(false);
                                        }}
                                        disabled={isLoading}
                                    >
                                        Confirmar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 px-3 text-[12px]"
                                        onClick={() => { setShowCancelReason(false); setCancelReason(''); }}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {auditLog.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 rounded-full bg-b-8" />
                                <h2 className="text-sm font-semibold text-n-11">Historial de cambios</h2>
                            </div>

                            <div className="bg-n-1 rounded-lg border border-n-5/30 divide-y divide-n-5/20">
                                {auditLog.map(entry => (
                                    <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-n-3 flex items-center justify-center shrink-0">
                                            {entry.action === 'activate' && <CheckCircle className="w-4 h-4 text-s-success" />}
                                            {entry.action === 'cancel' && <Ban className="w-4 h-4 text-s-danger" />}
                                            {entry.action === 'complete' && <CheckCircle className="w-4 h-4 text-s-success" />}
                                            {entry.action === 'pause' && <PauseCircle className="w-4 h-4 text-s-warning" />}
                                            {entry.action === 'resume' && <RotateCcw className="w-4 h-4 text-s-info" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-n-11 capitalize">{entry.action}</span>
                                                {entry.old_status && entry.new_status && (
                                                    <span className="text-[10px] text-n-8 mono">
                                                        {entry.old_status} → {entry.new_status}
                                                    </span>
                                                )}
                                            </div>
                                            {entry.reason && (
                                                <p className="text-[11px] text-n-8 mt-0.5">{entry.reason}</p>
                                            )}
                                            <p className="text-[10px] text-n-6 mt-0.5 mono">
                                                {formatDate(entry.changed_at)} {formatTime(entry.changed_at)}
                                                {entry.changed_by_practitioner && (
                                                    ` · Dr. ${entry.changed_by_practitioner.name_family}`
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
