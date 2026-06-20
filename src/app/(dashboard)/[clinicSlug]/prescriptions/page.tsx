import { Suspense } from 'react';
import PrescriptionsListView from './PrescriptionsListView';
import { RefreshCw } from 'lucide-react';

export default async function PrescriptionsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-24">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground/40" />
                </div>
            }
        >
            <PrescriptionsListView />
        </Suspense>
    );
}
