'use client';

import React, { useMemo, useCallback } from 'react';
import { Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useAppointmentsStore } from '@/store/useAppointmentsStore';
import type { Appointment } from '@/lib/fhir/types';
import { formatTime } from '@/lib/date-utils';
import { FHIR_STATUS_CONFIG, FHIR_STATUS_COLORS, FHIR_STATUS_PILL_VARIANT, formatPatientName } from '@/lib/appointmentConstants';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface MonthlyCalendarProps {
    appointments: Appointment[];
    onEventClick?: (appointment: Appointment) => void;
    onNewAppointment?: (date: Date) => void;
}

export default function MonthlyCalendar({
    appointments,
    onEventClick,
    onNewAppointment,
}: MonthlyCalendarProps) {
    const { selectedDate, statusFilter, patientSearch } = useAppointmentsStore();

    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt => {
            if (statusFilter.length > 0 && !statusFilter.includes(apt.status)) {
                return false;
            }
            if (patientSearch) {
                const patientName = apt.patient
                    ? formatPatientName(apt.patient).toLowerCase()
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

    const days = useMemo(() => getDaysInMonth(selectedDate), [selectedDate, getDaysInMonth]);
    const today = new Date();
    const currentMonth = selectedDate.getMonth();

    return (
        <div className="flex flex-col h-full bg-background border border-n-5 rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 border-b border-n-5 bg-n-2/30">
                {DAYS_OF_WEEK.map((day) => (
                    <div
                        key={day}
                        className="px-2 py-3 text-center text-xs font-semibold text-n-8 uppercase tracking-wider border-r border-n-5 last:border-r-0"
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="flex-1 grid grid-cols-7 grid-rows-6">
                {days.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === currentMonth;
                    const isToday = day.toDateString() === today.toDateString();
                    const isSelected = day.toDateString() === selectedDate.toDateString();
                    const dayAppointments = getAppointmentsForDate(day);
                    const isLastColumn = (index + 1) % 7 === 0;
                    const isLastRow = index >= 35;

                    return (
                        <Popover key={index}>
                            <PopoverTrigger asChild>
                                <button
                                    disabled={!isCurrentMonth}
                                    className={cn(
                                        "relative flex flex-col items-start p-2 border-r border-b border-n-5 transition-colors text-left",
                                        isLastColumn && "border-r-0",
                                        isLastRow && "border-b-0",
                                        isCurrentMonth ? "hover:bg-n-2 cursor-pointer" : "bg-n-3/30 cursor-not-allowed",
                                        isToday && isSelected && "bg-b-8/10",
                                        isToday && !isSelected && "bg-b-8/5 hover:bg-b-8/10"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-base font-medium w-8 h-8 flex items-center justify-center rounded-[6px] transition-all",
                                            isCurrentMonth ? "text-n-11" : "text-n-5",
                                            isToday && "bg-b-8 text-white ring-2 ring-b-8/30 ring-offset-1",
                                            isSelected && !isToday && "bg-n-11 text-n-1"
                                        )}
                                    >
                                        {day.getDate()}
                                    </span>

                                    {dayAppointments.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1 px-0.5">
                                            {dayAppointments.slice(0, 2).map((apt, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="secondary"
                                                    className={cn(
                                                        "text-[8px] px-1 py-0 leading-tight max-w-full truncate",
                                                        FHIR_STATUS_COLORS[apt.status] ? "" : "text-n-8"
                                                    )}
                                                >
                                                    {apt.appointment_type || 'Consulta'}
                                                </Badge>
                                            ))}
                                            {dayAppointments.length > 2 && (
                                                <span className="text-[9px] text-n-8 font-medium self-center">
                                                    +{dayAppointments.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            </PopoverTrigger>

                            <PopoverContent
                                align="start"
                                className="w-80 p-0 max-h-80 overflow-y-auto"
                                sideOffset={2}
                            >
                                <Card className="border-0 shadow-none rounded-none">
                                    <CardHeader className="flex-row items-center justify-between px-4 py-3 border-b border-n-5/50">
                                        <span className="text-sm font-semibold text-n-11 capitalize">
                                            {DAYS_OF_WEEK[day.getDay()]} {day.getDate()} de {MONTHS[day.getMonth()]}
                                        </span>
                                        <Badge variant="secondary" className="text-[10px]">
                                            {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                                        </Badge>
                                    </CardHeader>

                                    <CardContent className="p-0">
                                        {dayAppointments.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <Clock className="w-8 h-8 text-n-5 opacity-30 mb-2" />
                                                <p className="text-sm text-n-8">Sin citas</p>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="mt-2 h-6 text-xs text-b-8 hover:text-b-7 p-0"
                                                    onClick={() => onNewAppointment?.(day)}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Nueva Cita
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-1 py-2">
                                                {dayAppointments.map((apt) => {
                                                    const statusConfig = FHIR_STATUS_CONFIG[apt.status];
                                                    const patientName = formatPatientName(apt.patient);

                                                    return (
                                                        <button
                                                            key={apt.id}
                                                            onClick={() => onEventClick?.(apt)}
                                                            className={cn(
                                                                "w-full flex flex-col items-start px-3 py-2 hover:bg-n-2/50 transition-colors text-left",
                                                                "border-l-4",
                                                                statusConfig?.borderClass || 'border-l-n-5'
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2 w-full">
                                                                <span className="text-sm font-medium text-n-11 truncate flex-1">
                                                                    {patientName}
                                                                </span>
                                                                <Badge
                                                                    variant={FHIR_STATUS_PILL_VARIANT[apt.status] as 'pill' | 'pill-success' | 'pill-warning' | 'pill-danger' | 'pill-info' | 'pill-neutral'}
                                                                    className="shrink-0 text-[9px]"
                                                                >
                                                                    {statusConfig?.label || apt.status}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 w-full">
                                                                <span className="text-[11px] font-mono text-n-8">
                                                                    {formatTime(apt.start_time)}
                                                                </span>
                                                                {apt.appointment_type && (
                                                                    <Badge variant="secondary" className="text-[9px] text-n-8">
                                                                        {apt.appointment_type}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </PopoverContent>
                        </Popover>
                    );
                })}
            </div>
        </div>
    );
}