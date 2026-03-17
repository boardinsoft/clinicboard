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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, User, Calendar, Clock, Loader2, CheckCircle2, Plus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { getPatients } from '@/actions/patients';
import { createAppointment } from '@/actions/appointments';
import { appointmentSchema, type AppointmentSchemaType } from '@/lib/schemas/appointment.schema';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/fhir/types';
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
    const [patientQuery, setPatientQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const debouncedQuery = useDebounce(patientQuery, 300);

    // Initial times (today, now + 30min)
    const getDefaultTimes = () => {
        const start = nowInVE();
        start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
        
        // Format for input datetime-local: YYYY-MM-DDTHH:mm
        const format = (d: Date) => {
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        
        return { start: format(start), end: format(end) };
    };

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(nowInVE());
    const [selectedTime, setSelectedTime] = useState<string | null>(() => {
        const now = nowInVE();
        now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
        return format(now, 'hh:mm aa');
    });

    const defaultTimes = getDefaultTimes();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const form = useForm<any>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(appointmentSchema) as unknown as any,
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

    // Patient search effect
    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setPatients([]);
            return;
        }

        const search = async () => {
            setIsSearching(true);
            try {
                const result = await getPatients(debouncedQuery);
                setPatients((result.data as unknown as Patient[]) || []);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSearching(false);
            }
        };

        search();
    }, [debouncedQuery]);

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
                toast.error('Error al crear la cita');
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

    const selectedPatientId = form.watch('patient_id');

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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
                        {/* Patient Search */}
                        <FormField
                            control={form.control}
                            name="patient_id"
                            render={({ field }) => (
                                <FormItem className="relative">
                                    <FormLabel>Paciente</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por nombre o apellido..."
                                                className="pl-9"
                                                value={patientQuery}
                                                onChange={(e) => setPatientQuery(e.target.value)}
                                                autoComplete="off"
                                            />
                                            {isSearching && (
                                                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />
                                            )}
                                        </div>
                                    </FormControl>
                                    
                                    {/* Search Results Dropdown */}
                                    {patients.length > 0 && !selectedPatientId && (
                                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-xl max-h-48 overflow-y-auto">
                                            {patients.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className="w-full px-4 py-2.5 text-left hover:bg-accent flex items-center gap-3 transition-colors"
                                                    onClick={() => {
                                                        field.onChange(p.id);
                                                        setPatientQuery(`${p.name_family}, ${p.name_given?.join(' ')}`);
                                                        setPatients([]);
                                                    }}
                                                >
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs shrink-0">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-semibold truncate capitalize">
                                                            {p.name_family}, {p.name_given?.join(' ')}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            {p.identifiers?.[0]?.value || 'Sin CI'}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Selected Patient Feedback */}
                                    {selectedPatientId && (
                                        <div className="flex items-center justify-between p-2 mt-2 bg-primary/5 border border-primary/20 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                                <span className="text-xs font-bold text-primary">Paciente Seleccionado</span>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 text-[10px] text-muted-foreground hover:text-destructive"
                                                onClick={() => {
                                                    field.onChange('');
                                                    setPatientQuery('');
                                                }}
                                            >
                                                Cambiar
                                            </Button>
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date and Time Selection */}
                        <div className="space-y-3">
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
                            <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground bg-muted/20 p-2 rounded border border-dashed">
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

                        {/* Appointment Type */}
                        <FormField
                            control={form.control}
                            name="appointment_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Cita</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-9 text-sm">
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
                                            className="resize-none min-h-[80px] text-sm"
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
                                className={cn("h-9 px-8 shadow-lg shadow-primary/20", isSubmitting && "opacity-80")}
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
