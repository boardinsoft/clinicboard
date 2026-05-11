'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClipboardList, ArrowRight } from 'lucide-react';

interface OnboardingResumeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    practitionerId?: string | null;
}

export function OnboardingResumeModal({ open, onOpenChange, practitionerId }: OnboardingResumeModalProps) {
    const router = useRouter();

    const handleResume = () => {
        onOpenChange(false);
        router.push('/onboarding');
    };

    const handleSignOut = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/auth/signout';
        document.body.appendChild(form);
        form.submit();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[8px] border border-n-5 p-6">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-b-2 rounded-full flex items-center justify-center">
                            <ClipboardList className="w-5 h-5 text-b-8" />
                        </div>
                        <DialogTitle className="text-lg font-semibold text-n-12">
                            Completa tu registro
                        </DialogTitle>
                    </div>
                </DialogHeader>
                <DialogDescription className="text-[14px] text-n-7">
                    Para acceder a todas las funciones de ClinicBoard, necesitas completar la configuración de tu perfil profesional y clínica.
                </DialogDescription>
                <DialogFooter className="mt-4 gap-2 flex-row-reverse sm:gap-2">
                    <Button
                        variant="default"
                        onClick={handleResume}
                        className="w-full sm:w-auto flex items-center gap-2"
                    >
                        Continuar
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="w-full sm:w-auto"
                    >
                        Cerrar sesión
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}