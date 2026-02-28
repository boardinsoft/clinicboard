import { create } from 'zustand';

export interface WorkspaceTab {
    id: string;
    title: string;
    url: string;
    data?: any; // To store persistent form state or view state
}

interface TabState {
    tabs: WorkspaceTab[];
    activeTabId: string | null;
    addTab: (tab: WorkspaceTab) => void;
    removeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    setTabData: (id: string, data: any) => void;

    // Clinical and Patient persistence
    clinicalState: Record<string, any>;
    setClinicalState: (patientId: string, state: any) => void;
    patientViewState: Record<string, number>;
    setPatientTab: (patientId: string, tabIndex: number) => void;
    historyTabIndex: number;
    setHistoryTab: (tabIndex: number) => void;
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

    setTabData: (id, data) => {
        set((state) => ({
            tabs: state.tabs.map((tab) =>
                tab.id === id ? { ...tab, data: { ...tab.data, ...data } } : tab
            ),
        }));
    },

    // Clinical and Patient persistence
    clinicalState: {} as Record<string, any>,
    setClinicalState: (patientId: string, state: any) => {
        set((prev) => ({
            clinicalState: { ...prev.clinicalState, [patientId]: state }
        }));
    },

    patientViewState: {} as Record<string, number>, // Stores active tab index per patient
    setPatientTab: (patientId: string, tabIndex: number) => {
        set((prev) => ({
            patientViewState: { ...prev.patientViewState, [patientId]: tabIndex }
        }));
    },

    historyTabIndex: 0,
    setHistoryTab: (tabIndex: number) => set({ historyTabIndex: tabIndex }),
}));
