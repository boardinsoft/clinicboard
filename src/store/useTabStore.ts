import { create } from 'zustand';

export interface WorkspaceTab {
    id: string;
    title: string;
    url: string;
    data?: unknown; // Intentionally flexible tab data — unknown is safer than any
}

// Represents the persisted form state for a clinical encounter per patient
export interface ClinicalFormState {
    evolution_note?: string;
    plan?: string;
    vitals?: Record<string, string | number>;
    diagnoses?: { code: string; display?: string }[];
    symptoms?: string[];
    [key: string]: unknown;
}

interface TabState {
    tabs: WorkspaceTab[];
    activeTabId: string | null;
    addTab: (tab: WorkspaceTab) => void;
    removeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    setTabData: (id: string, data: Record<string, unknown>) => void;

    // Clinical and Patient persistence
    clinicalState: Record<string, ClinicalFormState>;
    setClinicalState: (patientId: string, state: ClinicalFormState) => void;
    patientViewState: Record<string, number>;
    setPatientTab: (patientId: string, tabIndex: number) => void;
    historyTabIndex: number;
    setHistoryTab: (tabIndex: number) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
    tabs: [],
    activeTabId: null,

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
            set({ tabs: [], activeTabId: null });
        }
    },

    setActiveTab: (id) => set({ activeTabId: id }),

    setTabData: (id, data) => {
        set((state) => ({
            tabs: state.tabs.map((tab) =>
                tab.id === id ? { ...tab, data: { ...(tab.data as Record<string, unknown> ?? {}), ...data } } : tab
            ),
        }));
    },

    // Clinical and Patient persistence
    clinicalState: {} as Record<string, ClinicalFormState>,
    setClinicalState: (patientId: string, state: ClinicalFormState) => {
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

