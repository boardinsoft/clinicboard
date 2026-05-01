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

export interface OnboardingStepClinicRef {
    triggerSubmit: () => void;
    isValid: boolean;
}

interface OnboardingStepClinicProps {
    defaultValues?: ClinicStepData;
    onSubmit: (data: ClinicStepData) => void;
    onAvailabilityChange?: (available: boolean) => void;
}

export const OnboardingStepClinic = forwardRef<OnboardingStepClinicRef, OnboardingStepClinicProps>(
    ({ defaultValues, onSubmit, onAvailabilityChange }, ref) => {
        const [availabilityStatus, setAvailabilityStatus] = React.useState<'checking' | 'available' | 'unavailable' | null>(null);
        const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);
        const [conflictMessage, setConflictMessage] = React.useState<string | null>(null);
        const [slugSuggestions, setSlugSuggestions] = React.useState<string[]>([]);

        React.useEffect(() => {
            if (onAvailabilityChange) {
                onAvailabilityChange(availabilityStatus === 'available');
            }
        }, [availabilityStatus, onAvailabilityChange]);

        const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
        const nameValueRef = useRef<string>('');

        const form = useForm<ClinicStepData>({
            resolver: zodResolver(clinicStepSchema),
            defaultValues: defaultValues || { name: '', slug: '' },
        });

        const isFormValid = form.formState.isValid;

        useImperativeHandle(ref, () => ({
            triggerSubmit: () => {
                if (availabilityStatus === 'unavailable') return;
                form.handleSubmit(onSubmit)();
            },
            get isValid() {
                return isFormValid && availabilityStatus !== 'unavailable';
            },
        }));

        const generateSlugSuggestions = useCallback((baseSlug: string): string[] => {
            const suggestions: string[] = [];
            if (baseSlug.length < 25) {
                suggestions.push(`${baseSlug}cl`);
            }
            suggestions.push(`${baseSlug}sa`);
            return suggestions.slice(0, 2);
        }, []);

        const handleNameChange = async (name: string) => {
            nameValueRef.current = name;

            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            if (name.length < 3) {
                setAvailabilityStatus(null);
                setConflictMessage(null);
                setSlugSuggestions([]);
                if (!slugManuallyEdited) {
                    form.setValue('slug', '');
                }
                return;
            }

            setAvailabilityStatus('checking');

            debounceTimerRef.current = setTimeout(async () => {
                const slug = generateSlug(name);
                const result = await checkSlugAvailability(slug, name);

                if (nameValueRef.current !== name) return;

                if (result.available) {
                    setAvailabilityStatus('available');
                    setConflictMessage(null);
                    if (!slugManuallyEdited) {
                        form.setValue('slug', slug);
                    }
                } else {
                    setAvailabilityStatus('unavailable');
                    if (result.conflict === 'name') {
                        setConflictMessage('Este nombre de clínica ya existe');
                    } else {
                        setConflictMessage('Esta URL ya está en uso');
                    }
                    setSlugSuggestions(generateSlugSuggestions(slug));
                    if (!slugManuallyEdited) {
                        form.setValue('slug', slug);
                    }
                }
            }, 400);
        };

        const handleSlugChange = (slug: string) => {
            setSlugManuallyEdited(true);
            const normalizedSlug = slug.toLowerCase();
            form.setValue('slug', normalizedSlug);
        };

        const handleSubmit = form.handleSubmit((data) => {
            if (availabilityStatus === 'unavailable') return;
            onSubmit(data);
        });

        const handleSuggestionClick = (suggestion: string) => {
            form.setValue('slug', suggestion);
            setSlugManuallyEdited(true);
        };

        const getIndicator = () => {
            if (availabilityStatus === 'checking') {
                return <Loader2 className="w-4 h-4 text-n-8 animate-spin" />;
            }
            if (availabilityStatus === 'available') {
                return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
            }
            if (availabilityStatus === 'unavailable') {
                return <CheckCircle2 className="w-4 h-4 text-destructive" />;
            }
            return null;
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
                                suffixIcon={getIndicator()}
                                onChange={(e) => {
                                    form.register('name').onChange(e);
                                    handleNameChange(e.target.value);
                                }}
                            />
                            {form.formState.errors.name && (
                                <FieldError className="text-[11px]">{form.formState.errors.name.message}</FieldError>
                            )}
                            {availabilityStatus === 'unavailable' && conflictMessage && (
                                <FieldError className="text-[11px]">{conflictMessage}</FieldError>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">URL de tu clínica</FieldLabel>
                            <div className="mt-1 flex items-center">
                                <Input
                                    {...form.register('slug')}
                                    placeholder="mi-clinica"
                                    className="flex-1 rounded-r-none rounded-l-[6px]"
                                    onChange={(e) => {
                                        form.register('slug').onChange(e);
                                        handleSlugChange(e.target.value);
                                    }}
                                />
                                <span className="text-[13px] text-n-8 bg-n-2 px-3 h-10 flex items-center border border-l-0 border-n-5 rounded-r-[6px]">
                                    .clinicboard.app
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                                {slugSuggestions.length > 0 && availabilityStatus === 'unavailable' && (
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