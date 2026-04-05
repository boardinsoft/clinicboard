import { create } from 'zustand';
import {
    generateTabId,
    normalizeTabUrl,
    isSameTab,
    isValidAppRoute,
    TAB_CONFIG,
    saveTabsToStorage,
    loadTabsFromStorage,
} from '@/lib/tabs-utils';

export interface WorkspaceTab {
    id: string; // ID único generado por generateTabId()
    title: string;
    url: string; // URL normalizada
    data?: unknown; // Datos adicionales de la pestaña
    isDirty?: boolean; // Indica si hay cambios sin guardar
}

// Estado persistente para formularios clínicos por paciente
export interface ClinicalFormState {
    evolution_note?: string;
    plan?: string;
    vitals?: Record<string, string | number>;
    diagnoses?: { code: string; display?: string }[];
    symptoms?: string[];
    [key: string]: unknown;
}

interface TabState {
    // Estado de pestañas
    tabs: WorkspaceTab[];
    activeTabId: string | null;

    // Métodos principales de gestión de pestañas
    addTab: (tab: Omit<WorkspaceTab, 'id'> & { id?: string }) => void;
    removeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    updateTab: (id: string, updates: Partial<WorkspaceTab>) => void;
    setTabData: (id: string, data: Record<string, unknown>) => void;
    setTabDirty: (id: string, isDirty: boolean) => void;

    // Métodos de búsqueda y utilidad
    findTabByUrl: (url: string) => WorkspaceTab | undefined;
    getTabById: (id: string) => WorkspaceTab | undefined;
    closeAllTabs: () => void;
    closeOtherTabs: (id: string) => void;
    closeTabsToRight: (id: string) => void;

    // Sincronización con router
    syncWithRouter: (pathname: string) => void;

    // Persistencia clínica (sin cambios, existente)
    clinicalState: Record<string, ClinicalFormState>;
    setClinicalState: (patientId: string, state: ClinicalFormState) => void;
    patientViewState: Record<string, number>;
    setPatientTab: (patientId: string, tabIndex: number) => void;
    historyTabIndex: number;
    setHistoryTab: (tabIndex: number) => void;

    // Persistencia de pestañas
    loadPersistedTabs: () => void;
}

