'use client';

import { ReactNode, useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import PatientTabBar from '@/components/patients/PatientTabBar';
import PatientsSidebar from './PatientsSidebar';

export default function PatientsLayout({ children }: { children: ReactNode }) {
    const { setSubHeaderContent, setSecondaryPanel, clearSecondaryPanel } = useLayoutStore();

    useEffect(() => {
        setSubHeaderContent(<PatientTabBar />);
        setSecondaryPanel(<PatientsSidebar />, 'Pacientes');

        return () => {
            setSubHeaderContent(null);
            clearSecondaryPanel();
        };
    }, [setSubHeaderContent, setSecondaryPanel, clearSecondaryPanel]);

    return <>{children}</>;
}
