'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogHeader,
    DialogFooter,
} from '@/components/ui/dialog';
import { OnboardingSidebar } from './OnboardingSidebar';
import { OnboardingStepProfile } from './OnboardingStepProfile';
import { OnboardingStepClinic } from './OnboardingStepClinic';
import { OnboardingStepLocation } from './OnboardingStepLocation';
import { OnboardingStepComplete } from './OnboardingStepComplete';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import type { ProfileStepData, ClinicStepData, LocationStepData } from '@/lib/schemas/onboarding';
import { saveOnboardingState, clearOnboardingState } from '@/lib/schemas/onboarding';
import type { OnboardingStepProfileRef } from './OnboardingStepProfile';
import type { OnboardingStepClinicRef } from './OnboardingStepClinic';
import type { OnboardingStepLocationRef } from './OnboardingStepLocation';
import type { OnboardingStepCompleteRef } from './OnboardingStepComplete';

export interface OnboardingStepData {
    profile: ProfileStepData | null;
    clinic: ClinicStepData | null;
    location: LocationStepData | null;
    userId: string | null;
}

const steps = [
    { id: 'profile', label: 'Perfil' },
    { id: 'clinic', label: 'Clínica' },
    { id: 'location', label: 'Ubicación' },
    { id: 'complete', label: 'Completar' },
] as const;

type StepId = typeof steps[number]['id'];

interface OnboardingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string | null;
    initialData?: Partial<OnboardingStepData>;
    onComplete: (data: OnboardingStepData) => Promise<void>;
}

