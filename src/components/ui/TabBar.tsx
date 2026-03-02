'use client';

import React from 'react';
import { useTabStore } from '@/store/useTabStore';
import { Close } from '@carbon/icons-react';
import { useRouter } from 'next/navigation';

export default function TabBar() {
    const { tabs, activeTabId, setActiveTab, removeTab } = useTabStore();
    const router = useRouter();

    const handleTabClick = (tabId: string, url: string) => {
        setActiveTab(tabId);
        router.push(url);
    };

    const handleCloseTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        // Let zustand do the heavy lifting of determining next active tab
        removeTab(id);

        // We need the next tick so zustand is fully updated before we inspect it
        setTimeout(() => {
            const { activeTabId, tabs } = useTabStore.getState();
            if (activeTabId) {
                const nextTab = tabs.find(t => t.id === activeTabId);
                if (nextTab) {
                    router.push(nextTab.url);
                }
            } else {
                // If there are no tabs left, go back to the dashboard
                router.push('/');
            }
        }, 0);
    };

    return (
        <div className="tab-bar">
            <div className="tab-bar-scroll-area">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    return (
                        <div
                            key={tab.id}
                            className={`workspace-tab ${isActive ? 'workspace-tab--active' : ''}`}
                        >
                            <button
                                className="workspace-tab__button"
                                onClick={() => handleTabClick(tab.id, tab.url)}
                                title={tab.title}
                            >
                                <span className="workspace-tab__title">{tab.title}</span>
                            </button>

                            <button
                                className="workspace-tab__close"
                                onClick={(e) => handleCloseTab(e, tab.id)}
                                aria-label="Cerrar pestaña"
                            >
                                <Close size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
