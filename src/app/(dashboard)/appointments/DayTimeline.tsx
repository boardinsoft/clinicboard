'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppointmentsStore } from '@/store/useAppointmentsStore';
import type { Appointment } from '@/lib/fhir/types';
import { nowInVE } from '@/lib/date-utils';
import { FHIR_STATUS_CONFIG, FHIR_STATUS_PILL_VARIANT, formatPatientName } from '@/lib/appointmentConstants';
import {
    confirmAppointment,
    markArrived,
    markNoShow,
    cancelAppointment,
    startConsultationFromAppointment
} from '@/actions/appointments';
import { toast } from 'sonner';

const START_HOUR = 8;
const END_HOUR = 20;

const AVATAR_COLORS: Record<string, string> = {
    proposed: 'bg-n-5',
    pending: 'bg-warning',
    booked: 'bg-info',
    arrived: 'bg-warning',
    fulfilled: 'bg-success',
    cancelled: 'bg-n-6',
    noshow: 'bg-n-7',
};

interface DayTimelineProps {
    appointments: Appointment[];
    onEventClick?: (appointment: Appointment) => void;
    onRefresh?: () => void;
}

export default function DayTimeline({ appointments, onEventClick, onRefresh }: DayTimelineProps) {
    const { selectedDate } = useAppointmentsStore();
    const [now, setNow] = useState(nowInVE());

    useEffect(() => {
        const interval = setInterval(() => setNow(nowInVE()), 60000);
        return () => clearInterval(interval);
    }, []);

    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt => {
            const aptDate = new Date(apt.start_time);
            return aptDate.toDateString() === selectedDate.toDateString();
        });
    }, [appointments, selectedDate]);

    const appointmentsByHour = useMemo(() => {
        const grouped: Record<number, Appointment[]> = {};
        filteredAppointments.forEach(apt => {
            const start = new Date(apt.start_time);
            const hour = start.getHours();
            if (!grouped[hour]) grouped[hour] = [];
            grouped[hour].push(apt);
        });
        Object.keys(grouped).forEach(hour => {
            grouped[Number(hour)].sort((a, b) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            );
        });
        return grouped;
    }, [filteredAppointments]);

    const sortedHours = useMemo(() => {
        return Object.keys(appointmentsByHour)
            .map(Number)
            .sort((a, b) => a - b);
    }, [appointmentsByHour]);

    const isToday = selectedDate.toDateString() === new Date().toDateString();

    const nowHour = now.getHours();
    const nowMinutes = now.getMinutes();
    const isNowInView = isToday && nowHour >= START_HOUR && nowHour <= END_HOUR;

    const formatTime24h = (date: string | Date | null | undefined) => {
        if (!date) return '—';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    };

    const handleQuickAction = async (apt: Appointment, action: string) => {
        let result;
        switch (action) {
            case 'confirm':
                result = await confirmAppointment(apt.id);
                break;
            case 'arrived':
                result = await markArrived(apt.id);
                break;
            case 'noshow':
                result = await markNoShow(apt.id);
                break;
            case 'cancel':
                result = await cancelAppointment(apt.id, '');
                break;
            case 'start':
                result = await startConsultationFromAppointment(apt.id);
                break;
            default:
                return;
        }

        if (result.error) {
            toast.error(typeof result.error === 'string' ? result.error : 'Error');
        } else {
            toast.success(ActionsLabels[action]);
            onRefresh?.();
        }
    };

    const ActionsLabels: Record<string, string> = {
        confirm: 'Confirmada',
        arrived: 'Llegó',
        noshow: 'No asistó',
        cancel: 'Cancelar',
        start: 'Iniciar'
    };

    const ActionsColors: Record<string, string> = {
        confirm: 'bg-info/90 hover:bg-info text-white',
        arrived: 'bg-warning/90 hover:bg-warning text-white',
        noshow: 'bg-n-6/90 hover:bg-n-6 text-white',
        cancel: 'bg-destructive/90 hover:bg-destructive text-white',
        start: 'bg-success/90 hover:bg-success text-white'
    };

    const getQuickActions = (apt: Appointment) => {
        const actions = [];
        switch (apt.status) {
            case 'proposed':
                actions.push({ key: 'confirm', label: 'Confirmar' });
                break;
            case 'booked':
                actions.push({ key: 'arrived', label: 'Llegó' });
                actions.push({ key: 'cancel', label: 'Cancelar' });
                break;
            case 'pending':
                actions.push({ key: 'arrived', label: 'Llegó' });
                actions.push({ key: 'cancel', label: 'Cancelar' });
                break;
            case 'arrived':
                actions.push({ key: 'start', label: 'Iniciar' });
                break;
        }
        return actions;
    };

    const renderAppointmentCard = (apt: Appointment) => {
        const statusConfig = FHIR_STATUS_CONFIG[apt.status];
        const patientName = formatPatientName(apt.patient);
        const quickActions = getQuickActions(apt);
        const startTime = formatTime24h(apt.start_time);
        const endTime = formatTime24h(apt.end_time);
        const patientInitials = patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        const avatarColor = AVATAR_COLORS[apt.status] || 'bg-n-5';

        return (
            <Card
                key={apt.id}
                className="cursor-pointer hover:border-n-4 transition-all duration-100 group"
                onClick={() => onEventClick?.(apt)}
            >
                <CardHeader className="flex-row items-center gap-2 px-3 py-2">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                        avatarColor
                    )}>
                        {patientInitials}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-n-11 truncate">
                            {patientName}
                        </p>
                        <p className="text-xs text-n-9 font-mono tabular-nums">
                            {startTime} — {endTime}
                        </p>
                    </div>

                    <Badge
                        variant={FHIR_STATUS_PILL_VARIANT[apt.status] as 'pill' | 'pill-success' | 'pill-warning' | 'pill-danger' | 'pill-info' | 'pill-neutral'}
                        className="shrink-0"
                    >
                        {statusConfig.label}
                    </Badge>

                    {quickActions.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-n-3/50 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                            {quickActions.map((action) => (
                                <Button
                                    key={action.key}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 px-2 text-[10px] font-semibold focus-visible:ring-2 focus-visible:ring-b-8",
                                        ActionsColors[action.key]
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickAction(apt, action.key);
                                    }}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </CardHeader>
            </Card>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex-1 overflow-auto px-4 py-2">
                {filteredAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full ml-14">
                        <CalendarDays className="w-12 h-12 text-n-4 opacity-25 mb-2" />
                        <p className="text-xs text-n-8 font-medium">Sin citas para este día</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {isNowInView && (
                            <div className="sticky top-0 z-30 flex items-center gap-2 mb-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                <span className="text-[10px] font-bold text-destructive tracking-wide bg-destructive/10 px-2 py-0.5 rounded-full">
                                    AHORA · {nowHour.toString().padStart(2, '0')}:{nowMinutes.toString().padStart(2, '0')}
                                </span>
                            </div>
                        )}

                        {sortedHours.map(hour => (
                            <div key={hour}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5">
                                        {hour.toString().padStart(2, '0')}:00
                                    </Badge>
                                    <div className="flex-1 h-px bg-n-3/30" />
                                </div>
                                <div className="space-y-2">
                                    {appointmentsByHour[hour].map(renderAppointmentCard)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}