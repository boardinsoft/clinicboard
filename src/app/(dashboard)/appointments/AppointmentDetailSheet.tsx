'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
    User, 
    Calendar, 
    Clock, 
    FileText, 
    Stethoscope, 
    XCircle, 
    CheckCircle2, 
    AlertCircle,
    ClipboardCheck,
    Phone,
    CreditCard,
    RotateCcw,
    History,
    Loader2
} from 'lucide-react';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import {
    Label
} from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { calcAge, getGenderLabel } from '@/lib/clinical';
import { formatTime, formatDate, nowInVE, formatRelativeTime, formatDuration } from '@/lib/date-utils';
import { 
    confirmAppointment,
    cancelAppointment, 
    markArrived, 
    markNoShow, 
    rescheduleAppointment,
    startConsultationFromAppointment
} from '@/actions/appointments';
import { AppointmentPicker } from '@/components/ui/appointment-picker';
import { format, parse } from 'date-fns';
import { 
    isWithinCheckinWindow, 
    isEligibleForNoShow, 
    getAppointmentTemporalLabel 
} from '@/lib/appointments/appointment-rules';
import type { Appointment, AppointmentStatus } from '@/lib/fhir/types';

interface AppointmentDetailSheetProps {
    appointment: Appointment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAction: () => void;
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
    proposed: { label: 'Propuesta', variant: 'outline', color: 'text-slate-500' },
    pending: { label: 'Pendiente', variant: 'outline', color: 'text-amber-500' },
    booked: { label: 'Confirmada', variant: 'secondary', color: 'text-blue-600 bg-blue-50' },
    arrived: { label: 'En Espera', variant: 'default', color: 'bg-orange-500 hover:bg-orange-600' },
    fulfilled: { label: 'Completada', variant: 'secondary', color: 'text-emerald-700 bg-emerald-50' },
    cancelled: { label: 'Cancelada', variant: 'destructive', color: '' },
    noshow: { label: 'No asistió', variant: 'outline', color: 'text-red-400' },
};

