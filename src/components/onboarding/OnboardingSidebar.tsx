'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingSidebarProps {
    currentStep: string;
    onStepChange: (stepId: string) => void;
    completedSteps: string[];
}

const steps = [
    { id: 'profile', label: 'Perfil' },
    { id: 'clinic', label: 'Clínica' },
    { id: 'location', label: 'Ubicación' },
    { id: 'complete', label: 'Completar' },
] as const;

export function OnboardingSidebar({
    currentStep,
    onStepChange,
    completedSteps,
}: OnboardingSidebarProps) {
    return (
        <nav className="w-64 border-r border-n-5 bg-n-1 flex flex-col">
            <div className="px-6 py-5 border-b border-n-5">
                <h2 className="text-base font-semibold text-foreground tracking-tight">
                    Configuración
                </h2>
                <p className="text-xs text-n-8 mt-1">
                    Paso {steps.findIndex((s) => s.id === currentStep) + 1} de {steps.length}
                </p>
            </div>

            <div className="flex-1 px-4 py-6">
                <ul className="space-y-1">
                    {steps.map((step) => {
                        const isCompleted = completedSteps.includes(step.id);
                        const isCurrent = currentStep === step.id;
                        const isPending = !isCompleted && !isCurrent;

                        return (
                            <li key={step.id}>
                                <button
                                    onClick={() => onStepChange(step.id)}
                                    disabled={isPending}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-left transition-all duration-200',
                                        isCurrent && 'bg-n-2 text-foreground font-medium hover:bg-n-3',
                                        isCompleted && 'text-b-8 hover:bg-n-3 cursor-pointer',
                                        isPending && 'text-n-8 cursor-not-allowed'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold transition-all duration-200',
                                            isCurrent && 'bg-b-8 text-white',
                                            isCompleted && 'bg-b-8 text-white',
                                            isPending && 'bg-n-3 text-n-8'
                                        )}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-3 h-3" strokeWidth={2.5} />
                                        ) : (
                                            steps.findIndex((s) => s.id === step.id) + 1
                                        )}
                                    </span>
                                    <span className="text-sm">{step.label}</span>
                                    {isCurrent && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-b-8" />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div className="px-6 py-4 border-t border-n-5">
                <p className="text-[11px] text-n-8">
                    Tu información se guarda automáticamente
                </p>
            </div>
        </nav>
    );
}