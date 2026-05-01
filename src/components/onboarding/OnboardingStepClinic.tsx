'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { clinicStepSchema, generateSlug, type ClinicStepData } from '@/lib/schemas/onboarding';
import { checkSlugAvailability } from '@/actions/onboarding';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface OnboardingStepClinicRef {
    triggerSubmit: () => void;
    isValid: boolean;
}

interface OnboardingStepClinicProps {
    defaultValues?: ClinicStepData;
    onSubmit: (data: ClinicStepData) => void;
}

export const OnboardingStepClinic = forwardRef<OnboardingStepClinicRef, OnboardingStepClinicProps>(
    ({ defaultValues, onSubmit }, ref) => {
        const [slugAvailable, setSlugAvailable] = React.useState<boolean | null>(null);
        const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);
        const [isCheckingSlug, setIsCheckingSlug] = React.useState(false);
        const [slugSuggestions, setSlugSuggestions] = React.useState<string[]>([]);

        const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

        const form = useForm<ClinicStepData>({
            resolver: zodResolver(clinicStepSchema),
            defaultValues: defaultValues || { name: '', slug: '' },
        });

        const isFormValid = form.formState.isValid;

        useImperativeHandle(ref, () => ({
            triggerSubmit: () => {
                if (slugAvailable === false) return;
                form.handleSubmit(onSubmit)();
            },
            get isValid() {
                return isFormValid && slugAvailable !== false;
            },
        }));

        const handleClinicNameChange = (name: string) => {
            if (!slugManuallyEdited) {
                const slug = generateSlug(name);
                form.setValue('slug', slug);
                setSlugAvailable(null);
                setSlugSuggestions([]);
            }
        };

        const generateSlugSuggestions = useCallback((baseSlug: string): string[] => {
            const suggestions: string[] = [];
            const timestamp = Date.now().toString().slice(-4);

            if (baseSlug.length < 25) {
                suggestions.push(`${baseSlug}-1`);
            }
            suggestions.push(`${baseSlug}-${timestamp}`);

            return suggestions.slice(0, 2);
        }, []);

        const handleSlugChange = async (slug: string) => {
            setSlugManuallyEdited(true);
            const normalizedSlug = slug.toLowerCase();
            form.setValue('slug', normalizedSlug);

            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            if (normalizedSlug.length < 3) {
                setSlugAvailable(null);
                setSlugSuggestions([]);
                setIsCheckingSlug(false);
                return;
            }

            setIsCheckingSlug(true);
            setSlugSuggestions([]);

            debounceTimerRef.current = setTimeout(async () => {
                const result = await checkSlugAvailability(normalizedSlug);

                if (result.available) {
                    setSlugAvailable(true);
                    setSlugSuggestions([]);
                } else {
                    setSlugAvailable(false);
                    setSlugSuggestions(generateSlugSuggestions(normalizedSlug));
                }
                setIsCheckingSlug(false);
            }, 400);
        };

        const handleSubmit = form.handleSubmit((data) => {
            if (slugAvailable === false) {
                return;
            }
            onSubmit(data);
        });

        const handleSuggestionClick = (suggestion: string) => {
            form.setValue('slug', suggestion);
            setSlugAvailable(true);
            setSlugSuggestions([]);
            setSlugManuallyEdited(true);
        };

        return (
            <Card className="card-clinic">
                <CardHeader>
                    <CardTitle>Nombre tu clínica</CardTitle>
                    <CardDescription>Elige un nombre único para identificar tu consultorio</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="clinic-form" onSubmit={handleSubmit} className="space-y-5">
                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Nombre de la clínica</FieldLabel>
                            <Input
                                {...form.register('name')}
                                placeholder="ej. Clínica San Rafael"
                                className="mt-1"
                                onChange={(e) => {
                                    form.register('name').onChange(e);
                                    handleClinicNameChange(e.target.value);
                                }}
                            />
                            {form.formState.errors.name && (
                                <FieldError className="text-[11px]">{form.formState.errors.name.message}</FieldError>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">URL de tu clínica</FieldLabel>
                            <div className="mt-1 flex items-center">
                                <span className="text-[13px] text-n-8 bg-n-2 px-3 h-10 flex items-center border border-r-0 border-n-5 rounded-l-[6px]">
                                    clinicboard.app/
                                </span>
                                <Input
                                    {...form.register('slug')}
                                    placeholder="mi-clinica"
                                    className="flex-1 rounded-l-none rounded-r-[6px] border-l-0"
                                    onChange={(e) => {
                                        form.register('slug').onChange(e);
                                        handleSlugChange(e.target.value);
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center gap-1">
                                    {isCheckingSlug ? (
                                        <span className="text-[11px] text-n-8 flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                                        </span>
                                    ) : slugAvailable === true ? (
                                        <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Disponible
                                        </span>
                                    ) : slugAvailable === false ? (
                                        <span className="text-[11px] text-destructive flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> No disponible
                                        </span>
                                    ) : null}
                                </div>
                                {slugSuggestions.length > 0 && (
                                    <div className="flex items-center gap-2 text-[11px] text-n-8">
                                        <span>Prueba con:</span>
                                        {slugSuggestions.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="text-b-8 hover:text-b-7 underline hover:no-underline"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {form.formState.errors.slug && (
                                <FieldError className="text-[11px]">{form.formState.errors.slug.message}</FieldError>
                            )}
                        </Field>
                    </form>
                </CardContent>
            </Card>
        );
    }
);

OnboardingStepClinic.displayName = 'OnboardingStepClinic';