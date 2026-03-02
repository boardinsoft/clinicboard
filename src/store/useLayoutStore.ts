import { create } from 'zustand';
import { ReactNode } from 'react';

interface LayoutState {
    secondaryPanelOpen: boolean;
    secondaryPanelContent: ReactNode | null;
    secondaryPanelTitle: string;
    rightPanelOpen: boolean;

    setSecondaryPanelOpen: (open: boolean) => void;
    toggleSecondaryPanel: () => void;
    setSecondaryPanel: (content: ReactNode, title?: string) => void;
    clearSecondaryPanel: () => void;
    toggleRightPanel: () => void;
    setRightPanelOpen: (open: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
    secondaryPanelOpen: false,
    secondaryPanelContent: null,
    secondaryPanelTitle: '',
    rightPanelOpen: false,

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
    toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
    setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
}));
