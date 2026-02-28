'use client';

import React, { useState } from 'react';
import {
    Button,
    Tile,
    Tag,
    Select,
    SelectItem,
    TextInput,
} from '@carbon/react';
import {
    Add,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Events,
    Time,
    UserAvatar,
} from '@carbon/icons-react';

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

const statusConfig: Record<string, { label: string; color: string; tagType: 'green' | 'blue' | 'purple' | 'gray' | 'red' }> = {
    draft: { label: 'Borrador', color: 'var(--cds-text-secondary)', tagType: 'gray' },
    confirmed: { label: 'Confirmada', color: 'var(--cds-interactive)', tagType: 'blue' },
    'in-consultation': { label: 'En Consulta', color: 'var(--clinicboard-accent)', tagType: 'purple' },
    completed: { label: 'Completada', color: 'var(--cds-support-success)', tagType: 'green' },
    cancelled: { label: 'Cancelada', color: 'var(--cds-support-error)', tagType: 'red' },
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
        <div style={{ padding: 0 }}>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="page-header__title">Citas</h1>
                        <p className="page-header__subtitle">
                            Gestión de agenda — FHIR R4 Appointment Resource
                        </p>
                    </div>
                    <Button kind="primary" renderIcon={Add}>
                        Nueva Cita
                    </Button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1px', background: 'var(--cds-border-subtle)' }}>
                {/* Calendar Sidebar */}
                <div style={{ width: '280px', background: 'var(--cds-layer-01)', padding: '1.5rem', flexShrink: 0 }}>
                    {/* Mini Calendar Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <Button kind="ghost" size="sm" hasIconOnly renderIcon={ChevronLeft} iconDescription="Semana anterior" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button kind="ghost" size="sm" hasIconOnly renderIcon={ChevronRight} iconDescription="Semana siguiente" />
                    </div>

                    {/* Week Strip */}
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '1.5rem' }}>
                        {weekDays.map((day, i) => {
                            const isToday = day.toDateString() === new Date().toDateString();
                            const isSelected = day.toDateString() === selectedDate.toDateString();
                            return (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        padding: '0.5rem 0',
                                        cursor: 'pointer',
                                        background: isSelected ? 'var(--cds-interactive)' : 'var(--cds-layer-02)',
                                        color: isSelected ? '#fff' : 'var(--cds-text-primary)',
                                        borderBottom: isToday && !isSelected ? '2px solid var(--clinicboard-accent)' : 'none',
                                    }}
                                >
                                    <div style={{ fontSize: '0.625rem', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                                        {daysOfWeek[day.getDay()]}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{day.getDate()}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--cds-border-subtle)' }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>Total</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{totalAppointments}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--cds-border-subtle)' }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>Confirmadas</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cds-interactive)' }}>{confirmedCount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--cds-border-subtle)' }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)' }}>Completadas</span>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cds-support-success)' }}>{completedCount}</span>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <Select
                        id="view-select"
                        labelText="Vista"
                        value={view}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setView(e.target.value as 'day' | 'week')}
                    >
                        <SelectItem value="day" text="Día" />
                        <SelectItem value="week" text="Semana" />
                    </Select>
                </div>

                {/* Timeline */}
                <div style={{ flex: 1, background: 'var(--cds-background)', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
                    {/* Date Header */}
                    <div style={{ padding: '1rem 1.5rem', background: 'var(--cds-layer-01)', borderBottom: '1px solid var(--cds-border-subtle)', position: 'sticky', top: 0, zIndex: 1 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, textTransform: 'capitalize' }}>{currentDateStr}</span>
                    </div>

                    {/* Time Slots */}
                    {Object.entries(appointmentsByHour).map(([time, appointments]) => (
                        <div
                            key={time}
                            style={{
                                display: 'flex',
                                borderBottom: '1px solid var(--cds-border-subtle)',
                                minHeight: appointments.length > 0 ? '80px' : '48px',
                            }}
                        >
                            {/* Time Label */}
                            <div style={{
                                width: '80px',
                                padding: '0.75rem 1rem',
                                fontFamily: 'IBM Plex Mono',
                                fontSize: '0.75rem',
                                color: 'var(--cds-text-secondary)',
                                borderRight: '1px solid var(--cds-border-subtle)',
                                flexShrink: 0,
                            }}>
                                {time}
                            </div>

                            {/* Appointment Slot */}
                            <div style={{ flex: 1, padding: appointments.length > 0 ? '0.5rem 1rem' : '0' }}>
                                {appointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem 1rem',
                                            background: 'var(--cds-layer-01)',
                                            borderLeft: `3px solid ${statusConfig[apt.status].color}`,
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cds-layer-02)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--cds-layer-01)')}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <UserAvatar size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                                            <div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{apt.patient}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span>{apt.type}</span>
                                                    <span>·</span>
                                                    <Time size={12} />
                                                    <span>{apt.duration}min</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Tag type={statusConfig[apt.status].tagType} size="sm">
                                                {statusConfig[apt.status].label}
                                            </Tag>
                                            {apt.status === 'draft' && (
                                                <Button kind="ghost" size="sm" hasIconOnly renderIcon={Events} iconDescription="Confirmar por WhatsApp" />
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
    );
}
