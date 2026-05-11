'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingStepProfile } from './OnboardingStepProfile';
import { OnboardingStepClinic } from './OnboardingStepClinic';
import { OnboardingStepLocation } from './OnboardingStepLocation';
import { OnboardingStepComplete } from './OnboardingStepComplete';
import type { ProfileStepData, ClinicStepData, LocationStepData } from '@/lib/schemas/onboarding';
import type { OnboardingStepProfileRef } from './OnboardingStepProfile';
import type { OnboardingStepClinicRef } from './OnboardingStepClinic';
import type { OnboardingStepLocationRef } from './OnboardingStepLocation';
import type { OnboardingStepCompleteRef } from './OnboardingStepComplete';
import { saveOnboardingState } from '@/lib/schemas/onboarding';

export interface OnboardingStepData {
    profile: ProfileStepData | null;
    clinic: ClinicStepData | null;
    location: LocationStepData | null;
    userId: string | null;
}

export interface OnboardingFeedProps {
    userId: string | null;
    initialData?: Partial<OnboardingStepData>;
    onComplete: (data: OnboardingStepData) => Promise<void>;
}

interface StepConfig {
    id: 'profile' | 'location' | 'clinic' | 'complete';
    title: string;
    description: string;
    visual?: string;
}

const steps: StepConfig[] = [
    {
        id: 'profile',
        title: 'Cuéntanos sobre ti',
        description: 'Este será tu perfil profesional en ClinicBoard. Comparte tu specialization y años de experiencia.',
        visual: 'Professional Profile',
    },
    {
        id: 'location',
        title: '¿Dónde está tu consultorio?',
        description: 'Indica la ubicación para que pacientes te encuentren fácilmente cerca de su zona.',
        visual: 'Location Setup',
    },
    {
        id: 'clinic',
        title: 'Nombra tu clínica',
        description: 'Elige un nombre único para identificar tu consultorio en la plataforma.',
        visual: 'Clinic Creation',
    },
    {
        id: 'complete',
        title: '¡Todo listo!',
        description: 'Revisa la información antes de continuar al tablero de ClinicBoard.',
        visual: 'Ready',
    },
];

type StepId = StepConfig['id'];

const pageVariants = {
    initial: { opacity: 0, y: 8 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

const pageTransition = {
    duration: 0.2,
    ease: 'easeOut' as const,
};

export function OnboardingFeed({ userId, initialData, onComplete }: OnboardingFeedProps) {
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
    const [isClinicAvailable, setIsClinicAvailable] = React.useState(true);

    const profileRef = React.useRef<OnboardingStepProfileRef>(null);
    const clinicRef = React.useRef<OnboardingStepClinicRef>(null);
    const locationRef = React.useRef<OnboardingStepLocationRef>(null);
    const completeRef = React.useRef<OnboardingStepCompleteRef>(null);

    const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
    const currentConfig = steps[currentStepIndex];
    const canGoBack = currentStepIndex > 0;

    const handleBack = () => {
        if (canGoBack) {
            setCurrentStep(steps[currentStepIndex - 1].id);
        }
    };

    const handleProfileSubmit = (data: ProfileStepData) => {
        const newState = { ...stepData, profile: data };
        setStepData(newState);
        setCurrentStep('location');
        if (userId) {
            saveOnboardingState({ userId, currentStep: 2, profile: data });
        }
    };

    const handleLocationSubmit = (data: LocationStepData) => {
        const newState = { ...stepData, location: data };
        setStepData(newState);
        setCurrentStep('clinic');
        if (userId) {
            saveOnboardingState({ userId, currentStep: 3, location: data });
        }
    };

    const handleClinicSubmit = (data: ClinicStepData) => {
        const newState = { ...stepData, clinic: data };
        setStepData(newState);
        setCurrentStep('complete');
        if (userId) {
            saveOnboardingState({ userId, currentStep: 4, clinic: data });
        }
    };

    const handleContinue = () => {
        switch (currentStep) {
            case 'profile':
                profileRef.current?.triggerSubmit();
                break;
            case 'location':
                locationRef.current?.triggerSubmit();
                break;
            case 'clinic':
                clinicRef.current?.triggerSubmit();
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
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al completar';
            if (errorMessage.includes('Sesión') || errorMessage.includes('401') || errorMessage.includes('inválida')) {
                router.push('/login?reason=session_expired');
                return;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const continueButtonText = currentStep === 'complete' ? 'Ir al Tablero' : 'Continuar';

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
            case 'location':
                return (
                    <OnboardingStepLocation
                        ref={locationRef}
                        defaultValues={stepData.location || undefined}
                        onSubmit={handleLocationSubmit}
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

    return (
        <div className="min-h-svh bg-n-1 flex">
            <aside className="w-1/2 bg-gradient-to-br from-b-9/10 via-n-2 to-n-2 border-r border-n-5 flex flex-col sticky top-0 h-svh">
                <div className="flex flex-col h-full p-12 lg:px-16 lg:py-12">
                    <div className="flex-1 flex flex-col justify-center">
                            <div className="mb-8">
                                <Image
                                    src="/brand/logo-mark.svg"
                                    alt="ClinicBoard"
                                    width={128}
                                    height={128}
                                    className="text-b-8 mb-6"
                                />

                            <h1 className="text-3xl lg:text-4xl font-semibold text-n-12 tracking-tight leading-tight mb-4">
                                {currentConfig.title}
                            </h1>
                            <p className="text-base text-n-8 leading-relaxed max-w-md">
                                {currentConfig.description}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 mb-8">
                            {steps.map((step, index) => {
                                const isCompleted = index < currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                return (
                                    <React.Fragment key={step.id}>
                                        <div className="flex items-center gap-2">
                                            <div className={`
                                                h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200
                                                ${isCompleted ? 'bg-b-8 text-n-1' : isCurrent ? 'bg-n-3 text-n-10 border-2 border-n-6' : 'bg-n-4 text-n-8'}
                                            `}>
                                                {isCompleted ? (
                                                    <Check className="h-4 w-4" />
                                                ) : (
                                                    <span className="text-sm font-medium">{index + 1}</span>
                                                )}
                                            </div>
                                            {index < steps.length - 1 && (
                                                <div className={`w-8 h-0.5 transition-all duration-200 ${isCompleted ? 'bg-b-8' : 'bg-n-4'}`} />
                                            )}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        <div className="space-y-3">
                            {canGoBack && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="justify-start gap-2 text-n-8 hover:text-n-12 hover:bg-n-3"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Volver
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="default"
                                onClick={handleContinue}
                                className="w-full gap-2 bg-b-8 hover:bg-b-9 active:scale-[0.98] transition-all"
                                disabled={
                                    isLoading ||
                                    (currentStep === 'clinic' && !isClinicAvailable)
                                }
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        {continueButtonText}
                                        {currentStep !== 'complete' && (
                                            <ArrowRight className="w-4 h-4" />
                                        )}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-n-4/50">
                        <p className="text-xs text-n-8">
                            Proteger tu información es nuestra prioridad. Tus datos están seguros con nosotros.
                        </p>
                    </div>
                </div>
            </aside>

            <main className="w-1/2 overflow-y-auto bg-n-2/50">
                <div className="flex flex-col h-full py-16 px-12 lg:px-20">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-full max-w-md">
                            {error && (
                                <div className="mb-6 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial="initial"
                                    animate="enter"
                                    exit="exit"
                                    variants={pageVariants}
                                    transition={pageTransition}
                                >
                                    {renderStepContent()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function clearOnboardingState(userId: string) {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(`onboarding_${userId}`);
    }
}
