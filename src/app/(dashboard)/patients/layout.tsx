'use client';

import { ReactNode, useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import PatientsSidebar from './PatientsSidebar';

export default function PatientsLayout({ children }: { children: ReactNode }) {
    const { setSecondaryPanel, clearSecondaryPanel } = useLayoutStore();

    useEffect(() => {
        setSecondaryPanel(<PatientsSidebar />, 'Pacientes');

        return () => {
            clearSecondaryPanel();
        };
    }, [setSecondaryPanel, clearSecondaryPanel]);

    return <>{children}</>;
}
