'use client';

import { useEncounterTimeout } from '@/hooks/useEncounterTimeout';

export function EncounterTimeoutProvider({ children }: { children: React.ReactNode }) {
    useEncounterTimeout();
    return <>{children}</>;
}