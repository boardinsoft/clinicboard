'use client';

import React from 'react';
import { Clock, CheckCircle2, CalendarCheck, ClipboardList, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime, nowInVE, formatRelativeTime } from '@/lib/date-utils';
import type { Appointment, AppointmentStatus } from '@/lib/fhir/types';

interface AppointmentsKanbanProps {
    appointments: Appointment[];
    onSelect: (id: string) => void;
    selectedId: string | null;
}

interface ColumnConfig {
    id: string;
    title: string;
    statuses: AppointmentStatus[];
    icon: React.ElementType;
    colorClass: string;
    headerColor: string;
}

const COLUMNS: ColumnConfig[] = [
    { 
        id: 'proposed', 
        title: 'Propuestas', 
        statuses: ['proposed', 'pending'], 
        icon: ClipboardList,
        colorClass: 'bg-muted/30 border-t-muted-foreground/40',
        headerColor: 'text-muted-foreground'
    },
    { 
        id: 'confirmed', 
        title: 'Confirmadas', 
        statuses: ['booked'], 
        icon: CalendarCheck,
        headerColor: 'text-primary',
        colorClass: 'bg-primary/5 border-t-primary/40'
    },
    { 
        id: 'arrived', 
        title: 'En Espera', 
        statuses: ['arrived'], 
        icon: Clock,
        headerColor: 'text-orange-600',
        colorClass: 'bg-orange-500/5 border-t-orange-500/40'
    },
    { 
        id: 'completed', 
        title: 'En Consulta / Finalizadas', 
        statuses: ['fulfilled'], 
        icon: CheckCircle,
        headerColor: 'text-emerald-600',
        colorClass: 'bg-emerald-500/5 border-t-emerald-500/40'
    }
];

const STATUS_DOT_COLORS: Record<string, string> = {
    proposed: 'bg-slate-400',
    pending: 'bg-amber-400',
    booked: 'bg-blue-500',
    arrived: 'bg-orange-500',
    fulfilled: 'bg-emerald-500',
};

export default function AppointmentsKanban({
    appointments,
    onSelect,
    selectedId,
}: AppointmentsKanbanProps) {

    const getAppointmentsInColumn = (statuses: AppointmentStatus[]) => {
        return appointments.filter(apt => statuses.includes(apt.status));
    };

    const now = nowInVE();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full p-4 overflow-hidden">
            {COLUMNS.map((column) => {
                const columnAppointments = getAppointmentsInColumn(column.statuses);
                const Icon = column.icon;

                return (
                    <div 
                        key={column.id} 
                        className={cn(
                            "flex flex-col rounded-xl border-t-4 shadow-sm h-full max-h-full",
                            column.colorClass
                        )}
                    >
                        {/* Column Header */}
                        <div className="p-3 flex items-center justify-between bg-background/40 backdrop-blur-sm rounded-t-lg">
                            <div className="flex items-center gap-2">
                                <div className={cn("p-1.5 rounded-md bg-background border shadow-xs", column.headerColor)}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <h3 className={cn("text-sm font-bold", column.headerColor)}>
                                    {column.title}
                                </h3>
                            </div>
                            <Badge variant="outline" className="h-5 px-1.5 min-w-5 justify-center bg-background/80 font-mono text-[10px] border-none shadow-none">
                                {columnAppointments.length}
                            </Badge>
                        </div>

                        {/* Dropdown area / list */}
                        <ScrollArea className="flex-1 px-2 pt-2 pb-4">
                            <div className="flex flex-col gap-3">
                                {columnAppointments.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center opacity-20 select-none">
                                        <Icon className="w-10 h-10 mb-2" />
                                        <span className="text-xs font-medium">Bandeja vacía</span>
                                    </div>
                                ) : (
                                    columnAppointments.map(apt => {
                                        const isActive = selectedId === apt.id;
                                        const patientName = apt.patient 
                                            ? `${apt.patient.name_family}, ${apt.patient.name_given?.join(' ')}`
                                            : 'Paciente desconocido';
                                        
                                        const isPast = new Date(apt.start_time) < now && apt.status !== 'fulfilled';

                                        return (
                                            <Card 
                                                key={apt.id}
                                                onClick={() => onSelect(apt.id)}
                                                className={cn(
                                                    "cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border-border/40 hover:border-primary/30 group",
                                                    isActive ? "ring-2 ring-primary/50 shadow-md border-primary" : "shadow-sm"
                                                )}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-start justify-between gap-1 mb-2">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/80">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTime(apt.start_time)}
                                                        </div>
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT_COLORS[apt.status] || 'bg-slate-300')} />
                                                    </div>
                                                    
                                                    <div className="text-[13px] font-bold leading-tight group-hover:text-primary transition-colors">
                                                        {patientName}
                                                    </div>
                                                    
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <Badge variant="outline" className="h-4 px-1 py-0 text-[8px] bg-muted/30 border-none font-medium text-muted-foreground uppercase opacity-80">
                                                            {apt.appointment_type || 'Consulta'}
                                                        </Badge>
                                                        {apt.status === 'arrived' && (
                                                            <Badge className="h-4 px-2 py-0.5 text-[9px] bg-orange-500 hover:bg-orange-600 border-none font-bold text-white uppercase animate-pulse">
                                                                Tiempo de espera: {formatRelativeTime(apt.updated_at)}
                                                            </Badge>
                                                        )}
                                                        {isPast && (
                                                            <Badge className="h-4 px-1 py-0 text-[8px] bg-amber-100 border border-amber-200 font-bold text-amber-700 uppercase gap-1">
                                                                <AlertCircle className="w-2.5 h-2.5" />
                                                                Horario Pasado
                                                            </Badge>
                                                        )}
                                                        {apt.status === 'fulfilled' && (
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                );
            })}
        </div>
    );
}
