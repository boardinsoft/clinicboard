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
    {
        id: 'proposed',
        title: 'Propuestas',
        statuses: ['proposed', 'pending'],
    },
    {
        id: 'confirmed',
        title: 'Confirmadas',
        statuses: ['booked'],
    },
    {
        id: 'arrived',
        title: 'En Espera',
        statuses: ['arrived'],
    },
    {
        id: 'completed',
        title: 'En Consulta / Finalizadas',
        statuses: ['fulfilled'],
    },
];

const STATUS_DOT_COLORS: Record<string, string> = {
    proposed: 'bg-muted-foreground/30',
    pending: 'bg-amber-400',
    booked: 'bg-blue-500',
    arrived: 'bg-orange-500',
    fulfilled: 'bg-emerald-500',
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

    return (
        <Card
            onClick={onClick}
            className={cn(
                'cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border-border/40 hover:border-primary/30 group',
                isActive ? 'ring-2 ring-primary/50 shadow-md border-primary' : 'shadow-sm'
            )}
        >
            <CardContent className="p-3">
                <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/80">
                        <Clock className="w-3 h-3" />
                        {formatTime(apt.start_time)}
                    </div>
                    <div
                        className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            STATUS_DOT_COLORS[apt.status] || 'bg-slate-300'
                        )}
                    />
                </div>

                <div className="text-[13px] font-bold leading-tight group-hover:text-primary transition-colors">
                    {patientName}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                        variant="outline"
                        className="h-4 px-1 py-0 text-[8px] bg-muted/30 border-none font-medium text-muted-foreground uppercase opacity-80"
                    >
                        {apt.appointment_type || 'Consulta'}
                    </Badge>
                    {apt.status === 'arrived' && (
                        <Badge className="h-4 px-2 py-0.5 text-[9px] bg-orange-500 border-none font-bold text-white uppercase">
                            Tiempo de espera: {formatRelativeTime(apt.updated_at)}
                        </Badge>
                    )}
                    {isPast && (
                        <Badge className="h-4 px-1 py-0 text-[8px] bg-amber-500/10 border border-amber-500/20 font-bold text-amber-700 dark:text-amber-400 uppercase gap-1">
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
                            <div className="px-4 py-3 flex items-center justify-between shrink-0">
                                <h3 className="text-sm font-semibold text-foreground">
                                    {column.title}
                                </h3>
                                <Badge
                                    variant="secondary"
                                    className="h-5 px-1.5 min-w-5 justify-center font-mono text-[10px]"
                                >
                                    {items.length}
                                </Badge>
                            </div>

                            {/* Items */}
                            <KanbanColumnContent
                                value={column.id}
                                className="flex-1 px-2 pt-1 pb-4 overflow-y-auto gap-2 min-h-0"
                            >
                                {items.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center opacity-20 select-none">
                                        <span className="text-xs font-medium">Sin citas</span>
                                    </div>
                                ) : (
                                    items.map((apt) => (
                                        <KanbanItem
                                            key={apt.id}
                                            value={apt.id}
                                        >
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
