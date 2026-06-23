'use client';

import React from 'react';
import {
    CheckCircle,
    Ban,
    PauseCircle,
    RotateCcw,
    History,
    Activity,
    Printer,
    FilePlus,
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime } from '@/lib/date-utils';
import { EmptyStatePresentational } from '@/components/ui/EmptyStatePresentational';
import type { LucideIcon } from 'lucide-react';

interface AuditEntry {
    id: string;
    action: string;
    old_status: string | null;
    new_status: string | null;
    changed_at: string;
    reason: string | null;
    changed_by_practitioner?: {
        name_given: string[];
        name_family: string;
    } | null;
}

interface PrescriptionHistorySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    prescriptionNumber: string | null;
    auditLog: AuditEntry[];
}

type ActionConfig = {
    icon: LucideIcon;
    colorVar: string;
    label: string;
    description: string;
    isDefinite?: boolean;
};

const ACTION_CONFIG: Record<string, ActionConfig> = {
    create: {
        icon: FilePlus,
        colorVar: 's-info',
        label: 'Creada',
        description: 'Receta creada en estado inicial',
    },
    activate: {
        icon: CheckCircle,
        colorVar: 's-success',
        label: 'Activada',
        description: 'Confirmar receta y poner en vigor',
    },
    cancel: {
        icon: Ban,
        colorVar: 's-danger',
        label: 'Cancelada',
        description: 'Receta cancelada permanentemente',
        isDefinite: true,
    },
    complete: {
        icon: CheckCircle,
        colorVar: 's-success',
        label: 'Completada',
        description: 'Tratamiento finalizado',
    },
    pause: {
        icon: PauseCircle,
        colorVar: 's-warning',
        label: 'Pausada',
        description: 'Receta suspendida temporalmente',
    },
    resume: {
        icon: RotateCcw,
        colorVar: 's-info',
        label: 'Reanudada',
        description: 'Receta reactivada',
    },
    print: {
        icon: Printer,
        colorVar: 's-info',
        label: 'Impresa',
        description: 'Generación de PDF',
    },
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activa',
    'on-hold': 'Pausada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    stopped: 'Detenida',
    unknown: 'Desconocido',
};

function getStatusLabel(status: string | null): string {
    if (!status) return '—';
    return STATUS_LABELS[status] ?? status;
}

function formatRelativeTime(isoDate: string): string {
    const now = Date.now();
    const date = new Date(isoDate).getTime();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'hace un momento';
    if (minutes < 60) return `hace ${minutes} min`;
    if (hours < 24) return `hace ${hours}h`;
    if (days === 1) return 'ayer';
    if (days < 7) return `hace ${days} días`;
    return formatDate(isoDate);
}

function getActionConfig(action: string): ActionConfig {
    return (
        ACTION_CONFIG[action] ?? {
            icon: History,
            colorVar: 'n-8',
            label: action,
            description: 'Acción no registrada',
        }
    );
}

function VerticalTimelineEntry({
    entry,
    isLast,
}: {
    entry: AuditEntry;
    isLast: boolean;
}) {
    const config = getActionConfig(entry.action);
    const Icon = config.icon;
    const practitionerName = entry.changed_by_practitioner
        ? `Dr. ${entry.changed_by_practitioner.name_family}`
        : null;

    return (
        <li className="flex items-start gap-3 list-none">
            {/* Dot + line column */}
            <div className="flex flex-col items-center shrink-0">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                        backgroundColor: `var(--${config.colorVar}-bg, rgba(0,0,0,0.08))`,
                        color: `var(--${config.colorVar}, var(--n-8))`,
                    }}
                >
                    <Icon className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
                </div>
                {!isLast && (
                    <div
                        className="w-px flex-1 mt-1.5 mb-0 min-h-[20px]"
                        style={{ backgroundColor: 'var(--n-5, #2a2a2a)' }}
                        aria-hidden="true"
                    />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-5">
                {/* Action label + definite badge */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-n-11">
                        {config.label}
                    </span>
                    {config.isDefinite && (
                        <Badge
                            variant="pill-danger"
                            className="text-[10px]"
                        >
                            Definitivo
                        </Badge>
                    )}
                </div>

                {/* Description */}
                <p className="text-[12px] text-n-8 mt-0.5">
                    {config.description}
                </p>

                {/* Reason as quoted block */}
                {entry.reason && (
                    <p className="text-[13px] text-n-9 mt-1.5 leading-relaxed italic">
                        &ldquo;{entry.reason}&rdquo;
                    </p>
                )}

                {/* Status transition pill — only when old_status is known */}
                {entry.old_status &&
                    entry.new_status &&
                    entry.old_status !== 'unknown' && (
                        <div className="mt-1.5">
                            <Badge variant="pill-neutral" className="text-[10px] font-mono gap-1">
                                {getStatusLabel(entry.old_status)}
                                <span className="text-n-6" aria-hidden="true">
                                    →
                                </span>
                                {getStatusLabel(entry.new_status)}
                            </Badge>
                        </div>
                    )}

                {/* Meta line: practitioner + relative time */}
                <div className="flex items-center gap-1.5 mt-2">
                    {practitionerName && (
                        <>
                            <span className="text-[11px] text-n-8">{practitionerName}</span>
                            <span className="text-n-6" aria-hidden="true">
                                ·
                            </span>
                        </>
                    )}
                    <time
                        dateTime={entry.changed_at}
                        className="text-[11px] text-n-8 font-mono"
                        title={`${formatDate(entry.changed_at)} ${formatTime(entry.changed_at)}`}
                    >
                        {formatRelativeTime(entry.changed_at)}
                    </time>
                </div>
            </div>
        </li>
    );
}

export function PrescriptionHistorySheet({
    open,
    onOpenChange,
    prescriptionNumber,
    auditLog,
}: PrescriptionHistorySheetProps) {
    const eventCount = auditLog.length;
    const eventLabel =
        eventCount === 0
            ? 'Sin cambios registrados'
            : `${eventCount} ${eventCount === 1 ? 'evento' : 'eventos'} en el historial`;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="sm:max-w-lg flex flex-col p-0 gap-0"
                aria-label="Historial de cambios de la receta"
            >
                <SheetHeader className="px-6 py-5 pb-4 border-b border-n-5/30">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity
                            className="w-4 h-4 text-b-8"
                            strokeWidth={1.8}
                            aria-hidden="true"
                        />
                        <span className="text-[11px] font-semibold text-n-8 uppercase tracking-wider">
                            Actividad
                        </span>
                    </div>
                    <SheetTitle className="text-lg font-bold text-n-11">
                        Historial de cambios
                    </SheetTitle>
                    <SheetDescription className="text-[12px] text-n-8">
                        {eventLabel}
                        {prescriptionNumber && (
                            <span className="ml-1.5 font-mono text-n-9">
                                · {prescriptionNumber}
                            </span>
                        )}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="px-6 py-5">
                        {auditLog.length === 0 ? (
                            <EmptyStatePresentational
                                icon={History}
                                title="Sin cambios registrados"
                                description="Los cambios de estado de esta receta aparecerán aquí."
                                className="py-8"
                            />
                        ) : (
                            <ol
                                className="space-y-0"
                                role="list"
                                aria-label="Eventos del historial"
                            >
                                {auditLog.map((entry, index) => (
                                    <VerticalTimelineEntry
                                        key={entry.id}
                                        entry={entry}
                                        isLast={index === auditLog.length - 1}
                                    />
                                ))}
                            </ol>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
