'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface Step {
    number: number;
    label: string;
    description?: string;
}

interface OnboardingStepperProps {
    steps: Step[];
    currentStep: number;
    className?: string;
}

export function OnboardingStepper({ steps, currentStep, className }: OnboardingStepperProps) {
    return (
        <div className={cn('flex items-center justify-center gap-2', className)}>
            {steps.map((step, index) => {
                const isCompleted = step.number < currentStep;
                const isCurrent = step.number === currentStep;
                const isPending = step.number > currentStep;

                return (
                    <React.Fragment key={step.number}>
                        {/* Step Circle */}
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    'flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-semibold transition-all duration-300',
                                    isCompleted && 'bg-b-8 text-white',
                                    isCurrent && 'bg-b-8 text-white ring-4 ring-b-8/20',
                                    isPending && 'bg-n-3 text-n-8'
                                )}
                            >
                                {isCompleted ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    step.number
                                )}
                            </div>
                            {/* Label (hidden on mobile) */}
                            <span
                                className={cn(
                                    'text-[13px] font-medium hidden sm:block',
                                    isCompleted && 'text-b-8',
                                    isCurrent && 'text-foreground',
                                    isPending && 'text-n-8'
                                )}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    'flex-1 h-0.5 min-w-[24px] transition-all duration-300',
                                    step.number < currentStep ? 'bg-b-8' : 'bg-n-3'
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export const defaultOnboardingSteps: Step[] = [
    { number: 1, label: 'Perfil' },
    { number: 2, label: 'Clínica' },
    { number: 3, label: 'Ubicación' },
    { number: 4, label: 'Completar' },
];