'use client';

import React from 'react';
import { ChevronRight, Calendar as CalendarIcon, Filter, BarChart3, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
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
import type { AppointmentStatus } from '@/lib/fhir/types';
import { useAppointmentsStore } from '@/store/useAppointmentsStore';

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

export default function AppointmentsSidebar() {
    const {
        selectedDate,
        statusFilter,
        openCalendar,
        openFilters,
        openStats,
        setSelectedDate,
        toggleStatusFilter,
        setOpenCalendar,
        setOpenFilters,
        setOpenStats,
    } = useAppointmentsStore();

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

    const navigateWeek = (direction: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + (direction * 7));
        setSelectedDate(newDate);
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const monthYearLabel = selectedDate.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });

    return (
        <div className="flex flex-col h-full bg-sidebar border-r border-border/40 font-sans">
            {/* Header */}
            <div className="px-4 py-3 flex items-center border-b border-border/40 shrink-0">
                <span className="text-base font-semibold text-foreground tracking-tight">
                    Citas
                </span>
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
                        <div className="flex items-center justify-between mb-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-md hover:bg-muted"
                                onClick={() => navigateWeek(-1)}
                            >
                                <ChevronLeft className="w-3 h-3" />
                            </Button>
                            <span className="text-xs font-medium text-muted-foreground capitalize">
                                {monthYearLabel}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-md hover:bg-muted"
                                onClick={() => navigateWeek(1)}
                            >
                                <ChevronRightIcon className="w-3 h-3" />
                            </Button>
                        </div>

                        <div className="flex justify-between gap-0.5 mb-2">
                            {daysOfWeek.map((day) => (
                                <div key={day} className="flex-1 flex justify-center">
                                    <span className="text-[10px] font-medium text-muted-foreground/50 uppercase">
                                        {day[0]}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between gap-0.5">
                            {weekDays.map((day, i) => {
                                const isToday = day.toDateString() === new Date().toDateString();
                                const isSelected = day.toDateString() === selectedDate.toDateString();
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            "flex flex-col items-center justify-center flex-1 aspect-square rounded-lg transition-all",
                                            isSelected
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : isToday
                                                    ? "bg-primary/10 text-primary font-medium"
                                                    : "hover:bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <span className={cn("text-xs", isSelected ? "opacity-80" : "opacity-60")}>
                                            {day.getDate()}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 h-7 text-[11px] font-medium"
                            onClick={goToToday}
                        >
                            Hoy
                        </Button>
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
                                        onClick={() => toggleStatusFilter(status)}
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

                {/* ── SECCIÓN: RESUMEN ── */}
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
                                <span className="text-sm font-bold">-</span>
                            </div>
                            <div className="bg-muted/30 p-2 rounded-md flex flex-col items-center">
                                <span className="text-[11px] text-muted-foreground">Conf.</span>
                                <span className="text-sm font-bold text-primary">-</span>
                            </div>
                            <div className="bg-muted/30 p-2 rounded-md flex flex-col items-center">
                                <span className="text-[11px] text-muted-foreground">Comp.</span>
                                <span className="text-sm font-bold text-clinical-stable-fg">-</span>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    );
}