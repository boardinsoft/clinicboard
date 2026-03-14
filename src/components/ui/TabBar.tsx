'use client';

import { Button } from '@/components/ui/button';
import { useTabStore } from '@/store/useTabStore';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TabBar() {
    const { tabs, activeTabId, setActiveTab, removeTab } = useTabStore();
    const router = useRouter();

    const handleTabClick = (tabId: string, url: string) => {
        setActiveTab(tabId);
        router.push(url);
    };

    const handleCloseTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        removeTab(id);
        setTimeout(() => {
            const { activeTabId, tabs } = useTabStore.getState();
            if (activeTabId) {
                const nextTab = tabs.find(t => t.id === activeTabId);
                if (nextTab) {
                    router.push(nextTab.url);
                }
            } else {
                router.push('/');
            }
        }, 0);
    };

    if (tabs.length === 0) return null;

    return (
        <Tabs value={activeTabId || undefined} onValueChange={(val) => {
            const tab = tabs.find(t => t.id === val);
            if (tab) handleTabClick(tab.id, tab.url);
        }} className="w-full">
            <TabsList className="justify-start overflow-x-auto no-scrollbar max-w-full">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="group relative flex items-center h-7 px-3 gap-2"
                    >
                        <span className="truncate max-w-[150px] text-xs">{tab.title}</span>
                        <div
                            role="button"
                            tabIndex={0}
                            className="h-4 w-4 rounded-sm opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-muted transition-all shrink-0 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
                            onClick={(e) => handleCloseTab(e, tab.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleCloseTab(e as any, tab.id);
                                }
                            }}
                        >
                            <X className="h-3 w-3" />
                        </div>
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}

