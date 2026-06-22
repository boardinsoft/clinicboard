'use client';

import React from 'react';
import {
    CheckCircle,
    Ban,
    PauseCircle,
    RotateCcw,
    History,
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/date-utils';
import { EmptyStatePresentational } from '@/components/ui/EmptyStatePresentational';

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

interface AuditLogTimelineProps {
    auditLog: AuditEntry[];
}

const ACTION_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>; colorClass: string; label: string }> = {
    activate: { icon: CheckCircle, colorClass: 'text-s-success bg-s-success/10', label: 'Activada' },
    cancel:    { icon: Ban,        colorClass: 'text-s-danger  bg-s-danger/10',  label: 'Cancelada' },
    complete:  { icon: CheckCircle, colorClass: 'text-s-success bg-s-success/10', label: 'Completada' },
    pause:     { icon: PauseCircle, colorClass: 'text-s-warning bg-s-warning/10', label: 'Pausada' },
    resume:    { icon: RotateCcw,  colorClass: 'text-s-info    bg-s-info/10',    label: 'Reanudada' },
    update:    { icon: History,    colorClass: 'text-n-8      bg-n-3',            label: 'Actualizada' },
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

function getActionConfig(action: string) {
    return ACTION_CONFIG[action] ?? { icon: History, colorClass: 'text-n-8 bg-n-3', label: action };
}

export function AuditLogTimeline({ auditLog }: AuditLogTimelineProps) {
    if (auditLog.length === 0) {
        return (
            <EmptyStatePresentational
                icon={History}
                title="Sin cambios registrados"
                description="Los cambios de estado de esta receta aparecerán aquí."
                className="py-8"
            />
        );
    }

    return (
        <section aria-labelledby="audit-log-title">
            <h2
                id="audit-log-title"
                className="flex items-center gap-2 text-sm font-semibold text-n-11 mb-4"
            >
                <span
                    className="w-1 h-5 rounded-full bg-b-8 shrink-0"
                    aria-hidden="true"
                />
                Historial de cambios
                <span className="text-[11px] font-normal text-n-8 bg-n-2 px-1.5 py-0.5 rounded border border-n-5/30 tabular-nums">
                    {auditLog.length}
                </span>
            </h2>

            <ol
                className="bg-n-1 rounded-lg border border-n-5/30 divide-y divide-n-5/20"
                aria-label="Historial de cambios de estado"
            >
                {auditLog.map((entry) => {
                    const config = getActionConfig(entry.action);
                    const Icon = config.icon;
                    return (
                        <li key={entry.id} className="px-4 py-3 flex items-start gap-3">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.colorClass}`}
                                aria-hidden="true"
                            >
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-medium text-n-11 capitalize">
                                        {config.label}
                                    </span>
                                    {entry.old_status && entry.new_status && (
                                        <span
                                            className="text-[10px] font-mono text-n-8"
                                            aria-label={`Cambio de ${getStatusLabel(entry.old_status)} a ${getStatusLabel(entry.new_status)}`}
                                        >
                                            {getStatusLabel(entry.old_status)} → {getStatusLabel(entry.new_status)}
                                        </span>
                                    )}
                                </div>

                                {entry.reason && (
                                    <p className="text-[11px] text-n-9 mt-0.5 leading-relaxed">
                                        {entry.reason}
                                    </p>
                                )}

                                <div className="flex items-center gap-1.5 mt-1">
                                        <time
                                            dateTime={entry.changed_at}
                                            className="text-[10px] text-n-7 font-mono"
                                            title={formatDate(entry.changed_at)}
                                            aria-label={`${formatDate(entry.changed_at)} a las ${formatTime(entry.changed_at)}`}
                                        >
                                        {formatRelativeTime(entry.changed_at)}
                                    </time>
                                    <span className="text-n-5" aria-hidden="true">·</span>
                                    <time
                                        dateTime={entry.changed_at}
                                        className="text-[10px] text-n-6 font-mono"
                                        aria-hidden="true"
                                    >
                                        {formatTime(entry.changed_at)}
                                    </time>
                                    {entry.changed_by_practitioner && (
                                        <>
                                            <span className="text-n-5" aria-hidden="true">·</span>
                                            <span className="text-[10px] text-n-7">
                                                Dr. {entry.changed_by_practitioner.name_family}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
