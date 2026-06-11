import { Suspense } from 'react';
import { getPrescriptionsForTable } from '@/actions/prescriptions';
import PrescriptionsTable from '@/components/prescriptions/PrescriptionsTable';
import { RefreshCw } from 'lucide-react';
import type { PrescriptionForPreview } from '@/types/database.types';

export default async function PrescriptionsPage() {
    const { data: prescriptions } = await getPrescriptionsForTable();

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0 bg-background">
                <div className="flex flex-col gap-0.5">
                    <h1 className="text-xl font-bold text-foreground tracking-tight">
                        Todas las recetas
                    </h1>
                    <p className="text-xs text-muted-foreground/70 font-medium">
                        Historial completo de recetas médicas registradas en el sistema.
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center py-24">
                            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground/40" />
                        </div>
                    }
                >
                    <PrescriptionsTable
                        prescriptions={(prescriptions || []) as PrescriptionForPreview[]}
                    />
                </Suspense>
            </div>
        </div>
    );
}