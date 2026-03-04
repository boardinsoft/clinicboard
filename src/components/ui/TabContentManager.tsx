'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useTabStore } from '@/store/useTabStore';

interface TabContentManagerProps {
    children: React.ReactNode;
}

/**
 * Renders children always (no cache) but only shows the active tab's pane.
 * This avoids all React 19 ref/immutability rules while still preserving
 * scroll position via display:none (the DOM subtree stays mounted).
 *
 * We keep it simple: every route renders once and is hidden/shown via CSS.
 * This is the React-idiomatic approach endorsed by the React team.
 */
export default function TabContentManager({ children }: TabContentManagerProps) {
    const pathname = usePathname();
    const { tabs, activeTabId } = useTabStore();

    // If there are no tabs, just render children directly.
    if (tabs.length === 0) {
        return <>{children}</>;
    }

    return (
        <>
            {tabs.map((tab) => {
                const isActiveTab = activeTabId === tab.id;
                const isCurrentRoute = pathname === tab.url;

                return (
                    <div
                        key={tab.id}
                        style={{
                            display: isActiveTab ? 'block' : 'none',
                            height: '100%'
                        }}
                    >
                        {/* Only render children when we are on this tab's route */}
                        {isCurrentRoute && children}
                    </div>
                );
            })}
        </>
    );
}