export default function AppointmentDetailSheet({
    appointment,
    open,
    onOpenChange,
    onAction
}: AppointmentDetailSheetProps) {
    const router = useRouter();
    const [isPending, setIsPending] = React.useState(false);
    const [showCancelAlert, setShowCancelAlert] = React.useState(false);
    const [cancelReason, setCancelReason] = React.useState('');
    const [rescheduleMode, setRescheduleMode] = React.useState(false);
    const [showConsultationAlert, setShowConsultationAlert] = React.useState(false);
    
    // Reschedule states
    const [newDate, setNewDate] = React.useState<Date | undefined>(undefined);
    const [newTime, setNewTime] = React.useState<string | null>(null);

    // Initial value for reschedule if entering mode
    React.useEffect(() => {
        if (rescheduleMode) {
            setNewDate(nowInVE());
            const now = nowInVE();
            now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
            setNewTime(format(now, 'hh:mm aa'));
        }
    }, [rescheduleMode]);

    if (!appointment) return null;

    const isPastAppointment = new Date(appointment.start_time) < nowInVE();
    const isTerminalState = ['fulfilled', 'cancelled', 'noshow'].includes(appointment.status);
    const showExpirationWarning = isPastAppointment && !isTerminalState;

    const patient = appointment.patient;
    const patientName = patient 
        ? `${patient.name_family}, ${patient.name_given?.join(' ')}` 
        : 'Paciente desconocido';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAction = async (actionFn: (id: string) => Promise<{ error?: any }>, successMessage: string) => {
        console.log('--- Invocando acción de cita ---');
        console.log('ID Cita:', appointment.id);
        console.log('Acción:', actionFn.name);
        
        setIsPending(true);
        try {
            const result = await actionFn(appointment.id);
            console.log('Resultado de acción:', result);

            if (result.error) {
                console.error('Error reportado por servidor:', result.error);
                toast.error(typeof result.error === 'string' ? result.error : 'Error al procesar la acción');
            } else {
                console.log('Acción exitosa:', successMessage);
                toast.success(successMessage);
                onAction();
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Error de red o ejecución:', error);
            toast.error('Error inesperado de conexión');
        } finally {
            setIsPending(false);
        }
    };

    const handleStartConsultation = async () => {
        setIsPending(true);
        try {
            const result = await startConsultationFromAppointment(appointment.id);
            if (result.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Error al iniciar consulta');
            } else if (result.success) {
                toast.success('Iniciando consulta...');
                onAction();
                onOpenChange(false);
                // Redirigimos a la historia clínica con el encounterId (cuando Area 9 esté listo para editarlo)
                // O al menos con el appointmentId para que el wizard sepa vincular.
                router.push(`/history?patientId=${result.patientId || appointment.patient_id}&appointmentId=${appointment.id}&encounterId=${result.encounterId || ''}`);
            }
        } catch (error) {
            console.error('Error al iniciar consulta:', error);
            toast.error('Error al redirigir');
        } finally {
            setIsPending(false);
            setShowConsultationAlert(false);
        }
    };
    
    // Handlers especial para cancelar con motivo
    const handleCancelWithReason = async () => {
        setIsPending(true);
        try {
            const result = await cancelAppointment(appointment.id, cancelReason);
            if (result.error) {
                toast.error(typeof result.error === 'string' ? result.error : 'Error al cancelar la cita');
            } else {
                toast.success('Cita cancelada correctamente');
                onAction();
                setShowCancelAlert(false);
                setCancelReason('');
                onOpenChange(false);
            }
        } catch (error) {
            toast.error('Error al cancelar la cita');
        } finally {
            setIsPending(false);
        }
    };

    const handleReschedule = async () => {
        if (!newDate || !newTime) {
            toast.error('Selecciona una fecha y hora válida');
            return;
        }

        setIsPending(true);
        try {
            // datePart is yyyy-MM-dd
            const datePart = format(newDate, 'yyyy-MM-dd');
            // Parse hh:mm aa (e.g. 09:30 AM) to HH:mm (09:30)
            const timePart = format(parse(newTime, 'hh:mm aa', new Date()), 'HH:mm');
            
            // Critical part: Construct the date. 
            // In a medical app, the date/time picked is intended to be the local time of the practice.
            // Using a T in between without Z means it is parsed as local browser time.
            const fullDateString = `${datePart}T${timePart}:00`; 
            const localDate = new Date(fullDateString);
            
            if (isNaN(localDate.getTime())) {
                throw new Error('Fecha u hora inválida');
            }

            const startISO = localDate.toISOString();
            // Preserve original appointment duration; fall back to 30 min
            const originalDurationMs = appointment.end_time && appointment.start_time
                ? new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()
                : 30 * 60000;
            const endISO = new Date(localDate.getTime() + originalDurationMs).toISOString();

            console.log('--- Reprogramando Cita ---');
            console.log('Local string:', fullDateString);
            console.log('ISO Start:', startISO);
            console.log('ISO End:', endISO);

            const result = await rescheduleAppointment(appointment.id, startISO, endISO);
            
            if (result.error) {
                console.error('Error del servidor:', result.error);
                toast.error(typeof result.error === 'string' ? result.error : 'Error al reprogramar en el servidor');
            } else {
                toast.success('Cita reprogramada exitosamente');
                onAction();
                setRescheduleMode(false);
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Excepción en handleReschedule:', error);
            toast.error('Error inesperado al procesar la fecha o comunicación');
        } finally {
            setIsPending(false);
        }
    };

    const config = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.proposed;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md flex flex-col p-0 gap-0">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <Badge variant={config.variant} className={cn("uppercase text-[10px] font-bold tracking-widest", config.color)}>
                                {config.label}
                            </Badge>
                            {getAppointmentTemporalLabel(appointment) && (
                                <Badge variant="destructive" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                    {getAppointmentTemporalLabel(appointment)}
                                </Badge>
                            )}
                        </div>
                        {appointment.status === 'arrived' && (
                            <Badge variant="outline" className="text-[10px] font-mono border-orange-200 text-orange-600 ml-2 animate-pulse">
                                {formatRelativeTime(appointment.updated_at)}
                            </Badge>
                        )}
                    </div>
                    <SheetTitle className="text-xl font-bold">Detalle de Cita</SheetTitle>
                    <SheetDescription>
                        Información clínica y administrativa del encuentro.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="py-4 space-y-6">
                        {/* Patient Section */}
                        <div className="bg-muted/30 rounded-xl p-4 flex items-center gap-4 border border-border/40">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner">
                                <User className="w-7 h-7" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <h3 className="font-bold text-base truncate">{patientName}</h3>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-medium">
                                    <span>{getGenderLabel(patient?.gender)}</span>
                                    <span className="opacity-30">•</span>
                                    <span>{calcAge(patient?.birth_date)}</span>
                                </div>
                                {patient?.identifiers && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono bg-background/50 px-2 py-0.5 rounded border border-border/40 self-start">
                                        <CreditCard className="w-3 h-3 text-muted-foreground" />
                                        <span>{(patient.identifiers as any)?.[0]?.value || 'S/D'} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Expiration warning section */}
                        {showExpirationWarning && !rescheduleMode && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-amber-900">Esta cita ya pasó su horario</p>
                                        <p className="text-xs text-amber-700 leading-tight">
                                            La cita estaba programada para un momento en el pasado y no fue procesada.
                                            Sugerimos reprogramarla o marcar la inasistencia.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-8 text-xs bg-white border-amber-300 hover:bg-amber-100 text-amber-800"
                                        onClick={() => setRescheduleMode(true)}
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                        Reprogramar
                                    </Button>
                                    {isEligibleForNoShow(appointment.end_time) && (
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="h-8 text-xs bg-white border-red-200 hover:bg-red-50 text-red-700"
                                            onClick={() => handleAction(markNoShow, 'Paciente registrado como inasistente')}
                                        >
                                            Marcar Inasistencia
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Timing Section - Always shown */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase opacity-70">
                                    <Calendar className="w-3 h-3" />
                                    Fecha
                                </div>
                                <p className={cn("text-sm font-medium", isPastAppointment && "text-muted-foreground line-through")}>
                                    {formatDate(appointment.start_time, { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase opacity-70">
                                    <Clock className="w-3 h-3" />
                                    Horario
                                </div>
                                <p className={cn("text-sm font-medium", isPastAppointment && "text-muted-foreground line-through")}>
                                    {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                                </p>
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        {/* Appointment Info */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase opacity-70">
                                    <AlertCircle className="w-3 h-3" />
                                    Tipo de atención
                                </div>
                                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/10">
                                    {appointment.appointment_type || 'Consulta General'}
                                </Badge>
                            </div>

                            {appointment.description && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase opacity-70">
                                        <FileText className="w-3 h-3" />
                                        Descripción / Motivo
                                    </div>
                                    <div className="bg-muted/20 p-3 rounded-lg text-sm text-foreground/80 leading-relaxed italic border-l-2 border-primary/20">
                                        &quot;{appointment.description}&quot;
                                    </div>
                                </div>
                            )}

                            {appointment.status === 'cancelled' && appointment.cancellation_reason && (
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase opacity-90">
                                        <XCircle className="w-3 h-3" />
                                        Motivo de Cancelación
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-lg text-sm text-red-900 leading-relaxed italic border-l-2 border-red-300">
                                        &quot;{appointment.cancellation_reason}&quot;
                                    </div>
                                </div>
                            )}

                            {patient?.telecom && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase opacity-70">
                                        <Phone className="w-3 h-3" />
                                        Contacto
                                    </div>
                                    <p className="text-sm font-medium">{(patient.telecom as any)?.[0]?.value || 'No especificado'} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <SheetFooter className="p-6 border-t bg-muted/20 sm:flex-col gap-3">
                    <div className="flex flex-col w-full gap-2.5">
                        {/* Contextual Actions Machine */}
                        
                        {/* 1. Proposed / Pending -> Confirm or Cancel */}
                        {(appointment.status === 'proposed' || appointment.status === 'pending') && (
                            <>
                                {!isEligibleForNoShow(appointment.end_time) && (
                                    <Button 
                                        className="w-full gap-2 shadow-lg shadow-blue-500/10" 
                                        onClick={() => handleAction(confirmAppointment, 'Cita confirmada correctamente')}
                                        disabled={isPending}
                                    >
                                        <ClipboardCheck className="w-4 h-4" />
                                        Confirmar Cita
                                    </Button>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full text-blue-600 hover:bg-blue-50 border-blue-100"
                                        onClick={() => setRescheduleMode(true)}
                                        disabled={isPending}
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Reprogramar
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full text-destructive hover:bg-destructive/10 border-destructive/20"
                                        onClick={() => setShowCancelAlert(true)}
                                        disabled={isPending}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* 2. Booked (Confirmed) -> Arrived or Cancel */}
                        {appointment.status === 'booked' && (
                            <>
                                {isWithinCheckinWindow(appointment.start_time, appointment.end_time).allowed ? (
                                    <Button 
                                        className="w-full gap-2 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/10"
                                        onClick={() => handleAction(markArrived, 'Paciente marcado como llegó')}
                                        disabled={isPending}
                                    >
                                        <User className="w-4 h-4" />
                                        Marcar Llegada / En Sala
                                    </Button>
                                ) : isWithinCheckinWindow(appointment.start_time, appointment.end_time).reason === 'early' ? (
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
                                        <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-tight">
                                            Llegada disponible en {formatDuration(isWithinCheckinWindow(appointment.start_time, appointment.end_time).minutesUntilOpen ?? 0)}
                                        </p>
                                    </div>
                                ) : null}

                                <div className="grid grid-cols-2 gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="w-full text-blue-600 hover:bg-blue-50 border-blue-100"
                                        onClick={() => setRescheduleMode(true)}
                                        disabled={isPending}
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Reprogramar
                                    </Button>
                                    {isEligibleForNoShow(appointment.end_time) && (
                                        <Button 
                                            variant="outline" 
                                            className="w-full border-red-100 bg-red-50 text-red-600 border-red-200"
                                            onClick={() => handleAction(markNoShow, 'Paciente marcado como no asistió')}
                                            disabled={isPending}
                                        >
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            No se presentó
                                        </Button>
                                    )}
                                </div>
                                <Button 
                                    variant="outline" 
                                    className="w-full text-destructive hover:bg-destructive/10 border-destructive/20"
                                    onClick={() => setShowCancelAlert(true)}
                                    disabled={isPending}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancelar Cita
                                </Button>
                            </>
                        )}

                        {/* 3. Arrived -> Fulfill (Start Consultation) */}
                        {appointment.status === 'arrived' && (
                            <Button 
                                className="w-full gap-2 py-6 text-base font-bold shadow-xl shadow-primary/20"
                                onClick={() => setShowConsultationAlert(true)}
                                disabled={isPending}
                            >
                                <Stethoscope className="w-5 h-5" />
                                Iniciar Consulta
                            </Button>
                        )}

                        {/* 4. Terminal States (Fulfilled / Cancelled / NoShow) -> Read Only Actions */}
                        {appointment.status === 'fulfilled' && (
                            <div className="flex flex-col items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Atención Completada
                                </div>
                                <Button 
                                    variant="link" 
                                    className="text-primary font-semibold"
                                    onClick={() => router.push(`/history?patientId=${appointment.patient_id}`)}
                                >
                                    Ver Historia Clínica
                                </Button>
                            </div>
                        )}

                        {(appointment.status === 'cancelled' || appointment.status === 'noshow') && (
                            <div className="p-4 bg-muted/50 text-center rounded-xl border border-border/60">
                                <p className="text-sm font-bold text-muted-foreground flex items-center justify-center gap-2 uppercase tracking-tight">
                                    {appointment.status === 'cancelled' ? (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Cita Cancelada
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-4 h-4" />
                                            Paciente no asistió
                                        </>
                                    )}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">
                                    Esta cita es de solo lectura por auditoría.
                                </p>
                            </div>
                        )}
                    </div>
                </SheetFooter>

                {/* Confirm Cancellation Dialog */}
                <Dialog open={showCancelAlert} onOpenChange={setShowCancelAlert}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-destructive" />
                                Cancelar Cita
                            </DialogTitle>
                            <DialogDescription>
                                Estás a punto de cancelar esta cita. Esta acción liberará el horario pero no puede ser deshecha.
                                Por favor, indica el motivo de la cancelación.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4">
                            <Label htmlFor="reason" className="text-xs font-semibold uppercase text-muted-foreground">
                                Motivo de cancelación
                            </Label>
                            <Textarea
                                id="reason"
                                className="mt-2"
                                placeholder="Ej: El paciente llamó para informar que no puede asistir por motivos personales..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button 
                                variant="outline" 
                                disabled={isPending}
                                onClick={() => setShowCancelAlert(false)}
                            >
                                Volver
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={handleCancelWithReason}
                                disabled={isPending || cancelReason.trim().length < 3}
                            >
                                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Sí, Cancelar Cita
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Consultation Start Alert */}
                <AlertDialog open={showConsultationAlert} onOpenChange={setShowConsultationAlert}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Iniciar consulta clínica?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Estás a punto de iniciar una consulta médica con <strong>{patientName}</strong>.
                                Esto cambiará el estado de la cita a Completada y comenzará un nuevo encuentro en la Historia Clínica.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPending}>Volver</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleStartConsultation}
                                disabled={isPending}
                            >
                                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Iniciar Consulta
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Reschedule Dialog */}
                <Dialog open={rescheduleMode} onOpenChange={setRescheduleMode}>
                    <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <History className="w-5 h-5 text-primary" />
                                Reprogramar Cita
                            </DialogTitle>
                            <DialogDescription>
                                Selecciona una nueva fecha y hora para la atención de {patientName}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-6 py-4">
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                        Disponibilidad Médica
                                    </Label>
                                    <AppointmentPicker 
                                        date={newDate}
                                        onDateChange={setNewDate}
                                        time={newTime}
                                        onTimeChange={setNewTime}
                                        className="w-full bg-muted/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-muted/30 border-t">
                            <Button 
                                variant="outline" 
                                onClick={() => setRescheduleMode(false)}
                                disabled={isPending}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                className="gap-2 px-8 min-w-[180px]"
                                onClick={handleReschedule}
                                disabled={isPending || !newDate || !newTime}
                            >
                                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Confirmar Cambio
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SheetContent>
        </Sheet>
    );
}
