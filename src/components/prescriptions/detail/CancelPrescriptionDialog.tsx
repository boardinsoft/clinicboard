'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { MedicationRequestStatus } from '@/lib/fhir/types';
import { cn } from '@/lib/utils';

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
            <AlertDialogContent className="max-w-md rounded-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-n-11">
                        ¿Cancelar esta receta?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-n-8 text-[13px]">
                        {requiresReason
                            ? 'Indica el motivo para el historial clínico. Esta acción no se puede deshacer.'
                            : 'Esta acción no se puede deshacer. ¿Estás seguro de que deseas cancelar esta receta?'}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-2">
                    <Label
                        htmlFor="cancel-reason"
                        className={cn(
                            'text-[11px] font-semibold uppercase tracking-wider mb-1.5 block',
                            requiresReason ? 'text-n-11' : 'text-n-8'
                        )}
                    >
                        {requiresReason ? 'Motivo de cancelación' : 'Motivo (opcional)'}
                        {requiresReason && <span className="text-s-danger ml-0.5" aria-hidden="true">*</span>}
                    </Label>
                    <Textarea
                        id="cancel-reason"
                        placeholder={placeholder}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className={cn(
                            'resize-none text-[13px] bg-n-1 border-n-5 rounded-md',
                            'focus-visible:ring-2 focus-visible:ring-b-8 focus-visible:ring-offset-0 focus-visible:border-b-8',
                            'placeholder:text-n-8'
                        )}
                        aria-required={requiresReason}
                        aria-describedby="cancel-reason-hint"
                        autoFocus
                    />
                    {requiresReason && reason.trim().length > 0 && reason.trim().length < 3 && (
                        <p id="cancel-reason-hint" className="text-[10px] text-s-danger mt-1" role="alert">
                            El motivo debe tener al menos 3 caracteres.
                        </p>
                    )}
                </div>

                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-4 text-[12px]"
                        >
                            Volver
                        </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button
                            size="sm"
                            className="h-9 px-4 text-[12px] bg-s-danger hover:bg-s-danger/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleConfirm}
                            disabled={!isValid || isLoading}
                            aria-disabled={!isValid || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" aria-hidden="true" />
                                    <span>Cancelando…</span>
                                </>
                            ) : (
                                'Cancelar receta'
                            )}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
