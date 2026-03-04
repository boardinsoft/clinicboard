'use client';

import React, { useState } from 'react';
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Mock appointment data
const appointmentsByHour: Record<string, Array<{
    id: string;
    patient: string;
    type: string;
    status: 'draft' | 'confirmed' | 'in-consultation' | 'completed' | 'cancelled';
    duration: number;
}>> = {
    '08:00': [],
    '08:30': [
        { id: '1', patient: 'María García', type: 'Control', status: 'completed', duration: 30 },
    ],
    '09:00': [
        { id: '2', patient: 'Carlos López', type: 'Consulta General', status: 'in-consultation', duration: 30 },
    ],
    '09:30': [],
    '10:00': [
        { id: '3', patient: 'Ana Rodríguez', type: 'Primera Vez', status: 'confirmed', duration: 45 },
    ],
    '10:30': [],
    '11:00': [
        { id: '4', patient: 'Luis Martínez', type: 'Seguimiento', status: 'confirmed', duration: 30 },
    ],
    '11:30': [],
    '12:00': [],
    '14:00': [
        { id: '5', patient: 'Carmen Sánchez', type: 'Control', status: 'draft', duration: 30 },
    ],
    '14:30': [],
    '15:00': [
        { id: '6', patient: 'Jorge Fernández', type: 'Consulta General', status: 'draft', duration: 30 },
    ],
    '15:30': [],
    '16:00': [],
};

const statusConfig: Record<string, { label: string; colorClass: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Borrador', colorClass: 'border-muted-foreground/30 text-muted-foreground', badgeVariant: 'outline' },
    confirmed: { label: 'Confirmada', colorClass: 'bg-primary/10 text-primary border-primary/20', badgeVariant: 'secondary' },
    'in-consultation': { label: 'En Consulta', colorClass: 'bg-accent text-accent-foreground border-accent-foreground/10', badgeVariant: 'secondary' },
    completed: { label: 'Completada', colorClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', badgeVariant: 'secondary' },
    cancelled: { label: 'Cancelada', colorClass: '', badgeVariant: 'destructive' },
};

const statusBorderConfig: Record<string, string> = {
    draft: 'border-l-muted-foreground/30',
    confirmed: 'border-l-primary',
    'in-consultation': 'border-l-accent-foreground',
    completed: 'border-l-emerald-500',
    cancelled: 'border-l-destructive',
};

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function AppointmentsPage() {
    const [selectedDate] = useState(new Date());
    const [view, setView] = useState<'day' | 'week'>('day');

    const currentDateStr = selectedDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

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

    const totalAppointments = Object.values(appointmentsByHour).flat().length;
    const confirmedCount = Object.values(appointmentsByHour).flat().filter(a => a.status === 'confirmed').length;
    const completedCount = Object.values(appointmentsByHour).flat().filter(a => a.status === 'completed').length;

    return (
        <div className="flex flex-col h-[calc(100vh-48px)]">
            {/* Header */}
            <div className="flex justify-between items-start py-6 px-8 border-b border-border bg-background flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Citas</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gestión de agenda — FHIR R4 Appointment Resource
                    </p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Cita
                </Button>
            </div>

            <div className="flex flex-1 overflow-hidden bg-muted/20">
                {/* Calendar Sidebar */}
                <div className="w-[280px] bg-card border-r border-border p-6 flex-shrink-0 flex flex-col overflow-y-auto">
                    {/* Mini Calendar Header */}
                    <div className="flex justify-between items-center mb-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold capitalize">
                            {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Week Strip */}
                    <div className="flex justify-between mb-8 pb-4 border-b border-border/50">
                        {weekDays.map((day, i) => {
                            const isToday = day.toDateString() === new Date().toDateString();
                            const isSelected = day.toDateString() === selectedDate.toDateString();
                            return (
                                <div
                                    key={i}
                                    className={`flex flex-col items-center justify-center w-8 h-12 rounded-full cursor-pointer transition-colors ${isSelected
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : isToday
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'hover:bg-muted text-muted-foreground'
                                        }`}
                                >
                                    <div className={`text-[10px] mb-0.5 ${isSelected ? 'opacity-80' : ''}`}>
                                        {daysOfWeek[day.getDay()][0]}
                                    </div>
                                    <div className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* View Toggle */}
                    <div className="space-y-3 mb-8">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vista</label>
                        <Select value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar vista" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Día</SelectItem>
                                <SelectItem value="week">Semana</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col space-y-4">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumen de hoy</label>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">Total</span>
                            <span className="text-sm font-semibold">{totalAppointments}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">Confirmadas</span>
                            <span className="text-sm font-semibold text-primary">{confirmedCount}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">Completadas</span>
                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{completedCount}</span>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto bg-background">
                    {/* Date Header */}
                    <div className="sticky top-0 z-10 px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                        <span className="text-base font-medium capitalize text-foreground">{currentDateStr}</span>
                    </div>

                    {/* Time Slots */}
                    <div className="flex flex-col pb-8">
                        {Object.entries(appointmentsByHour).map(([time, appointments]) => (
                            <div
                                key={time}
                                className={`flex border-b border-border/50 ${appointments.length > 0 ? 'min-h-[80px]' : 'min-h-[60px]'}`}
                            >
                                {/* Time Label */}
                                <div className="w-[80px] p-4 text-xs font-mono text-muted-foreground border-r border-border/50 flex-shrink-0 text-right pr-4">
                                    {time}
                                </div>

                                {/* Appointment Slot */}
                                <div className="flex-1 p-2">
                                    {appointments.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className={`flex items-center justify-between p-4 mb-2 last:mb-0 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${statusBorderConfig[apt.status]}`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-semibold text-foreground">{apt.patient}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                        <span className="font-medium text-foreground/70">{apt.type}</span>
                                                        <span className="text-muted-foreground/50">•</span>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{apt.duration}min</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Badge variant={statusConfig[apt.status].badgeVariant as 'default' | 'secondary' | 'destructive' | 'outline'} className={statusConfig[apt.status].badgeVariant === 'secondary' ? statusConfig[apt.status].colorClass : ''}>
                                                    {statusConfig[apt.status].label}
                                                </Badge>
                                                {apt.status === 'draft' && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-700 hover:bg-emerald-500/10">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
