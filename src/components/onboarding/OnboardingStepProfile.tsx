'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useImperativeHandle } from 'react';
import { profileStepSchema, type ProfileStepData } from '@/lib/schemas/onboarding';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const SPECIALTIES = [
    'Medicina General',
    'Medicina Interna',
    'Pediatría',
    'Cirugía General',
    'Ginecología y Obstetricia',
    'Cardiología',
    'Dermatología',
    'Neurología',
    'Ortopedia',
    'Oftalmología',
    'Otorrinolaringología',
    'Psiquiatría',
    'Endocrinología',
    'Gastroenterología',
    'Neumología',
    'Oncología',
    'Urología',
    'Nefrología',
    'Reumatología',
    'Medicina Familiar',
    'Administración de Clínicas',
    'Otra',
];

const GENDERS = [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Femenino' },
    { value: 'other', label: 'Otro' },
    { value: 'unknown', label: 'Prefiero no decir' },
];

export interface OnboardingStepProfileRef {
    triggerSubmit: () => void;
}

interface OnboardingStepProfileProps {
    defaultValues?: ProfileStepData;
    onSubmit: (data: ProfileStepData) => void;
}

export const OnboardingStepProfile = forwardRef<OnboardingStepProfileRef, OnboardingStepProfileProps>(
    ({ defaultValues, onSubmit }, ref) => {
        const form = useForm<ProfileStepData>({
            resolver: zodResolver(profileStepSchema),
            defaultValues: defaultValues || { name_given: [''], name_family: '', specialty: '', gender: undefined, license_number: '' },
        });

        useImperativeHandle(ref, () => ({
            triggerSubmit: () => {
                form.handleSubmit(onSubmit)();
            },
        }));

        return (
            <Card className="card-clinic">
                <CardHeader>
                    <CardTitle>Cuéntanos sobre ti</CardTitle>
                    <CardDescription>Este será tu perfil profesional en ClinicBoard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <Field>
                                <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Nombres</FieldLabel>
                                <Input
                                    {...form.register('name_given.0')}
                                    placeholder="Juan Carlos"
                                    className="mt-1"
                                />
                                {form.formState.errors.name_given && (
                                    <FieldError className="text-[11px]">Ingresa al menos un nombre</FieldError>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Apellidos</FieldLabel>
                                <Input
                                    {...form.register('name_family')}
                                    placeholder="Pérez Medina"
                                    className="mt-1"
                                />
                                {form.formState.errors.name_family && (
                                    <FieldError className="text-[11px]">{form.formState.errors.name_family.message}</FieldError>
                                )}
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Especialidad (opcional)</FieldLabel>
                            <Select
                                value={form.watch('specialty') || ''}
                                onValueChange={(value) => form.setValue('specialty', value)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Selecciona una especialidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SPECIALTIES.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Matrícula MPPS (opcional)</FieldLabel>
                            <Input
                                {...form.register('license_number')}
                                placeholder="Ej: 25.456"
                                className="mt-1"
                            />
                            {form.formState.errors.license_number && (
                                <FieldError className="text-[11px]">{form.formState.errors.license_number.message}</FieldError>
                            )}
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-semibold tracking-wider text-n-8 uppercase">Género (opcional)</FieldLabel>
                            <div className="flex gap-2 mt-1">
                                {GENDERS.map((g) => (
                                    <label
                                        key={g.value}
                                        className={cn(
                                            'flex-1 flex items-center justify-center h-10 px-3 border border-n-5 rounded-[6px] cursor-pointer text-[13px] transition-all duration-200 hover:bg-n-3 focus:outline-none focus:ring-2 focus:ring-b-8/10',
                                            form.watch('gender') === g.value
                                                ? 'border-b-8 bg-b-8/10 text-foreground'
                                                : 'text-n-8'
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            {...form.register('gender')}
                                            value={g.value}
                                            className="sr-only"
                                        />
                                        {g.label}
                                    </label>
                                ))}
                            </div>
                        </Field>
                    </form>
                </CardContent>
            </Card>
        );
    }
);

OnboardingStepProfile.displayName = 'OnboardingStepProfile';