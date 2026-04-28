'use client';

import dynamic from 'next/dynamic';
import type { Practitioner } from '@/types/database.types';

export function DynamicAppShell(props: {
    children: React.ReactNode;
    user?: { id: string; email?: string; name?: string } | null;
    practitioner?: Practitioner | null;
}) {
    const AppShell = dynamic(() => import('@/components/ui/AppShell'), {
        ssr: false,
        loading: () => <div className="min-h-screen bg-background" />,
    });

    return <AppShell {...props} />;
}
