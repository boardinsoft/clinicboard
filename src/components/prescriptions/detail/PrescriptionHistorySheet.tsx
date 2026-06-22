'use client';

import React from 'react';
import {
    CheckCircle,
    Ban,
    PauseCircle,
    RotateCcw,
    History,
    Activity,
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

const ACTION_CONFIG: Record<string, {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    colorClass: string;
    label: string;
}> = {
    activate: { icon: CheckCircle, colorClass: 'text-s-success', label: 'Activada' },
    cancel:    { icon: Ban,        colorClass: 'text-s-danger',  label: 'Cancelada' },
    complete:  { icon: CheckCircle, colorClass: 'text-s-success', label: 'Completada' },
    pause:     { icon: PauseCircle, colorClass: 'text-s-warning', label: 'Pausada' },
    resume:    { icon: RotateCcw,  colorClass: 'text-s-info',    label: 'Reanudada' },
    update:    { icon: History,    colorClass: 'text-n-8',       label: 'Actualizada' },
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
    return ACTION_CONFIG[action] ?? { icon: History, colorClass: 'text-n-8', label: action };
}

function VerticalTimelineEntry({ entry }: { entry: AuditEntry }) {
    const config = getActionConfig(entry.action);
    const Icon = config.icon;
    const isLast = false;

    return (
        <div className="flex items-start gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center shrink-0">
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${config.colorClass} bg-current/10`}
                >
                    <Icon className="w-4 h-4" strokeWidth={1.8} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-5">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-n-11 capitalize">
                        {config.label}
                    </span>
                    {entry.old_status && entry.new_status && (
                        <Badge variant="pill-neutral" className="text-[10px] font-mono gap-1">
                            {getStatusLabel(entry.old_status)}
                            <span className="text-n-6" aria-hidden="true">→</span>
                            {getStatusLabel(entry.new_status)}
                        </Badge>
                    )}
                </div>

                {entry.reason && (
                    <p className="text-[13px] text-n-9 mt-1 leading-relaxed">
                        {entry.reason}
                    </p>
                )}

                <div className="flex items-center gap-1.5 mt-1.5">
                    <time
                        dateTime={entry.changed_at}
                        className="text-[11px] text-n-8 font-mono"
                        title={`${formatDate(entry.changed_at)} ${formatTime(entry.changed_at)}`}
                    >
                        {formatRelativeTime(entry.changed_at)}
                    </time>
                    <span className="text-n-6" aria-hidden="true">·</span>
                    <time
                        dateTime={entry.changed_at}
                        className="text-[11px] text-n-7 font-mono"
                    >
                        {formatTime(entry.changed_at)}
                    </time>
                    {entry.changed_by_practitioner && (
                        <>
                            <span className="text-n-6" aria-hidden="true">·</span>
                            <span className="text-[11px] text-n-8">
                                Dr. {entry.changed_by_practitioner.name_family}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export function PrescriptionHistorySheet({
    open,
    onOpenChange,
    prescriptionNumber,
    auditLog,
}: PrescriptionHistorySheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md flex flex-col p-0 gap-0">
                <SheetHeader className="px-6 py-5 pb-4 border-b border-n-5/30">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-b-8" strokeWidth={1.8} aria-hidden="true" />
                        <span className="text-[11px] font-semibold text-n-8 uppercase tracking-wider">
                            Actividad
                        </span>
                        {prescriptionNumber && (
                            <span className="text-[11px] font-mono text-n-8 bg-n-2 px-1.5 py-0.5 rounded border border-n-5/30">
                                {prescriptionNumber}
                            </span>
                        )}
                    </div>
                    <SheetTitle className="text-lg font-bold text-n-11">
                        Historial de cambios
                    </SheetTitle>
                    <SheetDescription className="text-[13px] text-n-8">
                        Seguimiento de modificaciones y cambios de estado de la receta.
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
                            <div className="relative">
                                {/* Vertical line */}
                                <div
                                    className="absolute left-4 top-2 bottom-2 w-px bg-n-5/30"
                                    aria-hidden="true"
                                />

                                <div className="space-y-0">
                                    {auditLog.map((entry) => (
                                        <VerticalTimelineEntry
                                            key={entry.id}
                                            entry={entry}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
