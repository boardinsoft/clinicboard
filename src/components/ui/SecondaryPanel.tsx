'use client';

import React from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';

export default function SecondaryPanel() {
    const { secondaryPanelContent, secondaryPanelTitle, secondaryPanelOpen } = useLayoutStore();

    return (
        <aside className={`secondary-panel ${!secondaryPanelOpen ? 'secondary-panel--hidden' : ''}`}>
            <div className="secondary-panel__header">
                <h3>{secondaryPanelTitle || 'Menú'}</h3>
            </div>
            <div className="secondary-panel__content">
                {secondaryPanelContent}
            </div>
        </aside>
    );
}
