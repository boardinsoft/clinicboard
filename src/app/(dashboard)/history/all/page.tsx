import { Suspense } from 'react';
import { getEncountersFiltered } from '@/actions/encounters';
import EncountersTable from '@/components/history/EncountersTable';
import EncounterFiltersBar from '@/components/history/EncounterFiltersBar';
import { RefreshCw } from 'lucide-react';
import type { EncounterForPreview } from '@/types/database.types';
import { PageHeader } from '@/components/ui/PageLayout';

interface PageProps {
    searchParams: Promise<{
        q?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    }>;
}

export default async function HistoryAllPage({ searchParams }: PageProps) {
    const params = await searchParams;

    const { data: encounters } = await getEncountersFiltered({
        search: params.q,
        status: params.status,
        date_from: params.date_from,
        date_to: params.date_to,
    });

    return (
        <div className="flex flex-col h-full bg-background">
            
            {/* ── SubHeader plano estilo Supabase ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0 bg-background">
                <div className="flex flex-col gap-0.5">
                    <h1 className="text-xl font-bold text-foreground tracking-tight">
                        Todas las consultas
                    </h1>
                    <p className="text-xs text-muted-foreground/70 font-medium">
                        Historial completo de encuentros clínicos registrados en el sistema.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                     {/* Acciones adicionales si fuesen necesarias */}
                </div>
            </div>

            <div className="border-b border-border/40 bg-background shrink-0 px-6">
                <Suspense fallback={null}>
                    <EncounterFiltersBar />
                </Suspense>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center py-24">
                            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground/40" />
                        </div>
                    }
                >
                    <EncountersTable encounters={encounters as EncounterForPreview[]} />
                </Suspense>
            </div>
        </div>
    );
}