export const useTabStore = create<TabState>((set, get) => ({
    tabs: [],
    activeTabId: null,

    /**
     * Agrega una nueva pestaña o activa una existente.
     * Usa generateTabId() para crear IDs únicos basados en la URL.
     */
    addTab: (tab) => {
        const { tabs } = get();

        // Normalizar la URL
        const normalizedUrl = normalizeTabUrl(tab.url);

        // Generar ID único basado en la URL
        const tabId = tab.id || generateTabId(normalizedUrl);

        // Validar que sea una ruta válida
        if (!isValidAppRoute(normalizedUrl)) {
            console.warn(`[TabStore] Intento de agregar ruta inválida: ${normalizedUrl}`);
            return;
        }

        // Buscar si ya existe una pestaña con este ID
        const existingTab = tabs.find((t) => t.id === tabId);

        if (existingTab) {
            // Si ya existe, solo activarla
            set({ activeTabId: tabId });
            return;
        }

        // Verificar límite máximo de pestañas
        if (tabs.length >= TAB_CONFIG.MAX_TABS) {
            console.warn(`[TabStore] Límite máximo de pestañas alcanzado (${TAB_CONFIG.MAX_TABS})`);

            // Cerrar la pestaña más antigua que no esté activa
            const oldestInactive = tabs.find(t => t.id !== get().activeTabId);
            if (oldestInactive) {
                get().removeTab(oldestInactive.id);
            } else {
                // Si todas están activas, no agregar
                return;
            }
        }

        // Crear nueva pestaña
        const newTab: WorkspaceTab = {
            id: tabId,
            title: tab.title,
            url: normalizedUrl,
            data: tab.data,
            isDirty: false,
        };

        const newTabs = [...tabs, newTab];
        set({ tabs: newTabs, activeTabId: tabId });

        // Persistir en localStorage
        saveTabsToStorage(newTabs, tabId);
    },

    /**
     * Remueve una pestaña por ID.
     * Si es la pestaña activa, activa la última pestaña disponible.
     */
    removeTab: (id) => {
        const { tabs, activeTabId } = get();

        // Buscar si la pestaña tiene cambios sin guardar
        const tab = tabs.find(t => t.id === id);
        if (tab?.isDirty) {
            // En producción, aquí iría una confirmación al usuario
            console.warn(`[TabStore] Cerrando pestaña con cambios sin guardar: ${tab.title}`);
        }

        const newTabs = tabs.filter((t) => t.id !== id);

        if (newTabs.length > 0) {
            // Si cerramos la pestaña activa, activar otra
            const newActiveId = activeTabId === id
                ? newTabs[newTabs.length - 1].id
                : activeTabId;

            set({ tabs: newTabs, activeTabId: newActiveId });
            saveTabsToStorage(newTabs, newActiveId);
        } else {
            // No quedan pestañas
            set({ tabs: [], activeTabId: null });
            saveTabsToStorage([], null);
        }
    },

    /**
     * Establece la pestaña activa por ID.
     */
    setActiveTab: (id) => {
        const { tabs } = get();
        const tab = tabs.find(t => t.id === id);

        if (!tab) {
            console.warn(`[TabStore] Intento de activar pestaña inexistente: ${id}`);
            return;
        }

        set({ activeTabId: id });
        saveTabsToStorage(tabs, id);
    },

    /**
     * Actualiza propiedades de una pestaña.
     */
    updateTab: (id, updates) => {
        set((state) => ({
            tabs: state.tabs.map((tab) =>
                tab.id === id ? { ...tab, ...updates } : tab
            ),
        }));
    },

    /**
     * Actualiza los datos de una pestaña (merge).
     */
    setTabData: (id, data) => {
        set((state) => ({
            tabs: state.tabs.map((tab) =>
                tab.id === id
                    ? {
                          ...tab,
                          data: {
                              ...(tab.data as Record<string, unknown> ?? {}),
                              ...data,
                          },
                      }
                    : tab
            ),
        }));
    },

    /**
     * Marca una pestaña como "dirty" (con cambios sin guardar).
     */
    setTabDirty: (id, isDirty) => {
        get().updateTab(id, { isDirty });
    },

    /**
     * Busca una pestaña por URL (comparación normalizada).
     */
    findTabByUrl: (url) => {
        const normalizedUrl = normalizeTabUrl(url);
        const targetId = generateTabId(normalizedUrl);
        return get().tabs.find((t) => t.id === targetId);
    },

    /**
     * Obtiene una pestaña por ID.
     */
    getTabById: (id) => {
        return get().tabs.find((t) => t.id === id);
    },

    /**
     * Cierra todas las pestañas.
     */
    closeAllTabs: () => {
        set({ tabs: [], activeTabId: null });
        saveTabsToStorage([], null);
    },

    /**
     * Cierra todas las pestañas excepto la especificada.
     */
    closeOtherTabs: (id) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === id);

        if (!tab) return;

        set({ tabs: [tab], activeTabId: id });
        saveTabsToStorage([tab], id);
    },

    /**
     * Cierra todas las pestañas a la derecha de la especificada.
     */
    closeTabsToRight: (id) => {
        const { tabs, activeTabId } = get();
        const index = tabs.findIndex((t) => t.id === id);

        if (index === -1 || index === tabs.length - 1) return;

        const newTabs = tabs.slice(0, index + 1);

        // Verificar si la pestaña activa fue cerrada
        const newActiveId = newTabs.find(t => t.id === activeTabId)
            ? activeTabId
            : newTabs[newTabs.length - 1].id;

        set({ tabs: newTabs, activeTabId: newActiveId });
        saveTabsToStorage(newTabs, newActiveId);
    },

    /**
     * Sincroniza el estado de pestañas con el pathname del router.
     * Este método es llamado por el hook useTabSync.
     */
    syncWithRouter: (pathname) => {
        const { tabs, activeTabId } = get();
        const normalizedPath = normalizeTabUrl(pathname);
        const targetId = generateTabId(normalizedPath);

        // Si es la ruta home, limpiar la pestaña activa
        if (pathname === '/') {
            if (activeTabId !== null) {
                set({ activeTabId: null });
            }
            return;
        }

        // Buscar si ya existe una pestaña para esta URL
        const existingTab = tabs.find(t => t.id === targetId);

        if (existingTab) {
            // Actualizar la pestaña activa si es diferente
            if (activeTabId !== targetId) {
                set({ activeTabId: targetId });
                saveTabsToStorage(tabs, targetId);
            }
        } else {
            // No existe pestaña para esta ruta
            // No crear automáticamente - dejar que el componente decida
            console.debug(`[TabStore] Ruta ${pathname} no tiene pestaña asociada`);
        }
    },

    /**
     * Carga pestañas persistidas desde localStorage.
     */
    loadPersistedTabs: () => {
        const persisted = loadTabsFromStorage();

        if (!persisted || persisted.tabs.length === 0) {
            return;
        }

        // Validar que todas las URLs sigan siendo válidas
        const validTabs = persisted.tabs
            .filter(tab => isValidAppRoute(tab.url))
            .map(tab => ({
                id: tab.id,
                title: tab.title,
                url: tab.url,
                isDirty: false,
            }));

        if (validTabs.length > 0) {
            set({
                tabs: validTabs,
                activeTabId: persisted.activeTabId,
            });
        }
    },

    // ── Persistencia clínica (sin cambios) ─────────────────────────────────
    clinicalState: {} as Record<string, ClinicalFormState>,
    setClinicalState: (patientId: string, state: ClinicalFormState) => {
        set((prev) => ({
            clinicalState: { ...prev.clinicalState, [patientId]: state },
        }));
    },

    patientViewState: {} as Record<string, number>,
    setPatientTab: (patientId: string, tabIndex: number) => {
        set((prev) => ({
            patientViewState: { ...prev.patientViewState, [patientId]: tabIndex },
        }));
    },

    historyTabIndex: 0,
    setHistoryTab: (tabIndex: number) => set({ historyTabIndex: tabIndex }),
}));
