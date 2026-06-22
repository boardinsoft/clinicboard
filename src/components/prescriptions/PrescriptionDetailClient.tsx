'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, RefreshCw, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageLayout';
import { toast } from 'sonner';
import {
    activatePrescription,
    cancelPrescription,
    completePrescription,
    pausePrescription,
    resumePrescription,
} from '@/actions/prescriptions';
import type { MedicationRequestStatus } from '@/lib/fhir/types';
import {
    PrescriptionDetailHeader,
    PatientContextCard,
    PrescriptionBodyScreen,
    StatusActions,
    CancelPrescriptionDialog,
    PrescriptionHistorySheet,
} from './detail';

type LoadingAction = 'activate' | 'complete' | 'pause' | 'resume' | 'cancel';

const ACTION_LABELS: Record<LoadingAction, string> = {
    activate: 'Receta activada',
    complete: 'Receta completada',
    pause: 'Receta pausada',
    resume: 'Receta reanudada',
    cancel: 'Receta cancelada',
};

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
        prescription_number: string | null;
        authored_on: string | null;
        valid_until: string | null;
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
            national_id: string | null;
        } | null;
        prescriber?: {
            id: string;
            name_given: string[];
            name_family: string;
            specialty: string | null;
            license_number: string | null;
            national_id: string | null;
            mpps_registration_number: string | null;
            university: string | null;
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

export default function PrescriptionDetailClient({
    prescription,
    auditLog,
    clinicSlug,
}: PrescriptionDetailClientProps) {
    const router = useRouter();
    const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [liveStatusMsg, setLiveStatusMsg] = useState('');
    const liveRegionRef = useRef<HTMLDivElement>(null);

    const handleAction = async (actionFn: () => Promise<{ error?: string }>, actionKey: LoadingAction) => {
        setLoadingAction(actionKey);
        setLiveStatusMsg('');
        const result = await actionFn();
        setLoadingAction(null);

        if (result.error) {
            toast.error('Error', { description: result.error });
        } else {
            const label = ACTION_LABELS[actionKey] ?? 'Acción ejecutada';
            toast.success(label);
            setLiveStatusMsg(`${label}. La página se actualizará en breve.`);
            router.refresh();
        }
    };

    const handleCancelConfirm = async (reason: string) => {
        setShowCancelDialog(false);
        setLoadingAction('cancel');
        setLiveStatusMsg('');
        const result = await cancelPrescription(prescription.id, reason);
        setLoadingAction(null);
        if (result.error) {
            toast.error('Error', { description: result.error });
        } else {
            toast.success('Receta cancelada');
            setLiveStatusMsg('Receta cancelada. La página se actualizará en breve.');
            router.refresh();
        }
    };

    const handlePrint = () => {
        try {
            window.open(`/api/prescriptions/${prescription.id}/pdf`, '_blank');
        } catch {
            toast.error('Error al abrir el PDF');
        }
    };

    const handleRefresh = () => {
        router.refresh();
    };

    const isLoading = loadingAction !== null;

    return (
        <div className="flex flex-col h-full bg-background">
            <PageHeader
                title="Receta médica"
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-n-5 text-n-12 hover:bg-n-3 transition-colors active:scale-95"
                            onClick={handleRefresh}
                            disabled={isLoading}
                            aria-label="Actualizar datos de la receta"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${isLoading ? 'animate-spin motion-reduce:animate-none' : ''}`}
                                aria-hidden="true"
                            />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-n-5 text-n-12 hover:bg-n-3 transition-colors active:scale-95"
                            onClick={() => setShowHistory(true)}
                            aria-label="Ver historial de cambios"
                        >
                            <History className="w-4 h-4 mr-1.5" aria-hidden="true" strokeWidth={1.8} />
                            <span className="text-[11px] font-medium">Historial</span>
                            {auditLog.length > 0 && (
                                <span className="ml-1 text-[10px] font-mono bg-n-2 border border-n-5/30 px-1.5 py-0.5 rounded-full tabular-nums">
                                    {auditLog.length}
                                </span>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-n-5 text-n-12 hover:bg-n-3 transition-colors active:scale-95"
                            onClick={handlePrint}
                            aria-label="Imprimir receta médica"
                        >
                            <Printer className="w-4 h-4 mr-1.5" aria-hidden="true" />
                            <span className="text-[11px] font-medium">Imprimir</span>
                        </Button>
                    </div>
                }
            >
                <PrescriptionDetailHeader
                    prescriptionNumber={prescription.prescription_number}
                    status={prescription.status}
                    authoredOn={prescription.authored_on}
                    validUntil={prescription.valid_until}
                />
            </PageHeader>

            <main
                id="prescription-detail-main"
                className="flex-1 overflow-y-auto"
                aria-label="Detalle de receta médica"
            >
                <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
                    {/* Patient context */}
                    <section aria-labelledby="patient-section-title">
                        <h2 id="patient-section-title" className="sr-only">
                            Datos del paciente
                        </h2>
                        <PatientContextCard
                            patient={prescription.patient}
                            prescriber={prescription.prescriber}
                            status={prescription.status}
                        />
                    </section>

                    {/* Prescription clinical card */}
                    <PrescriptionBodyScreen prescription={prescription} />

                    {/* Status actions */}
                    <section
                        aria-labelledby="status-actions-section-title"
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className="w-1 h-5 rounded-full bg-b-8 shrink-0"
                                aria-hidden="true"
                            />
                            <h2
                                id="status-actions-section-title"
                                className="text-sm font-semibold text-n-11"
                            >
                                Acciones de estado
                            </h2>
                        </div>

                        <div className="p-4 bg-n-1 rounded-lg border border-n-5/30">
                            <StatusActions
                                prescriptionId={prescription.id}
                                status={prescription.status ?? 'unknown'}
                                onAction={handleAction}
                                loadingAction={loadingAction}
                                onCancelRequest={() => setShowCancelDialog(true)}
                            />
                        </div>
                    </section>

                    {/* Audit log */}
                    <PrescriptionHistorySheet
                        open={showHistory}
                        onOpenChange={setShowHistory}
                        prescriptionNumber={prescription.prescription_number}
                        auditLog={auditLog}
                    />
                </div>
            </main>

            {/* Cancel dialog */}
            <CancelPrescriptionDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
                onConfirm={handleCancelConfirm}
                status={prescription.status ?? 'draft'}
            />

            {/* Live region for screen reader announcements */}
            <div
                ref={liveRegionRef}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {liveStatusMsg}
            </div>
        </div>
    );
}
