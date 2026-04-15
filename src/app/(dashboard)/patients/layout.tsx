'use client';

import { ReactNode, useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import PatientTabBar from '@/components/patients/PatientTabBar';
import PatientsSidebar from './PatientsSidebar';

export default function PatientsLayout({ children }: { children: ReactNode }) {
    const { setSubHeaderContent, setSecondaryPanel } = useLayoutStore();

    useEffect(() => {
        // Inyectar el TabBar específico de pacientes en el SubHeader global
        setSubHeaderContent(<PatientTabBar />);
        
        // Inyectar el Sidebar de pacientes
        setSecondaryPanel(<PatientsSidebar />, 'Pacientes');

        return () => {
            // Limpiar al salir del módulo de pacientes
            setSubHeaderContent(null);
        };
    }, [setSubHeaderContent, setSecondaryPanel]);

    return <>{children}</>;
}
