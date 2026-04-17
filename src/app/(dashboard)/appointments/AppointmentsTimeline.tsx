'use client';

import React from 'react';
import { User, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatLongDate, formatTime } from '@/lib/date-utils';
import type { Appointment, AppointmentStatus } from '@/lib/fhir/types';

interface AppointmentsTimelineProps {
    appointments: Appointment[];
    onSelect: (id: string) => void;
    selectedId: string | null;
    selectedDate: Date;
}

const FHIR_STATUS_CONFIG: Record<AppointmentStatus, { label: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'; borderClass: string; textClass: string }> = {
    proposed: { label: 'Propuesta', badgeVariant: 'outline', borderClass: 'border-l-muted-foreground/30', textClass: 'text-muted-foreground/60' },
    pending: { label: 'Pendiente', badgeVariant: 'outline', borderClass: 'border-l-amber-400', textClass: 'text-amber-600 dark:text-amber-500' },
    booked: { label: 'Confirmada', badgeVariant: 'secondary', borderClass: 'border-l-blue-500', textClass: 'text-blue-600 dark:text-blue-400' },
    arrived: { label: 'Llegada', badgeVariant: 'secondary', borderClass: 'border-l-orange-500', textClass: 'text-orange-600 dark:text-orange-400' },
    fulfilled: { label: 'Completada', badgeVariant: 'secondary', borderClass: 'border-l-emerald-500', textClass: 'text-emerald-700 dark:text-emerald-500' },
    cancelled: { label: 'Cancelada', badgeVariant: 'destructive', borderClass: 'border-l-red-500', textClass: 'text-red-700 dark:text-red-500' },
    noshow: { label: 'No asistió', badgeVariant: 'outline', borderClass: 'border-l-muted-foreground', textClass: 'text-muted-foreground' },
};

// Work hours: 08:00 to 18:00 every 30 mins
const WORK_HOURS = Array.from({ length: 21 }, (_, i) => {
    const hours = Math.floor(i / 2) + 8;
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
});

export default function AppointmentsTimeline({
    appointments,
    onSelect,
    selectedId,
    selectedDate,
}: AppointmentsTimelineProps) {
    
    // Group appointments by hour slot
    const getAppointmentsForSlot = (timeSlot: string) => {
        return appointments.filter(apt => {
            const aptTime = new Date(apt.start_time);
            const [h, m] = timeSlot.split(':').map(Number);
            return aptTime.getHours() === h && aptTime.getMinutes() === m;
        });
    };

    const calcDuration = (start: string, end: string) => {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        return Math.floor(diff / 60000);
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Sticky Date Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/60">
                <h2 className="text-lg font-semibold capitalize text-foreground/90">
                    {formatLongDate(selectedDate)}
                </h2>
            </div>

            {/* Timeline ScrollArea */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-12">
                <div className="flex flex-col">
                    {WORK_HOURS.map((timeSlot) => {
                        const slotAppointments = getAppointmentsForSlot(timeSlot);
                        const hasAppointments = slotAppointments.length > 0;

                        return (
                            <div
                                key={timeSlot}
                                className={cn(
                                    "flex border-b border-border/40 transition-colors",
                                    hasAppointments ? "min-h-[100px] bg-muted/5" : "min-h-[60px] hover:bg-muted/10"
                                )}
                            >
                                {/* Time Label */}
                                <div className="w-[85px] p-4 text-[13px] font-mono text-muted-foreground border-r border-border/40 flex-shrink-0 text-right pr-6 select-none pt-5">
                                    {timeSlot}
                                </div>

                                {/* Appointment Slot Content */}
                                <div className="flex-1 p-2 flex flex-col gap-2">
                                    {slotAppointments.map((apt) => {
                                        const isActive = selectedId === apt.id;
                                        const config = FHIR_STATUS_CONFIG[apt.status];
                                        const patientName = apt.patient 
                                            ? `${apt.patient.name_family}, ${apt.patient.name_given?.join(' ')}`
                                            : 'Paciente desconocido';
                                        const duration = calcDuration(apt.start_time, apt.end_time);

                                        return (
                                            <Card
                                                key={apt.id}
                                                onClick={() => onSelect(apt.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 bg-card border shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4",
                                                    config.borderClass,
                                                    isActive ? "ring-2 ring-primary/50 border-primary" : "border-border/40",
                                                    apt.status === 'cancelled' && "opacity-60 saturate-50"
                                                )}
                                            >
                                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                    <div className={cn(
                                                        "h-9 w-9 rounded-md flex items-center justify-center shrink-0 border border-border/50 shadow-sm",
                                                        isActive ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground"
                                                    )}>
                                                        {apt.status === 'fulfilled' ? <CheckCircle2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="text-sm font-bold text-foreground truncate tracking-tight">
                                                            {patientName}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                                            <span className="font-semibold text-foreground/70">
                                                                {apt.appointment_type || 'Consulta General'}
                                                            </span>
                                                            <span className="text-muted-foreground/30">•</span>
                                                            <div className="flex items-center gap-1 font-medium">
                                                                <Clock className="w-3 h-3 opacity-60" />
                                                                <span>{duration} min</span>
                                                            </div>
                                                            <span className="text-muted-foreground/30 hidden sm:inline">•</span>
                                                            <span className="font-mono text-[10px] opacity-70 hidden sm:inline font-medium">
                                                                {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                                    <Badge 
                                                        variant={config.badgeVariant} 
                                                        className={cn(
                                                            "h-5 px-1.5 text-[9px] uppercase font-bold tracking-widest",
                                                            config.badgeVariant === 'secondary' && "bg-accent/10 border-accent/20 " + config.textClass
                                                        )}
                                                    >
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
