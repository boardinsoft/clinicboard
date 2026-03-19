'use client';

import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, User, Loader2, CheckCircle2, Zap } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { getPatients } from '@/actions/patients';
import { createWalkInAppointment } from '@/actions/appointments';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/fhir/types';

interface NewWalkInDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: () => void;
}

const APPOINTMENT_TYPES = [
    "Consulta General",
    "Control",
    "Primera Vez",
    "Seguimiento",
    "Emergencia"
];

export default function NewWalkInDialog({
    open,
    onOpenChange,
    onCreated
}: NewWalkInDialogProps) {
    const [patientQuery, setPatientQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const debouncedQuery = useDebounce(patientQuery, 300);

    const form = useForm({
        defaultValues: {
            patient_id: '',
            appointment_type: 'Consulta General',
            description: '',
        }
    });

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

    const onSubmit = async (values: any) => {
        if (!values.patient_id) {
            toast.error('Selecciona un paciente');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createWalkInAppointment({
                patient_id: values.patient_id,
                appointment_type: values.appointment_type,
                description: values.description
            });
            
            if (result.error) {
                toast.error('Error al registrar llegada');
                console.error(result.error);
            } else {
                toast.success('Paciente registrado en cola');
                form.reset();
                setPatientQuery('');
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
                                <FormItem className="relative">
                                    <FormLabel>Paciente</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por nombre o CI..."
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
                                    
                                    {patients.length > 0 && !selectedPatientId && (
                                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-xl max-h-48 overflow-y-auto">
                                            {patients.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className="w-full px-4 py-2.5 text-left hover:bg-accent flex items-center gap-3"
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
                                                        <span className="text-sm font-semibold truncate">
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

                                    {selectedPatientId && (
                                        <div className="flex items-center justify-between p-2 mt-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                <span className="text-xs font-bold text-emerald-700">Paciente Seleccionado</span>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 text-[10px]"
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
                                    <Zap className="mr-2 h-4 w-4" />
                                )}
                                Registrar en Cola
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
