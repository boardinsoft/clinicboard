import { create } from 'zustand';

export interface WorkspaceTab {
    id: string;
    title: string;
    url: string;
}

interface TabState {
    tabs: WorkspaceTab[];
    activeTabId: string | null;
    addTab: (tab: WorkspaceTab) => void;
    removeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
    tabs: [{ id: '/', title: 'Dashboard', url: '/' }],
    activeTabId: '/',

    addTab: (tab) => {
        const { tabs } = get();
        if (!tabs.find((t) => t.id === tab.id)) {
            set({ tabs: [...tabs, tab], activeTabId: tab.id });
        } else {
            set({ activeTabId: tab.id });
        }
    },

    removeTab: (id) => {
        const { tabs, activeTabId } = get();
        const newTabs = tabs.filter((t) => t.id !== id);
        if (newTabs.length > 0) {
            set({
                tabs: newTabs,
                activeTabId: activeTabId === id ? newTabs[newTabs.length - 1].id : activeTabId,
            });
        } else {
            // Fallback to dashboard if all tabs are closed
            set({ tabs: [{ id: '/', title: 'Dashboard', url: '/' }], activeTabId: '/' });
        }
    },

    setActiveTab: (id) => set({ activeTabId: id }),
}));
