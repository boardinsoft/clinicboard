'use client';

import React from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';

export default function SecondaryPanel() {
    const { secondaryPanelContent, secondaryPanelTitle, secondaryPanelOpen } = useLayoutStore();

    if (!secondaryPanelOpen) return null;

    return (
        <aside className="w-72 bg-card border-r border-border h-full flex flex-col shrink-0 flex-shrink-0 relative overflow-hidden transition-all z-10">
            <div className="h-10 px-4 flex items-center border-b border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{secondaryPanelTitle || 'Menú'}</h3>
            </div>
            <div className="flex-1 overflow-y-auto w-full p-2">
                {secondaryPanelContent}
            </div>
        </aside>
    );
}
