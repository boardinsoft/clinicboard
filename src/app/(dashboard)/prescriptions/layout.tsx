'use client';

import { ReactNode, useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';

export default function PrescriptionsLayout({ children }: { children: ReactNode }) {
    const { clearSecondaryPanel } = useLayoutStore();

    useEffect(() => {
        clearSecondaryPanel();
        return () => {};
    }, [clearSecondaryPanel]);

    return <>{children}</>;
}