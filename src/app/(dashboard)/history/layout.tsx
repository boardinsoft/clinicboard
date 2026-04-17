'use client';

import { ReactNode, useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import SpecialtySidebar from './SpecialtySidebar';

export default function HistoryLayout({ children }: { children: ReactNode }) {
    const { setSubHeaderContent, setSecondaryPanel } = useLayoutStore();

    useEffect(() => {
        // Historia Clínica no usa subheader de tabs — la navegación es via sidebar
        setSubHeaderContent(null);
        // Sidebar de navegación del módulo
        setSecondaryPanel(<SpecialtySidebar />, 'Historia clínica');

        return () => {
            setSubHeaderContent(undefined);
        };
    }, [setSubHeaderContent, setSecondaryPanel]);

    return <>{children}</>;
}
