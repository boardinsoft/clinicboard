'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useImperativeHandle } from 'react';
import { locationStepSchema, VENEZUELA_STATES, VENEZUELA_CITIES, type LocationStepData } from '@/lib/schemas/onboarding';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface OnboardingStepLocationRef {
    triggerSubmit: () => void;
}

interface OnboardingStepLocationProps {
    defaultValues?: LocationStepData;
    onSubmit: (data: LocationStepData) => void;
}

export const OnboardingStepLocation = forwardRef<OnboardingStepLocationRef, OnboardingStepLocationProps>(
    ({ defaultValues, onSubmit }, ref) => {
        const form = useForm<LocationStepData>({
            resolver: zodResolver(locationStepSchema),
            defaultValues: defaultValues || { state: '' as any, city: '' as any, address: '', phone: '' },
        });

        const watchedState = form.watch('state');
        const cities = watchedState ? VENEZUELA_CITIES[watchedState] || [] : [];

        useImperativeHandle(ref, () => ({
            triggerSubmit: () => {
                form.handleSubmit(onSubmit)();
            },
        }));

        const handleStateChange = (value: string) => {
            form.setValue('state', value as typeof VENEZUELA_STATES[number]);
            form.setValue('city', '' as any);
        };

        const handleSubmit = form.handleSubmit((data) => {
            onSubmit(data);
        });

        return (
            <Card className="card-clinic">
                <CardHeader>
                    <CardTitle>Ubicación de tu clínica</CardTitle>
                    <CardDescription>Ayuda a tus pacientes a encontrarte</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="location-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <Field>
                                <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Estado</FieldLabel>
                                <Select
                                    value={form.watch('state') || ''}
                                    onValueChange={handleStateChange}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selecciona un estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {VENEZUELA_STATES.map((state) => (
                                            <SelectItem key={state} value={state}>{state}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.state && (
                                    <FieldError className="text-[11px]">{form.formState.errors.state.message}</FieldError>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Ciudad</FieldLabel>
                                <Select
                                    value={form.watch('city') || ''}
                                    onValueChange={(value) => form.setValue('city', value as any)}
                                    disabled={!watchedState}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder={watchedState ? 'Selecciona una ciudad' : 'Primero selecciona un estado'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map((city) => (
                                            <SelectItem key={city} value={city}>{city}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.city && (
                                    <FieldError className="text-[11px]">{form.formState.errors.city.message}</FieldError>
                                )}
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Dirección (opcional)</FieldLabel>
                            <Input
                                {...form.register('address')}
                                placeholder="Av. Libertador #123, Torre Empresarial, Piso 3"
                                className="mt-1"
                            />
                            {form.formState.errors.address && (
                                <FieldError className="text-[11px]">{form.formState.errors.address.message}</FieldError>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Teléfono de contacto</FieldLabel>
                            <Input
                                {...form.register('phone')}
                                placeholder="+58 212-555-1234"
                                className="mt-1"
                            />
                            {form.formState.errors.phone && (
                                <FieldError className="text-[11px]">{form.formState.errors.phone.message}</FieldError>
                            )}
                        </Field>
                    </form>
                </CardContent>
            </Card>
        );
    }
);

OnboardingStepLocation.displayName = 'OnboardingStepLocation';