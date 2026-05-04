'use client';

import React, { useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppointmentsStore } from '@/store/useAppointmentsStore';
import type { Appointment, AppointmentStatus } from '@/lib/fhir/types';
import { formatTime } from '@/lib/date-utils';

const FHIR_STATUS_CONFIG: Record<AppointmentStatus, { label: string; colorClass: string; borderClass: string }> = {
    proposed: { label: 'Propuesta', colorClass: 'bg-n-5', borderClass: 'border-l-n-5' },
    pending: { label: 'Pendiente', colorClass: 'bg-warning/20 text-warning', borderClass: 'border-l-warning' },
    booked: { label: 'Confirmada', colorClass: 'bg-info/20 text-info', borderClass: 'border-l-info' },
    arrived: { label: 'En Consulta', colorClass: 'bg-warning/20 text-warning', borderClass: 'border-l-warning' },
    fulfilled: { label: 'Completada', colorClass: 'bg-success/20 text-success', borderClass: 'border-l-success' },
    cancelled: { label: 'Cancelada', colorClass: 'bg-destructive/20 text-destructive', borderClass: 'border-l-destructive' },
    noshow: { label: 'No asistió', colorClass: 'bg-n-8/20 text-n-8', borderClass: 'border-l-n-8' },
};

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface MonthlyCalendarProps {
    appointments: Appointment[];
    onDateSelect?: (date: Date) => void;
    onEventClick?: (appointment: Appointment) => void;
    onNewAppointment?: (date: Date) => void;
}

