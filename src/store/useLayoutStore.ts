import { create } from 'zustand';
import { ReactNode } from 'react';

interface LayoutState {
    secondaryPanelOpen: boolean;
    secondaryPanelContent: ReactNode | null;
    secondaryPanelTitle: string;

    setSecondaryPanelOpen: (open: boolean) => void;
    toggleSecondaryPanel: () => void;
    setSecondaryPanel: (content: ReactNode, title?: string) => void;
    clearSecondaryPanel: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
    secondaryPanelOpen: false,
    secondaryPanelContent: null,
    secondaryPanelTitle: '',

    setSecondaryPanelOpen: (open) => set({ secondaryPanelOpen: open }),
    toggleSecondaryPanel: () => set((state) => ({ secondaryPanelOpen: !state.secondaryPanelOpen })),
    setSecondaryPanel: (content, title = '') => set({
        secondaryPanelContent: content,
        secondaryPanelTitle: title,
        secondaryPanelOpen: true
    }),
    clearSecondaryPanel: () => set({
        secondaryPanelContent: null,
        secondaryPanelTitle: '',
        secondaryPanelOpen: false
    }),
}));
