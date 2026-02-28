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
        const currentTabs = useTabStore.getState().tabs;

        // Si intentamos cerrar la única pestaña o es el home original
        if (currentTabs.length <= 1) return;

        removeTab(id);

        // Si cerramos la pestaña activa, navegar a la nueva pestaña activa resultante
        if (activeTabId === id) {
            const newActive = useTabStore.getState().activeTabId;
            const newTab = useTabStore.getState().tabs.find(t => t.id === newActive);
            if (newTab) {
                router.push(newTab.url);
            }
        }
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

                            {/* Only show close button if there is more than 1 tab, and it's not the last standing */}
                            {tabs.length > 1 && (
                                <button
                                    className="workspace-tab__close"
                                    onClick={(e) => handleCloseTab(e, tab.id)}
                                    aria-label="Cerrar pestaña"
                                >
                                    <Close size={16} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
