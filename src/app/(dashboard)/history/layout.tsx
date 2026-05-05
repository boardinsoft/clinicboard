'use client';

import { ReactNode, useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import HistoryPatientPanel from './HistoryPatientPanel';

export default function HistoryLayout({ children }: { children: ReactNode }) {
    const { setSubHeaderContent, setSecondaryPanel, clearSecondaryPanel } = useLayoutStore();

    useEffect(() => {
        setSubHeaderContent(null);
        setSecondaryPanel(<HistoryPatientPanel />, 'Historia clínica');

        return () => {
            setSubHeaderContent(undefined);
            clearSecondaryPanel();
        };
    }, [setSubHeaderContent, setSecondaryPanel, clearSecondaryPanel]);

    return <>{children}</>;
}
