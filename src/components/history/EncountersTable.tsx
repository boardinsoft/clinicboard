'use client';

import HistoryTable from '@/components/ui/HistoryTable';
import type { EncounterForPreview } from '@/types/database.types';

export default function EncountersTable({
    encounters,
    toolbar,
}: {
    encounters: EncounterForPreview[];
    toolbar?: React.ReactNode;
}) {
    return <HistoryTable encounters={encounters} toolbar={toolbar} />;
}