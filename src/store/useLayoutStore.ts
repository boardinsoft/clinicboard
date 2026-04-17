import { create } from 'zustand';
import { ReactNode } from 'react';

interface LayoutState {
    secondaryPanelOpen: boolean;
    secondaryPanelContent: ReactNode | null;
    secondaryPanelTitle: string;
    // undefined = default (show TabBar if tabs exist)
    // null      = explicitly suppressed (hide SubHeader entirely)
    // ReactNode = show custom content
    subHeaderContent: ReactNode | null | undefined;
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
    subHeaderContent: undefined,
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
