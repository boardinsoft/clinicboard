'use client';

import { ReactNode, useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import SpecialtySidebar from './SpecialtySidebar';

export default function HistoryLayout({ children }: { children: ReactNode }) {
    const { setSubHeaderContent, setSecondaryPanel, clearSecondaryPanel } = useLayoutStore();

    useEffect(() => {
        setSubHeaderContent(null);
        setSecondaryPanel(<SpecialtySidebar />, 'Historia clínica');

        return () => {
            setSubHeaderContent(undefined);
            clearSecondaryPanel();
        };
    }, [setSubHeaderContent, setSecondaryPanel, clearSecondaryPanel]);

    return <>{children}</>;
}