export default function MonthlyCalendar({
    appointments,
    onEventClick,
    onNewAppointment,
}: MonthlyCalendarProps) {
    const { selectedDate, setSelectedDate, statusFilter, patientSearch } = useAppointmentsStore();

    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt => {
            if (statusFilter.length > 0 && !statusFilter.includes(apt.status)) {
                return false;
            }
            if (patientSearch) {
                const patientName = apt.patient
                    ? `${apt.patient.name_family}, ${apt.patient.name_given?.join(' ')}`.toLowerCase()
                    : '';
                if (!patientName.includes(patientSearch.toLowerCase())) {
                    return false;
                }
            }
            return true;
        });
    }, [appointments, statusFilter, patientSearch]);

    const getDaysInMonth = useCallback((date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startingDayOfWeek = firstDayOfMonth.getDay();

        const days: Date[] = [];

        for (let i = 0; i < startingDayOfWeek; i++) {
            const d = new Date(year, month, -startingDayOfWeek + i + 1);
            days.push(d);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push(new Date(year, month + 1, i));
        }

        return days;
    }, []);

    const getAppointmentsForDate = useCallback((date: Date) => {
        return filteredAppointments.filter(apt => {
            const aptDate = new Date(apt.start_time);
            return aptDate.toDateString() === date.toDateString();
        });
    }, [filteredAppointments]);

    const navigateMonth = (direction: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setSelectedDate(newDate);
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const days = useMemo(() => getDaysInMonth(selectedDate), [selectedDate, getDaysInMonth]);
    const today = new Date();

    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-n-5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md hover:bg-n-2"
                            onClick={() => navigateMonth(-1)}
                        >
                            <ChevronLeft className="w-4 h-4 text-n-8" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md hover:bg-n-2"
                            onClick={() => navigateMonth(1)}
                        >
                            <ChevronRight className="w-4 h-4 text-n-8" />
                        </Button>
                    </div>
                    <h2 className="text-lg font-semibold text-n-11 capitalize">
                        {MONTHS[currentMonth]} {currentYear}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-medium border-n-5 text-n-8 hover:text-n-11"
                        onClick={goToToday}
                    >
                        Hoy
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 px-3 gap-1.5 bg-b-8 hover:bg-b-8/90 text-white"
                        onClick={() => onNewAppointment?.(selectedDate)}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Nueva Cita</span>
                    </Button>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-n-5">
                {DAYS_OF_WEEK.map((day) => (
                    <div
                        key={day}
                        className="px-2 py-2.5 text-center text-[11px] font-medium text-n-8 uppercase tracking-wide"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6">
                {days.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === currentMonth;
                    const isToday = day.toDateString() === today.toDateString();
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    const dayAppointments = getAppointmentsForDate(day);

                    return (
                        <Popover key={index}>
                            <PopoverTrigger asChild>
                                <button
                                    className={cn(
                                        "relative flex flex-col items-start p-1.5 border-r border-b border-n-5/50 hover:bg-n-2/50 transition-colors text-left",
                                        !isCurrentMonth && "bg-n-1",
                                        isToday && isSelected && "bg-b-8/5",
                                        isToday && !isSelected && "bg-b-8/5 hover:bg-b-8/10"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-sm font-medium min-h-[28px] min-w-[28px] flex items-center justify-center rounded-md",
                                            isCurrentMonth ? "text-n-11" : "text-n-5",
                                            isToday && "bg-b-8 text-white",
                                            isSelected && !isToday && "bg-n-11 text-n-1"
                                        )}
                                    >
                                        {day.getDate()}
                                    </span>

                                    {/* Event Indicators */}
                                    {dayAppointments.length > 0 && (
                                        <div className="flex flex-wrap gap-0.5 mt-1 px-0.5">
                                            {dayAppointments.slice(0, 3).map((apt, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        FHIR_STATUS_CONFIG[apt.status]?.colorClass || 'bg-n-5'
                                                    )}
                                                />
                                            ))}
                                            {dayAppointments.length > 3 && (
                                                <span className="text-[9px] text-n-8 font-medium">
                                                    +{dayAppointments.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            </PopoverTrigger>

                            <PopoverContent
                                align="start"
                                className="w-72 p-0 max-h-80 overflow-y-auto"
                                sideOffset={2}
                            >
                                <div className="p-3 border-b border-n-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-n-11 capitalize">
                                            {DAYS_OF_WEEK[day.getDay()]} {day.getDate()} de {MONTHS[day.getMonth()]}
                                        </span>
                                        <span className="text-xs text-n-8">
                                            {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                                        </span>
                                    </div>
                                </div>

                                <div className="py-2">
                                    {dayAppointments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                            <Clock className="w-8 h-8 text-n-5 opacity-20 mb-2" />
                                            <p className="text-sm text-n-8">Sin citas</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2 h-7 text-xs text-b-8 hover:bg-b-8/10"
                                                onClick={() => onNewAppointment?.(day)}
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Agregar cita
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 px-2">
                                            {dayAppointments.map((apt) => {
                                                const statusConfig = FHIR_STATUS_CONFIG[apt.status];
                                                const patientName = apt.patient
                                                    ? `${apt.patient.name_family}, ${apt.patient.name_given?.join(' ')}`
                                                    : 'Paciente';

                                                return (
                                                    <button
                                                        key={apt.id}
                                                        onClick={() => onEventClick?.(apt)}
                                                        className={cn(
                                                            "w-full flex flex-col items-start p-2 rounded-md border-l-4 hover:bg-n-2 transition-colors text-left",
                                                            statusConfig?.borderClass || 'border-l-n-5'
                                                        )}
                                                    >
                                                        <span className="text-sm font-medium text-n-11 truncate w-full">
                                                            {patientName}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs font-mono text-n-8">
                                                                {formatTime(apt.start_time)}
                                                            </span>
                                                            <Badge
                                                                variant="secondary"
                                                                className={cn(
                                                                    "h-4 px-1.5 text-[10px] font-medium",
                                                                    statusConfig?.colorClass || 'bg-n-5/20 text-n-8'
                                                                )}
                                                            >
                                                                {statusConfig?.label || apt.status}
                                                            </Badge>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    );
                })}
            </div>
        </div>
    );
}