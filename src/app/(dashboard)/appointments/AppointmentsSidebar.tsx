'use client';

import React, { useState } from 'react';
import { Plus, Clock, ChevronRight, Calendar as CalendarIcon, Filter, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    // Collapsible states
    const [openCalendar, setOpenCalendar] = useState(true);
    const [openFilters, setOpenFilters] = useState(true);
    const [openStats, setOpenStats] = useState(false);
    const [openList, setOpenList] = useState(true);

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
        <div className="flex flex-col h-full bg-sidebar border-r border-border/40 font-sans">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/40 shrink-0">
                <span className="text-base font-semibold text-foreground tracking-tight">
                    Citas
                </span>
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

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                
                {/* ── SECCIÓN: CALENDARIO SEMANAL ── */}
                <Collapsible open={openCalendar} onOpenChange={setOpenCalendar} className="group/collapsible">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 w-full px-4 py-2 text-xs tracking-wider uppercase font-bold text-muted-foreground/60 hover:text-foreground transition-colors group">
                            <ChevronRight className={cn(
                                "w-3 h-3 transition-transform duration-200",
                                openCalendar && "rotate-90"
                            )} />
                            <CalendarIcon className="w-4 h-4" />
                            <span>Calendario</span>
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-2">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-medium text-muted-foreground capitalize">
                                {selectedDate.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex justify-between gap-1">
                            {weekDays.map((day, i) => {
                                const isToday = day.toDateString() === new Date().toDateString();
                                const isSelected = day.toDateString() === selectedDate.toDateString();
                                return (
                                    <button
                                        key={i}
                                        onClick={() => onDateChange(day)}
                                        className={cn(
                                            "flex flex-col items-center justify-center flex-1 h-12 rounded-lg transition-all",
                                            isSelected
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : isToday
                                                    ? "bg-primary/10 text-primary font-medium"
                                                    : "hover:bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <span className={cn("text-[10px] mb-0.5", isSelected ? "opacity-80" : "opacity-60")}>
                                            {daysOfWeek[day.getDay()][0]}
                                        </span>
                                        <span className={cn("text-sm", isSelected ? "font-bold" : "font-medium")}>
                                            {day.getDate()}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                <div className="h-2" />

                {/* ── SECCIÓN: FILTROS DE ESTADO ── */}
                <Collapsible open={openFilters} onOpenChange={setOpenFilters} className="group/collapsible">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 w-full px-4 py-2 text-xs tracking-wider uppercase font-bold text-muted-foreground/60 hover:text-foreground transition-colors group">
                            <ChevronRight className={cn(
                                "w-3 h-3 transition-transform duration-200",
                                openFilters && "rotate-90"
                            )} />
                            <Filter className="w-4 h-4" />
                            <span>Filtros</span>
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-2">
                        <div className="flex flex-wrap gap-1.5">
                            {(Object.keys(FHIR_STATUS_CONFIG) as AppointmentStatus[]).map((status) => {
                                const config = FHIR_STATUS_CONFIG[status];
                                const isActive = statusFilter.length === 0 || statusFilter.includes(status);
                                return (
                                    <Badge
                                        key={status}
                                        variant={isActive ? "secondary" : "outline"}
                                        className={cn(
                                            "cursor-pointer text-[11px] px-2 py-0.5 h-6 transition-all border-none",
                                            isActive 
                                                ? "bg-muted text-foreground font-medium" 
                                                : "opacity-40 hover:opacity-100 bg-transparent"
                                        )}
                                        onClick={() => toggleStatus(status)}
                                    >
                                        <div className={cn("w-1 h-1 rounded-full mr-1.5", config.colorClass)} />
                                        {config.label}
                                    </Badge>
                                );
                            })}
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                <div className="h-2" />

                {/* ── SECCIÓN: RESUMEN (ESTADÍSTICAS) ── */}
                <Collapsible open={openStats} onOpenChange={setOpenStats} className="group/collapsible">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 w-full px-4 py-2 text-xs tracking-wider uppercase font-bold text-muted-foreground/60 hover:text-foreground transition-colors group">
                            <ChevronRight className={cn(
                                "w-3 h-3 transition-transform duration-200",
                                openStats && "rotate-90"
                            )} />
                            <BarChart3 className="w-4 h-4" />
                            <span>Resumen</span>
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-2">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-muted/30 p-2 rounded-md flex flex-col items-center">
                                <span className="text-[11px] text-muted-foreground">Total</span>
                                <span className="text-sm font-bold">{stats.total}</span>
                            </div>
                            <div className="bg-muted/30 p-2 rounded-md flex flex-col items-center">
                                <span className="text-[11px] text-muted-foreground">Conf.</span>
                                <span className="text-sm font-bold text-primary">{stats.confirmed}</span>
                            </div>
                            <div className="bg-muted/30 p-2 rounded-md flex flex-col items-center">
                                <span className="text-[11px] text-muted-foreground">Comp.</span>
                                <span className="text-sm font-bold text-clinical-stable-fg">{stats.completed}</span>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                <div className="h-2" />

                {/* ── SECCIÓN: LISTA DE CITAS ── */}
                <Collapsible open={openList} onOpenChange={setOpenList} className="group/collapsible">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center justify-between w-full px-4 py-2 text-xs tracking-wider uppercase font-bold text-muted-foreground/60 hover:text-foreground transition-colors group">
                            <div className="flex items-center gap-2">
                                <ChevronRight className={cn(
                                    "w-3 h-3 transition-transform duration-200",
                                    openList && "rotate-90"
                                )} />
                                <span>Lista de citas</span>
                            </div>
                            <Badge variant="secondary" className="h-4 px-1 rounded-sm text-[10px] font-bold bg-muted/50 text-muted-foreground/60 border-none">
                                {appointments.length}
                            </Badge>
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenu className="px-2">
                            {appointments.length === 0 ? (
                                <div className="px-8 py-8 text-center text-muted-foreground/40 italic">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-10" />
                                    <p className="text-xs">Sin citas para hoy</p>
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
                                                    "h-auto py-2.5 px-3 items-start gap-3 transition-colors duration-100",
                                                    isActive ? "bg-muted" : "hover:bg-muted/40"
                                                )}
                                            >
                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={cn(
                                                            "text-sm font-medium truncate",
                                                            isActive ? "text-foreground" : "text-foreground/90"
                                                        )}>
                                                            {patientName}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground/50 tabular-nums">
                                                            {formatTime(apt.start_time)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[11px] text-muted-foreground/40 truncate">
                                                            {apt.appointment_type || 'Consulta'}
                                                        </span>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <div className={cn("w-1 h-1 rounded-full", statusConfig.colorClass)} />
                                                            <span className="text-[10px] text-muted-foreground/60 font-medium">
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
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    );
}
