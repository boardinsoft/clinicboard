'use client';

import { ReactNode, useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import PatientTabBar from '@/components/patients/PatientTabBar';

export default function HistoryLayout({ children }: { children: ReactNode }) {
    const { setSubHeaderContent } = useLayoutStore();

    useEffect(() => {
        // En Historia Clínica también usamos el TabBar de pacientes ya que la navegación es por paciente
        setSubHeaderContent(<PatientTabBar />);

        return () => {
            setSubHeaderContent(null);
        };
    }, [setSubHeaderContent]);

    return <>{children}</>;
}
