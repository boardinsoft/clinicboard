'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatTime, nowInVE, formatRelativeTime } from '@/lib/date-utils';
import type { Appointment, AppointmentStatus } from '@/lib/fhir/types';
import {
    Kanban,
    KanbanBoard,
    KanbanColumn,
    KanbanColumnContent,
    KanbanItem,
} from '@/components/reui/kanban';

interface AppointmentsKanbanProps {
    appointments: Appointment[];
    onSelect: (id: string) => void;
    selectedId: string | null;
}

interface ColumnConfig {
    id: string;
    title: string;
    statuses: AppointmentStatus[];
}

const COLUMNS: ColumnConfig[] = [
    { id: 'proposed',  title: 'Propuestas',                statuses: ['proposed', 'pending'] },
    { id: 'confirmed', title: 'Confirmadas',               statuses: ['booked'] },
    { id: 'arrived',   title: 'En Espera',                 statuses: ['arrived'] },
    { id: 'completed', title: 'En Consulta / Finalizadas', statuses: ['fulfilled'] },
];

// Mapa de estado → etiqueta + color de texto semántico
// Los colores usan var(--apt-status-*) definidos en globals.css
const STATUS_CONFIG: Record<AppointmentStatus, { label: string; colorStyle: string }> = {
    proposed:  { label: 'Propuesta',  colorStyle: 'var(--n-8)' },
    pending:   { label: 'Pendiente',  colorStyle: 'var(--s-warning)' },
    booked:    { label: 'Confirmada', colorStyle: 'var(--b-8)' },
    arrived:   { label: 'En espera',  colorStyle: 'var(--s-info)' },
    fulfilled: { label: 'Completada', colorStyle: 'var(--s-success)' },
    cancelled: { label: 'Cancelada',  colorStyle: 'var(--s-danger)' },
    noshow:    { label: 'No asistió', colorStyle: 'var(--s-danger)' },
};

const COLUMN_STATUSES: Record<string, AppointmentStatus[]> = Object.fromEntries(
    COLUMNS.map((col) => [col.id, col.statuses])
);

function toKanbanValue(appointments: Appointment[]): Record<string, Appointment[]> {
    return Object.fromEntries(
        Object.entries(COLUMN_STATUSES).map(([colId, statuses]) => [
            colId,
            appointments.filter((apt) => statuses.includes(apt.status)),
        ])
    );
}

function AppointmentCard({
    apt,
    isActive,
    onClick,
}: {
    apt: Appointment;
    isActive: boolean;
    onClick: () => void;
}) {
    const now = nowInVE();
    const patientName = apt.patient
        ? `${apt.patient.name_family}, ${apt.patient.name_given?.join(' ')}`
        : 'Paciente desconocido';
    const isPast = new Date(apt.start_time) < now && apt.status !== 'fulfilled';
    const statusCfg = STATUS_CONFIG[apt.status];

    return (
        <Card
            onClick={onClick}
            className={cn(
                'cursor-pointer transition-all hover:translate-y-[-2px] active:translate-y-0',
                'border-border/40 hover:border-primary/30 group bg-card',
                isActive ? 'ring-2 ring-primary/40 shadow-md border-primary' : 'shadow-sm'
            )}
        >
            <CardContent className="p-3">
                {/* Fila superior: hora + etiqueta de estado */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-muted-foreground">
                        <Clock className="w-3 h-3 shrink-0" />
                        {formatTime(apt.start_time)}
                    </div>
                    {statusCfg && (
                        <span
                            className="font-bold text-[9px] uppercase tracking-widest shrink-0"
                            style={{
                                color: statusCfg.colorStyle,
                            }}
                        >
                            {statusCfg.label}
                        </span>
                    )}
                </div>

                {/* Nombre del paciente */}
                <div className="text-sm font-bold leading-tight group-hover:text-primary transition-colors tracking-tight text-foreground">
                    {patientName}
                </div>

                {/* Badges secundarios */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                        variant="outline"
                        className="border-none bg-muted/60 text-muted-foreground font-bold uppercase text-[9px] px-1.5 h-4.5"
                    >
                        {apt.appointment_type || 'Consulta'}
                    </Badge>
                    
                    {apt.status === 'arrived' && (
                        <Badge
                            className="bg-orange-500/10 border-none font-bold text-orange-600 dark:text-orange-400 uppercase text-[9px] px-1.5 h-4.5"
                        >
                            {formatRelativeTime(apt.updated_at)}
                        </Badge>
                    )}
                    
                    {isPast && (
                        <div className="flex items-center text-amber-600 dark:text-amber-500 gap-1">
                            <AlertCircle className="w-3 h-3" />
                        </div>
                    )}
                    
                    {apt.status === 'fulfilled' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function AppointmentsKanban({
    appointments,
    onSelect,
    selectedId,
}: AppointmentsKanbanProps) {
    const kanbanValue = toKanbanValue(appointments);

    return (
        <Kanban
            value={kanbanValue}
            onValueChange={() => {}}
            getItemValue={(apt) => apt.id}
            className="h-full"
        >
            <KanbanBoard className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 h-full overflow-hidden">
                {COLUMNS.map((column) => {
                    const items = kanbanValue[column.id] ?? [];

                    return (
                        <KanbanColumn
                            key={column.id}
                            value={column.id}
                            className="bg-muted/40 rounded-xl h-full max-h-full overflow-hidden border border-border/50"
                        >
                            {/* Column Header */}
                            <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b border-border/40">
                                <h3 className="text-sm font-semibold text-foreground">
                                    {column.title}
                                </h3>
                                <Badge
                                    variant="secondary"
                                    className="h-5 px-1.5 min-w-5 justify-center font-mono text-[11px]"
                                >
                                    {items.length}
                                </Badge>
                            </div>

                            {/* Items */}
                            <KanbanColumnContent
                                value={column.id}
                                className="kanban-col-fade flex-1 px-2 pt-2 pb-4 overflow-y-auto gap-2 min-h-0"
                            >
                                {items.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center gap-1 opacity-40 select-none">
                                        <span className="text-xs font-semibold">Sin citas</span>
                                        <span className="text-[11px] text-muted-foreground">Bandeja vacía por ahora</span>
                                    </div>
                                ) : (
                                    items.map((apt) => (
                                        <KanbanItem key={apt.id} value={apt.id}>
                                            <AppointmentCard
                                                apt={apt}
                                                isActive={selectedId === apt.id}
                                                onClick={() => onSelect(apt.id)}
                                            />
                                        </KanbanItem>
                                    ))
                                )}
                            </KanbanColumnContent>
                        </KanbanColumn>
                    );
                })}
            </KanbanBoard>
        </Kanban>
    );
}