const pageVariants = {
    initial: { opacity: 0, x: 20 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
};

const pageTransition = {
    duration: 0.3,
    ease: 'easeOut' as const,
};

export function OnboardingDialog({
    open,
    onOpenChange,
    userId,
    initialData,
    onComplete,
}: OnboardingDialogProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = React.useState<StepId>('profile');
    const [stepData, setStepData] = React.useState<OnboardingStepData>(() => ({
        profile: initialData?.profile || null,
        clinic: initialData?.clinic || null,
        location: initialData?.location || null,
        userId: userId,
    }));
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);
    const [isClinicAvailable, setIsClinicAvailable] = React.useState(true);

    const profileRef = React.useRef<OnboardingStepProfileRef>(null);
    const clinicRef = React.useRef<OnboardingStepClinicRef>(null);
    const locationRef = React.useRef<OnboardingStepLocationRef>(null);
    const completeRef = React.useRef<OnboardingStepCompleteRef>(null);

    const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

    const handleStepChange = (stepId: StepId) => {
        setCurrentStep(stepId);
        if (stepId === 'clinic') {
            setIsClinicAvailable(true);
        }
    };

    const handleProfileSubmit = (data: ProfileStepData) => {
        const newState = { ...stepData, profile: data };
        setStepData(newState);
        setCurrentStep('clinic');
        setIsClinicAvailable(true);
        if (userId) {
            saveOnboardingState({ userId, currentStep: 2, profile: data });
        }
    };

    const handleClinicSubmit = (data: ClinicStepData) => {
        const newState = { ...stepData, clinic: data };
        setStepData(newState);
        setCurrentStep('location');
        if (userId) {
            saveOnboardingState({ userId, currentStep: 3, clinic: data });
        }
    };

    const handleLocationSubmit = (data: LocationStepData) => {
        const newState = { ...stepData, location: data };
        setStepData(newState);
        setCurrentStep('complete');
        if (userId) {
            saveOnboardingState({ userId, currentStep: 4, location: data });
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && currentStep !== 'complete' && !isLoading) {
            setShowCloseConfirm(true);
        } else {
            onOpenChange(newOpen);
        }
    };

    const handleBack = () => {
        const currentIndex = steps.findIndex((s) => s.id === currentStep);
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1].id);
        }
    };

    const handleCloseConfirm = (confirmed: boolean) => {
        setShowCloseConfirm(false);
        if (confirmed) {
            onOpenChange(false);
        }
    };

    const handleContinue = () => {
        switch (currentStep) {
            case 'profile':
                profileRef.current?.triggerSubmit();
                break;
            case 'clinic':
                clinicRef.current?.triggerSubmit();
                break;
            case 'location':
                locationRef.current?.triggerSubmit();
                break;
            case 'complete':
                handleComplete();
                break;
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onComplete(stepData);
            if (userId) {
                clearOnboardingState(userId);
            }
            onOpenChange(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al completar';
            if (errorMessage.includes('Sesión') || errorMessage.includes('401') || errorMessage.includes('inválida')) {
                onOpenChange(false);
                router.push('/login?reason=session_expired');
                return;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const canGoBack = currentStepIndex > 0;

    const renderStepContent = () => {
        switch (currentStep) {
            case 'profile':
                return (
                    <OnboardingStepProfile
                        ref={profileRef}
                        defaultValues={stepData.profile || undefined}
                        onSubmit={handleProfileSubmit}
                    />
                );
            case 'clinic':
                return (
                    <OnboardingStepClinic
                        ref={clinicRef}
                        defaultValues={stepData.clinic || undefined}
                        onSubmit={handleClinicSubmit}
                        onAvailabilityChange={setIsClinicAvailable}
                    />
                );
            case 'location':
                return (
                    <OnboardingStepLocation
                        ref={locationRef}
                        defaultValues={stepData.location || undefined}
                        onSubmit={handleLocationSubmit}
                    />
                );
            case 'complete':
                return (
                    <OnboardingStepComplete
                        ref={completeRef}
                        data={stepData}
                    />
                );
            default:
                return null;
        }
    };

    const continueButtonText = currentStep === 'complete' ? 'Ir al Tablero' : 'Continuar';

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="p-0 max-w-4xl max-h-[90vh] overflow-hidden rounded-[8px] border border-n-5">
                    <DialogTitle className="sr-only">
                        Onboarding de ClinicBoard
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Configura tu perfil profesional y clínica
                    </DialogDescription>

                    <div className="flex h-[600px]">
                        <OnboardingSidebar
                            currentStep={currentStep}
                            onStepChange={(stepId) => handleStepChange(stepId as StepId)}
                            completedSteps={[
                                stepData.profile ? 'profile' : null,
                                stepData.clinic ? 'clinic' : null,
                                stepData.location ? 'location' : null,
                            ].filter(Boolean) as StepId[]}
                        />

                        <div className="flex-1 flex flex-col">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial="initial"
                                    animate="enter"
                                    exit="exit"
                                    variants={pageVariants}
                                    transition={pageTransition}
                                    className="flex-1 p-6 overflow-y-auto"
                                >
                                    {error && (
                                        <div className="mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-md text-[13px] text-destructive">
                                            {error}
                                        </div>
                                    )}
                                    {renderStepContent()}
                                </motion.div>
                            </AnimatePresence>

                            <div className="p-6 border-t border-n-5 bg-n-2">
                                <div className="flex items-center gap-3">
                                    {canGoBack && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleBack}
                                            className="flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Atrás
                                        </Button>
                                    )}
                                    <div className="flex-1" />
                                    <Button
                                        type="button"
                                        variant="default"
                                        onClick={handleContinue}
                                        className="flex items-center gap-2"
                                        disabled={isLoading || (currentStep === 'clinic' && !isClinicAvailable)}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : continueButtonText}
                                        {!isLoading && currentStep !== 'complete' && (
                                            <ArrowRight className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showCloseConfirm} onOpenChange={handleCloseConfirm}>
                <DialogContent className="max-w-md rounded-[8px] border border-n-5 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-n-12">¿Salir del registro?</DialogTitle>
                    </DialogHeader>
                    <p className="text-[14px] text-n-7 mt-2">
                        Tu progreso está guardado. Podrás continuar cuando vuelvas a abrir ClinicBoard.
                    </p>
                    <DialogFooter className="mt-4 gap-2 flex-row-reverse sm:gap-2">
                        <Button
                            variant="default"
                            onClick={() => handleCloseConfirm(true)}
                            className="w-full sm:w-auto"
                        >
                            Salir
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleCloseConfirm(false)}
                            className="w-full sm:w-auto"
                        >
                            Continuar registro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}