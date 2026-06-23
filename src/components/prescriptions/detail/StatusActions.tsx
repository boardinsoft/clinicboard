'use client';

import React from 'react';
import {
    CheckCircle,
    PauseCircle,
    RotateCcw,
    Ban,
    Loader2,
    Settings,
    StopCircle,
    HelpCircle,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormFieldRow } from './FormFieldRow';
import {
    activatePrescription,
    completePrescription,
    pausePrescription,
    resumePrescription,
} from '@/actions/prescriptions';
import type { MedicationRequestStatus } from '@/lib/fhir/types';
import { cn } from '@/lib/utils';

type LoadingAction = 'activate' | 'complete' | 'pause' | 'resume' | 'cancel';

interface StatusActionsProps {
    prescriptionId: string;
    status: MedicationRequestStatus;
    onAction: (actionFn: () => Promise<{ error?: string }>, actionKey: LoadingAction) => void;
    loadingAction: string | null;
    onCancelRequest: () => void;
}

type ActionKey = 'activate' | 'complete' | 'pause' | 'resume' | 'cancel';

interface ActionDefinition {
    key: ActionKey;
    label: string;
    loadingLabel: string;
    icon: LucideIcon;
    variant: 'default' | 'outline' | 'danger-outline';
    handler: (id: string) => Promise<{ error?: string }>;
    ariaDescription: string;
}

interface StateConfig {
    label: string;
    description: string;
    pill: 'pill-success' | 'pill-warning' | 'pill-danger' | 'pill-neutral' | 'pill-info';
    actions: ActionDefinition[];
}

const TERMINAL_STATES: MedicationRequestStatus[] = ['completed', 'cancelled', 'stopped', 'unknown'];

function isTerminal(status: MedicationRequestStatus): boolean {
    return TERMINAL_STATES.includes(status);
}

const STATE_CONFIG: Record<MedicationRequestStatus, StateConfig> = {
    draft: {
        label: 'Borrador',
        description: 'Receta pendiente de activación',
        pill: 'pill-neutral',
        actions: [
            {
                key: 'activate',
                label: 'Activar receta',
                loadingLabel: 'Activando',
                icon: CheckCircle,
                variant: 'default',
                handler: activatePrescription,
                ariaDescription: 'Confirma la receta y la pone en vigor',
            },
        ],
    },
    active: {
        label: 'Activa',
        description: 'Receta vigente y en curso',
        pill: 'pill-success',
        actions: [
            {
                key: 'complete',
                label: 'Completar',
                loadingLabel: 'Completando',
                icon: CheckCircle,
                variant: 'outline',
                handler: completePrescription,
                ariaDescription: 'Marca el tratamiento como finalizado',
            },
            {
                key: 'pause',
                label: 'Pausar',
                loadingLabel: 'Pausando',
                icon: PauseCircle,
                variant: 'outline',
                handler: pausePrescription,
                ariaDescription: 'Suspende temporalmente la receta',
            },
            {
                key: 'cancel',
                label: 'Cancelar',
                loadingLabel: 'Cancelando',
                icon: Ban,
                variant: 'danger-outline',
                handler: () => Promise.resolve({ error: 'cancel' }),
                ariaDescription: 'Cancela permanentemente la receta',
            },
        ],
    },
    'on-hold': {
        label: 'En pausa',
        description: 'Receta temporalmente suspendida',
        pill: 'pill-warning',
        actions: [
            {
                key: 'resume',
                label: 'Reanudar',
                loadingLabel: 'Reanudando',
                icon: RotateCcw,
                variant: 'default',
                handler: resumePrescription,
                ariaDescription: 'Reactiva la receta',
            },
            {
                key: 'cancel',
                label: 'Cancelar',
                loadingLabel: 'Cancelando',
                icon: Ban,
                variant: 'danger-outline',
                handler: () => Promise.resolve({ error: 'cancel' }),
                ariaDescription: 'Cancela permanentemente la receta',
            },
        ],
    },
    completed: {
        label: 'Completada',
        description: 'Tratamiento finalizado. No se permiten más cambios.',
        pill: 'pill-info',
        actions: [],
    },
    cancelled: {
        label: 'Cancelada',
        description: 'Receta cancelada. No se permiten más cambios.',
        pill: 'pill-danger',
        actions: [],
    },
    stopped: {
        label: 'Detenida',
        description: 'Receta detenida. No se permiten más cambios.',
        pill: 'pill-neutral',
        actions: [],
    },
    unknown: {
        label: 'Desconocido',
        description: 'Estado no determinado.',
        pill: 'pill-neutral',
        actions: [],
    },
};

