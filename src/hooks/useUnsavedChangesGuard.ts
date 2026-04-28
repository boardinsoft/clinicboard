'use client';

import { useState, useCallback, useRef } from 'react';

export interface UnsavedChangesState {
    isDirty: boolean;
    hasPendingChanges: boolean;
}

export interface UseUnsavedChangesGuardOptions {
    onBeforeChange?: (nextClinicId: string) => Promise<boolean>;
}

export function useUnsavedChangesGuard(options: UseUnsavedChangesGuardOptions = {}) {
    const { onBeforeChange } = options;
    const [isDirty, setIsDirty] = useState(false);
    const [pendingClinicId, setPendingClinicId] = useState<string | null>(null);
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const markDirty = useCallback(() => {
        setIsDirty(true);
    }, []);

    const markClean = useCallback(() => {
        setIsDirty(false);
    }, []);

    const requestClinicChange = useCallback((clinicId: string): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!isDirty) {
                resolve(true);
                return;
            }

            setPendingClinicId(clinicId);
            resolveRef.current = resolve;
        });
    }, [isDirty]);

    const confirmPendingChange = useCallback(async () => {
        if (!pendingClinicId || !resolveRef.current) return false;

        if (onBeforeChange) {
            const canProceed = await onBeforeChange(pendingClinicId);
            if (!canProceed) {
                setPendingClinicId(null);
                resolveRef.current?.(false);
                resolveRef.current = null;
                return false;
            }
        }

        setIsDirty(false);
        setPendingClinicId(null);
        resolveRef.current?.(true);
        resolveRef.current = null;
        return true;
    }, [pendingClinicId, onBeforeChange]);

    const cancelPendingChange = useCallback(() => {
        setPendingClinicId(null);
        resolveRef.current?.(false);
        resolveRef.current = null;
    }, []);

    return {
        isDirty,
        pendingClinicId,
        markDirty,
        markClean,
        requestClinicChange,
        confirmPendingChange,
        cancelPendingChange,
    };
}
