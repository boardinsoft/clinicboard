'use client';

import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { notify } from '@/lib/notify';
import { extendEncounterTimeout, getEncounterTimeStatus } from '@/actions/encounters';
import { updateEncounterStatus } from '@/actions/encounters';
import { usePatientStore } from '@/store/usePatientStore';

const CHECK_INTERVAL_MS = 30000;

export function useEncounterTimeout() {
    const selectedEncounterForPreview = usePatientStore((s) => s.selectedEncounterForPreview);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const showTimeoutNotification = useCallback(
        (phase: 'warning' | 'grace', params: {
            encounterId: string;
            elapsed?: number;
            maxDuration?: number;
            gracePeriodRemainingMinutes?: number;
        }) => {
            const title =
                phase === 'warning'
                    ? `⏱️ La consulta lleva ${params.elapsed} min (límite: ${params.maxDuration} min)`
                    : `⏱️ La consulta será cancelada en ${params.gracePeriodRemainingMinutes} min`;

            const toastId = `encounter-timeout-${params.encounterId}`;

            toast.warning(title, {
                duration: Infinity,
                id: toastId,
                action: {
                    label: 'Extender 15 min',
                    onClick: async () => {
                        const result = await extendEncounterTimeout(params.encounterId);
                        if (result.error) {
                            notify.error({ title: 'No se pudo extender', description: 'Intenta de nuevo en unos momentos' });
                        } else {
                            notify.success({ title: 'Tiempo extendido 15 minutos', description: 'Tienes 15 minutos más para finalizar la consulta' });
                        }
                    },
                },
                cancel: {
                    label: 'Cancelar consulta',
                    onClick: async () => {
                        const result = await updateEncounterStatus(params.encounterId, 'cancelled', 'timeout_manual');
                        if (result.error) {
                            notify.error({ title: 'No se pudo cancelar', description: 'La consulta se cerró automáticamente' });
                        } else {
                            notify.success({ title: 'Consulta cancelada', description: 'La consulta se cerró automáticamente' });
                        }
                    },
                },
            });
        },
        []
    );

    const checkTimeout = useCallback(async () => {
        if (!selectedEncounterForPreview) return;
        if (selectedEncounterForPreview.status !== 'in-progress') return;

        const { data, error } = await getEncounterTimeStatus(selectedEncounterForPreview.id);
        if (error || !data) return;

        const encounterId = selectedEncounterForPreview.id;

        if (data.isExpired && !data.isNotified) {
            showTimeoutNotification('warning', {
                encounterId,
                elapsed: data.elapsedMinutes,
                maxDuration: data.maxDurationMinutes,
            });
        }

        if (data.shouldAutoCancel && data.gracePeriodRemainingMinutes !== null && data.gracePeriodRemainingMinutes <= 0) {
            return;
        }

        if (data.shouldAutoCancel && data.isNotified) {
            showTimeoutNotification('grace', {
                encounterId,
                gracePeriodRemainingMinutes: data.gracePeriodRemainingMinutes ?? undefined,
            });
        }
    }, [selectedEncounterForPreview, showTimeoutNotification]);

    useEffect(() => {
        if (!selectedEncounterForPreview || selectedEncounterForPreview.status !== 'in-progress') {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        checkTimeout();
        intervalRef.current = setInterval(checkTimeout, CHECK_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [selectedEncounterForPreview, checkTimeout]);
}