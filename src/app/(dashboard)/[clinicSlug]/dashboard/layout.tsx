'use client';

import { ReactNode, useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { clearSecondaryPanel } = useLayoutStore();

    useEffect(() => {
        clearSecondaryPanel();
        return () => {};
    }, [clearSecondaryPanel]);

    return <>{children}</>;
}
