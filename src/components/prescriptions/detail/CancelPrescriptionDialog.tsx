'use client';

import React, { useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { MedicationRequestStatus } from '@/lib/fhir/types';

interface CancelPrescriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => Promise<void>;
    status: MedicationRequestStatus;
}

const REASON_PLACEHOLDERS: Record<string, string> = {
    draft: 'Ej: Error en la prescripción original',
    active: 'Ej: Paciente presenta reacción adversa',
    'on-hold': 'Ej: Tratamiento suspendido por efectos secundarios',
};

const REASON_REQUIRED_FOR: string[] = ['active', 'on-hold'];

export function CancelPrescriptionDialog({
    open,
    onOpenChange,
    onConfirm,
    status,
}: CancelPrescriptionDialogProps) {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const requiresReason = REASON_REQUIRED_FOR.includes(status);
    const placeholder = REASON_PLACEHOLDERS[status] ?? 'Motivo de cancelación…';
    const isValid = requiresReason ? reason.trim().length >= 3 : true;

    const handleConfirm = async () => {
        if (!isValid) return;
        setIsLoading(true);
        try {
            await onConfirm(reason);
        } finally {
            setIsLoading(false);
            setReason('');
        }
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) setReason('');
        onOpenChange(next);
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="flex flex-col gap-0">
                <AlertDialogHeader className="pb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-md bg-s-danger-bg flex items-center justify-center">
                            <Ban
                                className="w-4 h-4 text-s-danger"
                                strokeWidth={1.8}
                                aria-hidden="true"
                            />
                        </div>
                        <AlertDialogTitle className="text-base font-bold text-n-11">
                            Cancelar esta receta
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-sm text-muted-foreground">
                        {requiresReason
                            ? 'Indica el motivo para el historial clínico. Esta acción no se puede deshacer.'
                            : 'Esta acción no se puede deshacer. ¿Estás seguro de que deseas cancelar esta receta?'}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="pb-1">
                    <label
                        htmlFor="cancel-reason"
                        className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block text-n-8"
                    >
                        {requiresReason ? 'Motivo de cancelación' : 'Motivo (opcional)'}
                        {requiresReason && (
                            <span className="text-s-danger ml-0.5" aria-hidden="true">
                                *
                            </span>
                        )}
                    </label>
                    <Textarea
                        id="cancel-reason"
                        placeholder={placeholder}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="resize-none text-[13px] placeholder:text-n-8"
                        aria-required={requiresReason}
                        aria-describedby={requiresReason ? 'cancel-reason-hint' : undefined}
                        autoFocus
                    />
                    {requiresReason && reason.trim().length > 0 && reason.trim().length < 3 && (
                        <p
                            id="cancel-reason-hint"
                            className="text-[10px] text-s-danger mt-1"
                            role="alert"
                        >
                            El motivo debe tener al menos 3 caracteres.
                        </p>
                    )}
                </div>

                <AlertDialogFooter className="gap-2 pt-2">
                    <Button
                        variant="ghost"
                        className="text-n-8 hover:bg-n-3 hover:text-n-11"
                        onClick={() => handleOpenChange(false)}
                        disabled={isLoading}
                    >
                        Volver
                    </Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700 border-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleConfirm}
                        disabled={!isValid || isLoading}
                        aria-disabled={!isValid || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2
                                    className="w-3.5 h-3.5 mr-1.5 animate-spin motion-reduce:animate-none"
                                    aria-hidden="true"
                                />
                                Cancelando…
                            </>
                        ) : (
                            'Cancelar receta'
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
