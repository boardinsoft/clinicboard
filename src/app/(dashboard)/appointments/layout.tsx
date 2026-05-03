'use client';

import { ReactNode, useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import AppointmentsSidebar from './AppointmentsSidebar';

export default function AppointmentsLayout({ children }: { children: ReactNode }) {
    const { setSecondaryPanel, clearSecondaryPanel } = useLayoutStore();

    useEffect(() => {
        setSecondaryPanel(<AppointmentsSidebar />, 'Citas');
        return () => {
            clearSecondaryPanel();
        };
    }, [setSecondaryPanel, clearSecondaryPanel]);

    return <>{children}</>;
}