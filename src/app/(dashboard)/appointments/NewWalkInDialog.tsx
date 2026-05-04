'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription,
    DialogFooter
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
import {
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { createWalkInAppointment } from '@/actions/appointments';
import { useActiveClinic } from '@/providers/ActiveClinicContext';
import { Loader2, Zap } from 'lucide-react';
import { PatientSearchField } from '@/components/patients/PatientSearchField';
import { APPOINTMENT_TYPES } from '@/lib/appointmentConstants';
import AlertConflict from '@/components/ui/AlertConflict';

interface NewWalkInDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: () => void;
}

interface WalkInFormValues {
    patient_id: string;
    appointment_type: string;
    description: string;
}

export default function NewWalkInDialog({
    open,
    onOpenChange,
    onCreated
}: NewWalkInDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertError, setAlertError] = useState<string | null>(null);
    const { activeClinic } = useActiveClinic();

    const form = useForm<WalkInFormValues>({
        defaultValues: {
            patient_id: '',
            appointment_type: 'Consulta General',
            description: '',
        }
    });


    const onSubmit = async (values: WalkInFormValues) => {
        if (!values.patient_id) {
            toast.error('Selecciona un paciente');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createWalkInAppointment({
                patient_id: values.patient_id,
                appointment_type: values.appointment_type,
                description: values.description,
                clinic_id: activeClinic?.id || ''
            });
            
            if (result.error) {
                const errorMsg = typeof result.error === 'string' ? result.error : 'Error al registrar llegada';
                const isBlockingError = typeof result.error === 'string' && (
                    result.error.includes('ya tiene una cita activa') || 
                    result.error.includes('ya tiene una cita agendada')
                );

                if (isBlockingError) {
                    setAlertError(result.error as string);
                } else {
                    toast.error(errorMsg);
                }
                console.error(result.error);
            } else {
                toast.success('Paciente registrado en cola');
                form.reset();
                onCreated();
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
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-2">
                        <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <DialogTitle className="text-xl font-bold">Registro por Orden de Llegada</DialogTitle>
                    <DialogDescription>
                        Registra a un paciente que acaba de llegar a la clínica sin cita previa.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        {/* Patient Search */}
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
                                className="h-9 px-8 bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <div className="mr-2 h-4 w-4 flex items-center justify-center">
                                       <div className="w-1 h-3 bg-white rounded-full" />
                                    </div>
                                )}
                                Registrar en Cola
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        </>
    );
}
