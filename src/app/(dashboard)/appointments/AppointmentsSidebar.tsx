'use client';

import React from 'react';
import { Plus, User, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Appointment, AppointmentStatus } from '@/lib/fhir/types';
import { formatTime } from '@/lib/date-utils';

interface AppointmentsSidebarProps {
    appointments: Appointment[];
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    selectedId: string | null;
    onSelect: (id: string) => void;
    statusFilter: AppointmentStatus[];
    onStatusFilterChange: (statuses: AppointmentStatus[]) => void;
    onNew: () => void;
}

const FHIR_STATUS_CONFIG: Record<AppointmentStatus, { label: string; colorClass: string }> = {
    proposed: { label: 'Propuesta', colorClass: 'bg-slate-400' },
    pending: { label: 'Pendiente', colorClass: 'bg-amber-400' },
    booked: { label: 'Confirmada', colorClass: 'bg-blue-500' },
    arrived: { label: 'Llegada', colorClass: 'bg-orange-500' },
    fulfilled: { label: 'Completada', colorClass: 'bg-emerald-500' },
    cancelled: { label: 'Cancelada', colorClass: 'bg-red-500' },
    noshow: { label: 'No asistió', colorClass: 'bg-slate-600' },
};

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function AppointmentsSidebar({
    appointments,
    selectedDate,
    onDateChange,
    selectedId,
    onSelect,
    statusFilter,
    onStatusFilterChange,
    onNew,
}: AppointmentsSidebarProps) {
    // Generate week days for the mini calendar
    const getWeekDays = () => {
        const start = new Date(selectedDate);
        start.setDate(start.getDate() - start.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    };

    const weekDays = getWeekDays();

    const toggleStatus = (status: AppointmentStatus) => {
        if (statusFilter.includes(status)) {
            onStatusFilterChange(statusFilter.filter(s => s !== status));
        } else {
            onStatusFilterChange([...statusFilter, status]);
        }
    };

    const stats = {
        total: appointments.length,
        confirmed: appointments.filter(a => a.status === 'booked').length,
        completed: appointments.filter(a => a.status === 'fulfilled').length,
    };

    return (
        <div className="flex flex-col h-full bg-sidebar/50">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b bg-sidebar">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Citas
                </h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={onNew}
                    title="Nueva cita"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Mini Calendar / Week Strip */}
            <div className="p-4 bg-sidebar/30">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-medium capitalize">
                        {selectedDate.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <div className="flex justify-between">
                    {weekDays.map((day, i) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isSelected = day.toDateString() === selectedDate.toDateString();
                        return (
                            <button
                                key={i}
                                onClick={() => onDateChange(day)}
                                className={cn(
                                    "flex flex-col items-center justify-center w-8 h-12 rounded-full transition-all",
                                    isSelected
                                        ? "bg-primary text-primary-foreground shadow-sm scale-110"
                                        : isToday
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "hover:bg-accent text-muted-foreground"
                                )}
                            >
                                <span className={cn("text-[9px] mb-0.5 uppercase", isSelected ? "opacity-80" : "opacity-60")}>
                                    {daysOfWeek[day.getDay()][0]}
                                </span>
                                <span className={cn("text-xs", isSelected ? "font-bold" : "font-medium")}>
                                    {day.getDate()}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Status Filters */}
            <div className="px-4 py-3 border-t border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Filtros</p>
                <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(FHIR_STATUS_CONFIG) as AppointmentStatus[]).map((status) => {
                        const config = FHIR_STATUS_CONFIG[status];
                        const isActive = statusFilter.length === 0 || statusFilter.includes(status);
                        return (
                            <Badge
                                key={status}
                                variant={isActive ? "secondary" : "outline"}
                                className={cn(
                                    "cursor-pointer text-[10px] px-2 py-0 h-5 transition-all",
                                    isActive 
                                        ? "bg-accent text-accent-foreground border-transparent" 
                                        : "opacity-40 hover:opacity-100 grayscale-[0.5]"
                                )}
                                onClick={() => toggleStatus(status)}
                            >
                                <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", config.colorClass)} />
                                {config.label}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            <Separator className="opacity-40" />

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-1 px-4 py-3 bg-sidebar/20">
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Total</span>
                    <span className="text-sm font-semibold">{stats.total}</span>
                </div>
                <div className="flex flex-col border-x border-border/40 px-3">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Confirm.</span>
                    <span className="text-sm font-semibold text-primary">{stats.confirmed}</span>
                </div>
                <div className="flex flex-col pl-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Complet.</span>
                    <span className="text-sm font-semibold text-emerald-500">{stats.completed}</span>
                </div>
            </div>

            <Separator className="opacity-40" />

            {/* Appointments List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <SidebarGroup className="p-2 pt-0">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {appointments.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground opacity-60">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">Sin citas para este día</p>
                                </div>
                            ) : (
                                appointments.map((apt) => {
                                    const isActive = selectedId === apt.id;
                                    const patientName = apt.patient 
                                        ? `${apt.patient.name_family}, ${apt.patient.name_given?.join(' ')}`
                                        : 'Paciente desconocido';
                                    const statusConfig = FHIR_STATUS_CONFIG[apt.status];

                                    return (
                                        <SidebarMenuItem key={apt.id}>
                                            <SidebarMenuButton
                                                onClick={() => onSelect(apt.id)}
                                                isActive={isActive}
                                                className={cn(
                                                    "h-auto p-2.5 items-start gap-3 transition-all",
                                                    isActive
                                                        ? "bg-accent shadow-sm border border-border/50"
                                                        : "hover:bg-accent/40"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                                                    isActive 
                                                        ? "bg-primary text-primary-foreground border-primary" 
                                                        : "bg-background text-muted-foreground border-border/50"
                                                )}>
                                                    {apt.status === 'fulfilled' ? <CheckCircle2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={cn(
                                                            "text-xs font-semibold truncate",
                                                            isActive ? "text-foreground" : "text-foreground/80"
                                                        )}>
                                                            {patientName}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                                                            {formatTime(apt.start_time)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="h-3.5 px-1 py-0 text-[8px] bg-muted/30 border-none text-muted-foreground/80">
                                                            {apt.appointment_type || 'Consulta'}
                                                        </Badge>
                                                        <div className="flex items-center gap-1">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig.colorClass)} />
                                                            <span className="text-[9px] text-muted-foreground/70 uppercase font-medium">
                                                                {statusConfig.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </div>
        </div>
    );
}
