import { Suspense } from 'react';
import EncountersListView from '@/components/history/EncountersListView';
import { RefreshCw } from 'lucide-react';

export default function HistoryAllPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-24">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground/40" />
                </div>
            }
        >
            <EncountersListView />
        </Suspense>
    );
}
