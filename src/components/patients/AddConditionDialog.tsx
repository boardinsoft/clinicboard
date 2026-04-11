'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createCondition } from '@/actions/conditions';
import type { Condition } from '@/types/database.types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';

const schema = z.object({
    code: z.string().min(1, 'El código es requerido'),
    code_display: z.string().min(1, 'El nombre de la condición es requerido'),
    onset_date: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddConditionDialogProps {
    patientId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (condition: Condition) => void;
}

export function AddConditionDialog({ patientId, open, onOpenChange, onSuccess }: AddConditionDialogProps) {
    const [saving, setSaving] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { code: '', code_display: '', onset_date: '' },
    });

    const onSubmit = async (values: FormValues) => {
        setSaving(true);
        try {
            const result = await createCondition({
                patient_id: patientId,
                code: values.code,
                code_display: values.code_display,
                onset_date: values.onset_date || undefined,
            });

            if (result.error) {
                toast.error('Error al agregar condición', {
                    description: typeof result.error === 'string' ? result.error : 'Verifica los datos ingresados.',
                });
                return;
            }

            toast.success('Condición agregada');
            onSuccess(result.data as Condition);
            onOpenChange(false);
            form.reset();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) form.reset(); } }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Agregar Condición Clínica</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <Field>
                        <FieldLabel >Código CIE-10</FieldLabel>
                        <InputGroup>
                            <InputGroupInput
                                placeholder="Ej. J45"
                                {...form.register('code')}
                            />
                        </InputGroup>
                        <FieldError>{form.formState.errors.code?.message}</FieldError>
                    </Field>

                    <Field>
                        <FieldLabel >Nombre de la condición</FieldLabel>
                        <InputGroup>
                            <InputGroupInput
                                placeholder="Ej. Asma bronquial"
                                {...form.register('code_display')}
                            />
                        </InputGroup>
                        <FieldError>{form.formState.errors.code_display?.message}</FieldError>
                    </Field>

                    <Field>
                        <FieldLabel>Fecha de inicio (opcional)</FieldLabel>
                        <InputGroup>
                            <InputGroupInput
                                type="date"
                                {...form.register('onset_date')}
                            />
                        </InputGroup>
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
                            {saving ? 'Guardando...' : 'Agregar Condición'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
