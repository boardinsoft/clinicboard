'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createCondition } from '@/actions/conditions';
import { useActiveClinic } from '@/providers/ActiveClinicContext';
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import DiagnosisSearch from '@/components/clinical/DiagnosisSearch';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';

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
    const { activeClinic } = useActiveClinic();

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
                clinic_id: activeClinic?.id || '',
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
                        <FieldLabel>Código y Nombre CIE-10</FieldLabel>
                        <DiagnosisSearch
                            id="condition-cie10"
                            label=""
                            placeholder="Busque por código o nombre (ej: J45.9)..."
                            value={form.watch('code') && form.watch('code_display') ? `${form.watch('code')} — ${form.watch('code_display')}` : ''}
                            showBadge={!!(form.watch('code') && form.watch('code_display'))}
                            onClear={() => { form.setValue('code', ''); form.setValue('code_display', ''); }}
                            onChange={val => {
                                const [code, ...descParts] = val.split(' — ');
                                const desc = descParts.join(' — ');
                                form.setValue('code', code);
                                form.setValue('code_display', desc);
                            }}
                        />
                        <FieldError>{form.formState.errors.code?.message}</FieldError>
                    </Field>

                    <Field>
                        <FieldLabel>Fecha de inicio (opcional)</FieldLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className={cn(
                                        "flex h-10 w-full items-center justify-between rounded-md border border-n-5/40 bg-n-1 px-3 py-2 text-sm transition-all",
                                        !form.watch("onset_date") && "text-muted-foreground"
                                    )}
                                >
                                    {form.watch("onset_date") ? form.watch("onset_date") : "Seleccionar fecha"}
                                    <CalendarIcon className="h-4 w-4 text-n-8" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={form.watch("onset_date") ? new Date(form.watch("onset_date")!) : undefined}
                                    onSelect={(date) => {
                                        if (date) {
                                            form.setValue("onset_date", date.toISOString().split("T")[0])
                                        }
                                    }}
                                    className="rounded-md border"
                                    captionLayout="dropdown"
                                    disabled={(date) => date > new Date()}
                                />
                            </PopoverContent>
                        </Popover>
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