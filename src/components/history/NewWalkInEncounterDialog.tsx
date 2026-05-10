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
import { Loader2, Stethoscope } from 'lucide-react';
import { PatientSearchField } from '@/components/patients/PatientSearchField';
import { APPOINTMENT_TYPES } from '@/lib/appointmentConstants';
import AlertConflict from '@/components/ui/AlertConflict';

interface NewWalkInEncounterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (encounterId: string) => void;
}

interface WalkInEncounterFormValues {
    patient_id: string;
    appointment_type: string;
    description: string;
}

export default function NewWalkInEncounterDialog({
    open,
    onOpenChange,
    onSuccess,
}: NewWalkInEncounterDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertError, setAlertError] = useState<string | null>(null);
    const { activeClinic } = useActiveClinic();

    const form = useForm<WalkInEncounterFormValues>({
        defaultValues: {
            patient_id: '',
            appointment_type: 'Consulta General',
            description: '',
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
            });

            if (result.error) {
                const rawError = result.error;

                let errorMsg: string;
                let details: string | null = null;

                if (typeof rawError === 'string') {
                    errorMsg = rawError;
                } else if (rawError !== null && typeof rawError === 'object') {
                    errorMsg = 'Error al iniciar la consulta';
                    details = (rawError as { details?: string }).details || null;
                } else {
                    errorMsg = 'Error al iniciar la consulta';
                }

                const isBlockingError = errorMsg.includes('ya tiene una cita activa') ||
                    errorMsg.includes('ya tiene una cita agendada');

                if (details) console.error('[startWalkInEncounter]', details);

                if (isBlockingError) {
                    setAlertError(errorMsg);
                } else {
                    toast.error(details ? `${errorMsg}\n(${details})` : errorMsg);
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
