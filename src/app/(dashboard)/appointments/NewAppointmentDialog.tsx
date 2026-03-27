'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar, Clock, Loader2, Plus } from 'lucide-react';
import { createAppointment } from '@/actions/appointments';
import { appointmentSchema, type AppointmentSchemaType } from '@/lib/schemas/appointment.schema';
import { cn } from '@/lib/utils';
import { PatientSearchField } from '@/components/patients/PatientSearchField';
import { nowInVE } from '@/lib/date-utils';
import { AppointmentPicker } from '@/components/ui/appointment-picker';
import { format, parse } from 'date-fns';

interface NewAppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: () => void;
}

const APPOINTMENT_TYPES = [
    "Consulta General",
    "Control",
    "Primera Vez",
    "Seguimiento",
    "Segunda Opinión",
    "Emergencia",
    "Telemedicina"
];

export default function NewAppointmentDialog({
    open,
    onOpenChange,
    onCreated
}: NewAppointmentDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial times (today, now + 30min)
    const getDefaultTimes = () => {
        const start = nowInVE();
        start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
        
        // Format for input datetime-local: YYYY-MM-DDTHH:mm
        const formatStr = (d: Date) => {
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        
        return { start: formatStr(start), end: formatStr(end) };
    };

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(nowInVE());
    const [selectedTime, setSelectedTime] = useState<string | null>(() => {
        const now = nowInVE();
        now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
        return format(now, 'hh:mm aa');
    });

    const defaultTimes = getDefaultTimes();

    const form = useForm<AppointmentSchemaType>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            patient_id: '',
            practitioner_id: '00000000-0000-0000-0000-000000000000',
            appointment_type: 'Consulta General',
            start_time: defaultTimes.start,
            end_time: defaultTimes.end,
            description: '',
            status: 'proposed'
        }
    });

    // Sync picker with form
    useEffect(() => {
        if (selectedDate && selectedTime) {
            try {
                const datePart = format(selectedDate, 'yyyy-MM-dd');
                const timePart = format(parse(selectedTime, 'hh:mm aa', new Date()), 'HH:mm');
                const dateTime = `${datePart}T${timePart}`;
                
                form.setValue('start_time', dateTime);
                
                // Default end time (30 mins after start)
                const start = new Date(dateTime);
                const end = new Date(start.getTime() + 30 * 60000);
                const endDateTime = `${format(end, 'yyyy-MM-dd')}T${format(end, 'HH:mm')}`;
                form.setValue('end_time', endDateTime);
            } catch (e) {
                console.error('Error parsing date/time for form', e);
            }
        }
    }, [selectedDate, selectedTime, form]);


    const onSubmit = async (values: AppointmentSchemaType) => {
        setIsSubmitting(true);
        try {
            // Convert to ISO string for backend
            const payload = {
                ...values,
                start_time: new Date(values.start_time).toISOString(),
                end_time: new Date(values.end_time).toISOString(),
            };

            const result = await createAppointment(payload);
            
            if (result.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Error al crear la cita');
                console.error(result.error);
            } else {
                toast.success('Cita agendada exitosamente');
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Nueva Cita</DialogTitle>
                    <DialogDescription>
                        Completa los datos para agendar un nuevo encuentro médico.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
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

                        {/* Date and Time Selection */}
                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                Programación de la Cita
                            </Label>
                            <AppointmentPicker 
                                date={selectedDate}
                                onDateChange={setSelectedDate}
                                time={selectedTime}
                                onTimeChange={setSelectedTime}
                                className="w-full"
                            />
                            <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-dashed border-muted-foreground/20">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-primary" />
                                    <span>Duración estimada: <strong>30 minutos</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 border-l pl-4 border-muted">
                                    <Calendar className="w-3 h-3 text-primary" />
                                    <span>Zona Horaria: <strong>Venezuela (GMT-4)</strong></span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Appointment Type */}
                            <FormField
                                control={form.control}
                                name="appointment_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Cita</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-10 text-sm">
                                                    <SelectValue placeholder="Selecciona un tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {APPOINTMENT_TYPES.map(type => (
                                                    <SelectItem key={type} value={type} className="text-sm">
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status (Hidden or read-only for new appointments usually) */}
                        </div>

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motivo / Observaciones</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Detalles adicionales opcionales..." 
                                            className="resize-none min-h-[100px] text-sm focus-visible:ring-primary/30"
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4 border-t border-muted-foreground/10 bg-muted/5 -mx-6 px-6 -mb-2">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => onOpenChange(false)}
                                className="h-10 px-6"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className={cn("h-10 px-8 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95", isSubmitting && "opacity-80")}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                Agendar Cita
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
