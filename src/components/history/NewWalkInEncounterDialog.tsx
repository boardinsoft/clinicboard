'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { startWalkInEncounter } from '@/actions/encounters';
import { useActiveClinic } from '@/providers/ActiveClinicContext';
import { Loader2, Stethoscope, Zap, ClipboardList } from 'lucide-react';
import { PatientSearchField } from '@/components/patients/PatientSearchField';
import { APPOINTMENT_TYPES } from '@/lib/appointmentConstants';
import AlertConflict from '@/components/ui/AlertConflict';
import SameDayDuplicateConfirm from '@/components/ui/SameDayDuplicateConfirm';

interface NewWalkInEncounterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (encounterId: string) => void;
}

interface WalkInEncounterFormValues {
    patient_id: string;
    appointment_type: string;
    description: string;
    workflow_type: 'quick' | 'with-evaluation';
}

export default function NewWalkInEncounterDialog({
    open,
    onOpenChange,
    onSuccess,
}: NewWalkInEncounterDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertError, setAlertError] = useState<string | null>(null);
    const [duplicateConfirm, setDuplicateConfirm] = useState<{ open: boolean; previousTime: string | null }>({ open: false, previousTime: null });
    const { activeClinic } = useActiveClinic();

    const form = useForm<WalkInEncounterFormValues>({
        defaultValues: {
            patient_id: '',
            appointment_type: 'Consulta General',
            description: '',
            workflow_type: 'quick',
        },
    });

    const onSubmit = async (values: WalkInEncounterFormValues) => {
        if (!values.patient_id) {
            toast.error('Selecciona un paciente');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await startWalkInEncounter({
                patient_id: values.patient_id,
                appointment_type: values.appointment_type,
                description: values.description,
                clinic_id: activeClinic?.id || '',
                workflow_type: values.workflow_type,
            });

            if (result.error) {
                const rawError = result.error;

                if (typeof rawError === 'object' && rawError !== null && 'error' in rawError && (rawError as any).error === 'duplicate_same_day') {
                    setDuplicateConfirm({
                        open: true,
                        previousTime: (rawError as any).previousEncounterTime || null,
                    });
                    return;
                }

                let errorMsg: string;
                let details: string | null = null;

                if (typeof rawError === 'string') {
                    errorMsg = rawError;
                } else {
                    errorMsg = 'Error al iniciar la consulta';
                    details = (rawError as { details?: string }).details || null;
                }

                const isBlockingError = errorMsg.includes('ya tiene una cita activa') ||
                    errorMsg.includes('ya tiene una cita agendada');

                if (details) console.error('[startWalkInEncounter]', details);

                if (isBlockingError) {
                    setAlertError(errorMsg);
                } else {
                    toast.error(errorMsg, { description: details ?? undefined });
                }
            } else {
                toast.success('Consulta iniciada');
                form.reset();
                onSuccess(result.data!.encounter.id);
                onOpenChange(false);
            }
        } catch (err) {
            toast.error('Ocurrió un error inesperado');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <AlertConflict
                open={!!alertError}
                onOpenChange={(open) => { if (!open) setAlertError(null); }}
                message={alertError}
            />

            <SameDayDuplicateConfirm
                open={duplicateConfirm.open}
                onOpenChange={(open) => { if (!open) setDuplicateConfirm({ open: false, previousTime: null }); }}
                previousEncounterTime={duplicateConfirm.previousTime}
                onConfirm={async () => {
                    const values = form.getValues();
                    if (!values.patient_id) return;

                    setIsSubmitting(true);
                    try {
                        const result = await startWalkInEncounter({
                            patient_id: values.patient_id,
                            appointment_type: values.appointment_type,
                            description: values.description,
                            clinic_id: activeClinic?.id || '',
                            workflow_type: values.workflow_type,
                            force_create: true,
                        });

                        if (result.error) {
                            toast.error(typeof result.error === 'string' ? result.error : 'Error al iniciar la consulta');
                        } else {
                            toast.success('Consulta iniciada');
                            form.reset();
                            onSuccess(result.data!.encounter.id);
                            onOpenChange(false);
                        }
                    } catch (err) {
                        toast.error('Ocurrió un error inesperado');
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            />

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-full bg-b-1 flex items-center justify-center text-b-8 mb-2">
                            <Stethoscope className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-xl font-bold">Nueva Consulta sin Cita</DialogTitle>
                        <DialogDescription>
                            Inicia una consulta para un paciente que llega a la clínica sin cita previa.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                            <FormField
                                control={form.control}
                                name="patient_id"
                                render={({ field }) => (
                                    <PatientSearchField
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="appointment_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Servicio</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Selecciona un tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {APPOINTMENT_TYPES.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Observaciones</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Breve motivo de la llegada..."
                                                className="resize-none min-h-[60px] text-sm"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="workflow_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Consulta</FormLabel>
                                        <div className="flex gap-2 pt-1">
                                            <Button
                                                type="button"
                                                variant={field.value === 'quick' ? 'default' : 'outline'}
                                                size="sm"
                                                className={`flex-1 gap-2 ${field.value === 'quick' ? 'bg-b-8 hover:bg-b-9 shadow-lg shadow-b-8/20' : ''}`}
                                                onClick={() => field.onChange('quick')}
                                            >
                                                <Zap className="w-4 h-4" />
                                                Rápida
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={field.value === 'with-evaluation' ? 'default' : 'outline'}
                                                size="sm"
                                                className={`flex-1 gap-2 ${field.value === 'with-evaluation' ? 'bg-b-8 hover:bg-b-9 shadow-lg shadow-b-8/20' : ''}`}
                                                onClick={() => field.onChange('with-evaluation')}
                                            >
                                                <ClipboardList className="w-4 h-4" />
                                                Con Evaluación
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {field.value === 'quick'
                                                ? 'Para consultas simples sin triage previo.'
                                                : 'Para casos que requieren evaluación/triage.'}
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="h-9 px-6"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-9 px-8 bg-b-8 hover:bg-b-9 shadow-lg shadow-b-8/20"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Stethoscope className="mr-2 h-4 w-4" />
                                    )}
                                    Iniciar Consulta
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}
