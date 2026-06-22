'use client';

import React from 'react';
import {
    CheckCircle,
    PauseCircle,
    RotateCcw,
    Ban,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    activatePrescription,
    completePrescription,
    pausePrescription,
    resumePrescription,
} from '@/actions/prescriptions';
import type { MedicationRequestStatus } from '@/lib/fhir/types';

type LoadingAction = 'activate' | 'complete' | 'pause' | 'resume' | 'cancel';

interface StatusActionsProps {
    prescriptionId: string;
    status: MedicationRequestStatus;
    onAction: (actionFn: () => Promise<{ error?: string }>, actionKey: LoadingAction) => void;
    loadingAction: string | null;
    onCancelRequest: () => void;
}

export function StatusActions({
    prescriptionId,
    status,
    onAction,
    loadingAction,
    onCancelRequest,
}: StatusActionsProps) {
    const isLoading = loadingAction !== null;

    if (status === 'completed' || status === 'cancelled' || status === 'stopped' || status === 'unknown') {
        return (
            <p className="text-xs text-n-8 py-2" id="status-actions-terminal">
                Esta receta ya no permite cambios de estado.
            </p>
        );
    }

    return (
        <div
            role="group"
            aria-labelledby="status-actions-title"
            className="flex flex-wrap items-center gap-2"
        >
            <span id="status-actions-title" className="sr-only">
                Acciones de estado de receta
            </span>

            {status === 'draft' && (
                <Button
                    size="sm"
                    className="h-9 px-4 text-[12px] bg-b-8 hover:bg-b-9 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onAction(() => activatePrescription(prescriptionId), 'activate')}
                    disabled={isLoading}
                    aria-disabled={isLoading}
                    aria-busy={loadingAction === 'activate'}
                >
                    {loadingAction === 'activate' ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : (
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    )}
                    {loadingAction === 'activate' ? 'Activando…' : 'Activar receta'}
                    {loadingAction === 'activate' && <span className="sr-only">de receta</span>}
                </Button>
            )}

            {status === 'on-hold' && (
                <>
                    <Button
                        size="sm"
                        className="h-9 px-4 text-[12px] bg-b-8 hover:bg-b-9 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => onAction(() => resumePrescription(prescriptionId), 'resume')}
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        aria-busy={loadingAction === 'resume'}
                    >
                        {loadingAction === 'resume' ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        ) : (
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        )}
                        {loadingAction === 'resume' ? 'Reanudando…' : 'Reanudar'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-[12px] border-s-danger/30 text-s-danger hover:bg-s-danger/10 hover:border-s-danger/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onCancelRequest}
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        aria-busy={loadingAction === 'cancel'}
                    >
                        {loadingAction === 'cancel' ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        ) : (
                            <Ban className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        )}
                        {loadingAction === 'cancel' ? 'Cancelando…' : 'Cancelar'}
                    </Button>
                </>
            )}

            {status === 'active' && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-[12px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => onAction(() => completePrescription(prescriptionId), 'complete')}
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        aria-busy={loadingAction === 'complete'}
                    >
                        {loadingAction === 'complete' ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        ) : (
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        )}
                        {loadingAction === 'complete' ? 'Completando…' : 'Completar'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-[12px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => onAction(() => pausePrescription(prescriptionId), 'pause')}
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        aria-busy={loadingAction === 'pause'}
                    >
                        {loadingAction === 'pause' ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        ) : (
                            <PauseCircle className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        )}
                        {loadingAction === 'pause' ? 'Pausando…' : 'Pausar'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-[12px] border-s-danger/30 text-s-danger hover:bg-s-danger/10 hover:border-s-danger/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onCancelRequest}
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        aria-busy={loadingAction === 'cancel'}
                    >
                        {loadingAction === 'cancel' ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        ) : (
                            <Ban className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        )}
                        {loadingAction === 'cancel' ? 'Cancelando…' : 'Cancelar'}
                    </Button>
                </>
            )}
        </div>
    );
}
