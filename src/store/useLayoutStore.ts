import { create } from 'zustand';
import { ReactNode } from 'react';

interface LayoutState {
    secondaryPanelOpen: boolean;
    secondaryPanelContent: ReactNode | null;
    secondaryPanelTitle: string;
    subHeaderContent: ReactNode | null;
    rightPanelOpen: boolean;

    setSecondaryPanelOpen: (open: boolean) => void;
    toggleSecondaryPanel: () => void;
    setSecondaryPanel: (content: ReactNode, title?: string) => void;
    clearSecondaryPanel: () => void;
    setSubHeaderContent: (content: ReactNode | null) => void;
    toggleRightPanel: () => void;
    setRightPanelOpen: (open: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
    secondaryPanelOpen: false,
    secondaryPanelContent: null,
    secondaryPanelTitle: '',
    subHeaderContent: null,
    rightPanelOpen: false,

    setSecondaryPanelOpen: (open) => set({ secondaryPanelOpen: open }),
    toggleSecondaryPanel: () => set((state) => ({ secondaryPanelOpen: !state.secondaryPanelOpen })),
    setSecondaryPanel: (content, title = '') => set((state) => ({
        secondaryPanelContent: content,
        secondaryPanelTitle: title,
        // Auto-abre solo la primera vez (cuando no había contenido).
        // Si el usuario ya colapsó manualmente, respeta ese estado.
        secondaryPanelOpen: state.secondaryPanelContent !== null
            ? state.secondaryPanelOpen
            : true,
    })),
    clearSecondaryPanel: () => set({
        secondaryPanelContent: null,
        secondaryPanelTitle: '',
        secondaryPanelOpen: false
    }),
    setSubHeaderContent: (content) => set({ subHeaderContent: content }),
    toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
    setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
}));
