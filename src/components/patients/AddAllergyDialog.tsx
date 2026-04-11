'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createAllergy } from '@/actions/allergies';
import type { AllergyIntolerance } from '@/types/database.types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const CATEGORIES = [
    { value: 'food', label: 'Alimentaria' },
    { value: 'medication', label: 'Medicamento' },
    { value: 'environment', label: 'Ambiental' },
    { value: 'biologic', label: 'Biológico' },
] as const;

const schema = z.object({
    code: z.string().min(1, 'El código es requerido'),
    code_display: z.string().min(1, 'El nombre del alérgeno es requerido'),
    allergy_type: z.enum(['allergy', 'intolerance']),
    category: z.array(z.enum(['food', 'medication', 'environment', 'biologic'])).min(1, 'Selecciona al menos una categoría'),
    criticality: z.enum(['low', 'high', 'unable-to-assess']).optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddAllergyDialogProps {
    patientId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (allergy: AllergyIntolerance) => void;
}

export function AddAllergyDialog({ patientId, open, onOpenChange, onSuccess }: AddAllergyDialogProps) {
    const [saving, setSaving] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            code: '',
            code_display: '',
            allergy_type: 'allergy',
            category: [],
            criticality: undefined,
        },
    });

    const onSubmit = async (values: FormValues) => {
        setSaving(true);
        try {
            const result = await createAllergy({
                patient_id: patientId,
                code: values.code,
                code_display: values.code_display,
                allergy_type: values.allergy_type,
                category: values.category,
                criticality: values.criticality,
            });

            if (result.error) {
                toast.error('Error al agregar alergia', {
                    description: typeof result.error === 'string' ? result.error : 'Verifica los datos ingresados.',
                });
                return;
            }

            toast.success('Alergia registrada');
            onSuccess(result.data as AllergyIntolerance);
            onOpenChange(false);
            form.reset();
        } finally {
            setSaving(false);
        }
    };

    const selectedCategories = form.watch('category');

    const toggleCategory = (value: 'food' | 'medication' | 'environment' | 'biologic') => {
        const current = form.getValues('category');
        if (current.includes(value)) {
            form.setValue('category', current.filter(c => c !== value), { shouldValidate: true });
        } else {
            form.setValue('category', [...current, value], { shouldValidate: true });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) form.reset(); } }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Registrar Alergia / Intolerancia</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <Field>
                        <FieldLabel >Código / Sustancia</FieldLabel>
                        <InputGroup>
                            <InputGroupInput
                                placeholder="Ej. penicilina"
                                {...form.register('code')}
                            />
                        </InputGroup>
                        <FieldError>{form.formState.errors.code?.message}</FieldError>
                    </Field>

                    <Field>
                        <FieldLabel >Nombre del alérgeno</FieldLabel>
                        <InputGroup>
                            <InputGroupInput
                                placeholder="Ej. Penicilina G"
                                {...form.register('code_display')}
                            />
                        </InputGroup>
                        <FieldError>{form.formState.errors.code_display?.message}</FieldError>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel>Tipo</FieldLabel>
                            <Controller
                                control={form.control}
                                name="allergy_type"
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="allergy">Alergia</SelectItem>
                                            <SelectItem value="intolerance">Intolerancia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </Field>

                        <Field>
                            <FieldLabel>Criticidad</FieldLabel>
                            <Controller
                                control={form.control}
                                name="criticality"
                                render={({ field }) => (
                                    <Select
                                        value={field.value ?? ''}
                                        onValueChange={(v) => field.onChange(v || undefined)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Opcional" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Baja</SelectItem>
                                            <SelectItem value="high">Alta</SelectItem>
                                            <SelectItem value="unable-to-assess">No evaluable</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </Field>
                    </div>

                    <Field>
                        <FieldLabel >Categoría</FieldLabel>
                        <div className="flex flex-wrap gap-3 pt-1">
                            {CATEGORIES.map(cat => (
                                <div key={cat.value} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`cat-${cat.value}`}
                                        checked={selectedCategories.includes(cat.value)}
                                        onCheckedChange={() => toggleCategory(cat.value)}
                                    />
                                    <Label htmlFor={`cat-${cat.value}`} className="font-normal cursor-pointer">
                                        {cat.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        <FieldError>{form.formState.errors.category?.message}</FieldError>
                    </Field>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => { onOpenChange(false); form.reset(); }}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Guardando...' : 'Registrar Alergia'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
