'use client';

import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { extendEncounterTimeout, getEncounterTimeStatus } from '@/actions/encounters';
import { updateEncounterStatus } from '@/actions/encounters';
import { usePatientStore } from '@/store/usePatientStore';

const CHECK_INTERVAL_MS = 30000;

export function useEncounterTimeout() {
    const selectedEncounterForPreview = usePatientStore((s) => s.selectedEncounterForPreview);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const checkTimeout = useCallback(async () => {
        if (!selectedEncounterForPreview) return;
        if (selectedEncounterForPreview.status !== 'in-progress') return;

        const { data, error } = await getEncounterTimeStatus(selectedEncounterForPreview.id);
        if (error || !data) return;

        if (data.isExpired && !data.isNotified) {
            const encounterId = selectedEncounterForPreview.id;
            const elapsed = data.elapsedMinutes;
            const maxDuration = data.maxDurationMinutes;

            toast.warning(
                `⏱️ La consulta lleva ${elapsed} min (límite: ${maxDuration} min)`,
                {
                    duration: Infinity,
                    id: `encounter-timeout-${encounterId}`,
                    action: {
                        label: 'Extender 15 min',
                        onClick: async () => {
                            const result = await extendEncounterTimeout(encounterId);
                            if (result.error) {
                                toast.error('Error al extender', { description: result.error });
                            } else {
                                toast.success('Tiempo extendido 15 minutos');
                            }
                        },
                    },
                    cancel: {
                        label: 'Cancelar consulta',
                        onClick: async () => {
                            const result = await updateEncounterStatus(encounterId, 'cancelled', 'timeout_manual');
                            if (result.error) {
                                toast.error('Error al cancelar', { description: result.error });
                            } else {
                                toast.success('Consulta cancelada');
                            }
                        },
                    },
                }
            );
        }

        if (data.shouldAutoCancel && data.gracePeriodRemainingMinutes !== null && data.gracePeriodRemainingMinutes <= 0) {
            return;
        }

        if (data.shouldAutoCancel && data.isNotified) {
            const encounterId = selectedEncounterForPreview.id;
            toast.warning(
                `⏱️ La consulta será cancelada en ${data.gracePeriodRemainingMinutes} min`,
                {
                    duration: Infinity,
                    id: `encounter-timeout-${encounterId}`,
                    action: {
                        label: 'Extender 15 min',
                        onClick: async () => {
                            const result = await extendEncounterTimeout(encounterId);
                            if (result.error) {
                                toast.error('Error al extender', { description: result.error });
                            } else {
                                toast.success('Tiempo extendido 15 minutos');
                            }
                        },
                    },
                    cancel: {
                        label: 'Cancelar consulta',
                        onClick: async () => {
                            const result = await updateEncounterStatus(encounterId, 'cancelled', 'timeout_manual');
                            if (result.error) {
                                toast.error('Error al cancelar', { description: result.error });
                            } else {
                                toast.success('Consulta cancelada');
                            }
                        },
                    },
                }
            );
        }
    }, [selectedEncounterForPreview]);

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