function ActionButton({
    action,
    prescriptionId,
    isLoading,
    anyLoading,
    onAction,
    onCancelRequest,
}: {
    action: ActionDefinition;
    prescriptionId: string;
    isLoading: boolean;
    anyLoading: boolean;
    onAction: (actionFn: () => Promise<{ error?: string }>, actionKey: ActionKey) => void;
    onCancelRequest: () => void;
}) {
    const Icon = isLoading ? Loader2 : action.icon;

    return (
        <Button
            size="sm"
            variant={action.variant === 'danger-outline' ? 'outline' : action.variant}
            className={cn(
                action.variant === 'danger-outline' &&
                    'border-[var(--s-danger)] text-[var(--s-danger)] hover:bg-[var(--s-danger-bg)] hover:border-[var(--s-danger)] focus-visible:ring-0',
                'active:scale-95 transition-all'
            )}
            onClick={() => {
                if (action.key === 'cancel') {
                    onCancelRequest();
                } else {
                    onAction(() => action.handler(prescriptionId), action.key);
                }
            }}
            disabled={anyLoading}
            aria-busy={isLoading}
            aria-label={`${isLoading ? action.loadingLabel + '…' : action.label}: ${action.ariaDescription}`}
        >
            <Icon
                className={cn(
                    'w-3.5 h-3.5',
                    isLoading && 'animate-spin motion-reduce:animate-none'
                )}
                aria-hidden="true"
                strokeWidth={1.8}
            />
            {isLoading ? `${action.loadingLabel}…` : action.label}
        </Button>
    );
}

function TerminalStateView({ status }: { status: MedicationRequestStatus }) {
    const config = STATE_CONFIG[status];

    const iconMap: Record<MedicationRequestStatus, LucideIcon> = {
        completed: CheckCircle,
        cancelled: Ban,
        stopped: StopCircle,
        unknown: HelpCircle,
        draft: Settings,
        active: Settings,
        'on-hold': Settings,
    };

    const Icon = iconMap[status];

    return (
        <div className="bg-n-1 rounded-lg border border-n-5/30">
            <div className="px-4 py-3 border-b border-n-5/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-n-3 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-n-8" aria-hidden="true" strokeWidth={1.8} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-n-11">Estado final</h3>
                    <p className="text-[11px] text-n-8 mt-0.5">
                        Esta receta no permite más cambios
                    </p>
                </div>
            </div>
            <FormFieldRow
                label="Estado"
                description={config.description}
                value={
                    <div className="flex justify-end">
                        <Badge variant={config.pill} className="text-[11px]">
                            {config.label}
                        </Badge>
                    </div>
                }
            />
        </div>
    );
}

export function StatusActions({
    prescriptionId,
    status,
    onAction,
    loadingAction,
    onCancelRequest,
}: StatusActionsProps) {
    const isLoading = loadingAction !== null;

    if (isTerminal(status)) {
        return <TerminalStateView status={status} />;
    }

    const config = STATE_CONFIG[status];

    return (
        <div className="bg-n-1 rounded-lg border border-n-5/30">
            <div className="px-4 py-3 border-b border-n-5/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-b-2 flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4 text-b-8" aria-hidden="true" strokeWidth={1.8} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-n-11">Acciones de estado</h3>
                    <p className="text-[11px] text-n-8 mt-0.5">
                        Cambia el estado clínico de la receta
                    </p>
                </div>
            </div>

            <div className="divide-y divide-n-5/30">
                <FormFieldRow
                    label="Estado actual"
                    description={config.description}
                    value={
                        <div className="flex justify-end">
                            <Badge variant={config.pill} className="text-[11px]">
                                {config.label}
                            </Badge>
                        </div>
                    }
                />

                <div className="flex items-center justify-between gap-6 py-4 px-5">
                    <div className="min-w-0 w-40 shrink-0">
                        <span className="text-xs font-semibold uppercase tracking-wider text-n-8 block leading-tight">
                            Acciones disponibles
                        </span>
                        <span className="text-[11px] text-n-7 mt-1 block leading-relaxed">
                            Opciones para cambiar el estado
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-end min-w-0 flex-1">
                        {config.actions.map((action: ActionDefinition) => (
                            <ActionButton
                                key={action.key}
                                action={action}
                                prescriptionId={prescriptionId}
                                isLoading={loadingAction === action.key}
                                anyLoading={isLoading}
                                onAction={onAction}
                                onCancelRequest={onCancelRequest}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
