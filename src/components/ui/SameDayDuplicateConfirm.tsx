'use client';

import React from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { formatTime } from '@/lib/date-utils';
import { AlertTriangle } from 'lucide-react';

interface SameDayDuplicateConfirmProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    previousEncounterTime: string | null;
    onConfirm: () => void;
}

export default function SameDayDuplicateConfirm({
    open,
    onOpenChange,
    previousEncounterTime,
    onConfirm,
}: SameDayDuplicateConfirmProps) {
    const timeStr = previousEncounterTime
        ? formatTime(previousEncounterTime)
        : null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-n-2 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-n-8" />
                        </div>
                        <AlertDialogTitle>Paciente ya atendido hoy</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription asChild>
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>
                                Este paciente ya fue atendido el día de hoy
                                {timeStr && <> a las <strong>{timeStr}</strong></>}.
                            </p>
                            <p className="text-n-8">
                                ¿Deseas crear otra consulta de todas formas?
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        Crear de todas formas
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}