'use client';

import { useState } from 'react';
import { Loader2, Building2, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clinic } from '@/lib/supabase/clinic-utils';

interface ClinicChangeModalProps {
    isOpen: boolean;
    currentClinic: Clinic | null;
    targetClinic: Clinic | null;
    isLoading: boolean;
    error: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ClinicChangeModal({
    isOpen,
    currentClinic,
    targetClinic,
    isLoading,
    error,
    onConfirm,
    onCancel,
}: ClinicChangeModalProps) {
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const handleConfirm = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedWarning(true);
        } else {
            onConfirm();
        }
    };

    const handleConfirmWithDiscard = () => {
        setShowUnsavedWarning(false);
        onConfirm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onCancel()}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-b-8" />
                        Cambiar de Clínica
                    </DialogTitle>
                    <DialogDescription>
                        Estás a punto de cambiar tu clínica activa.
                    </DialogDescription>
                </DialogHeader>

                {showUnsavedWarning ? (
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
                            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium text-warning">Cambios sin guardar</p>
                                <p className="text-sm text-foreground/80">
                                    Tienes cambios sin guardar que se perderán si cambias de clínica.
                                    ¿Estás seguro de que deseas continuar?
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                                type="checkbox"
                                id="discardChanges"
                                checked={!hasUnsavedChanges}
                                onChange={(e) => setHasUnsavedChanges(!e.target.checked)}
                                className="rounded border-input"
                            />
                            <label htmlFor="discardChanges">
                                Entiendo que perderé los cambios sin guardar
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-n-2 dark:bg-n-3">
                            <Building2 className="h-4 w-4 text-n-9" />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-n-9 uppercase tracking-wide">Clínica Actual</span>
                                <span className="text-sm font-medium">{currentClinic?.name || 'No seleccionada'}</span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-n-3 dark:bg-n-2">
                                <svg
                                    className="w-4 h-4 text-n-9"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-b-8/10 border border-b-8/20">
                            <Building2 className="h-4 w-4 text-b-8" />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-b-8 uppercase tracking-wide">Nueva Clínica</span>
                                <span className="text-sm font-medium">{targetClinic?.name || 'No seleccionada'}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        {showUnsavedWarning ? 'Volver' : 'Cancelar'}
                    </Button>
                    <Button
                        onClick={showUnsavedWarning ? handleConfirmWithDiscard : handleConfirm}
                        disabled={isLoading || (showUnsavedWarning && hasUnsavedChanges)}
                        className="flex-1 bg-b-8 hover:bg-b-8/90"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cambiando...
                            </>
                        ) : showUnsavedWarning ? (
                            'Descartar y cambiar'
                        ) : (
                            'Confirmar cambio'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
