/**
 * Hook para sincronización entre el router de Next.js y el sistema de pestañas.
 * Maneja la creación automática de pestañas y la sincronización bidireccional.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTabStore } from '@/store/useTabStore';
import { getTabTitle, generateTabId, normalizeTabUrl } from '@/lib/tabs-utils';
import type { Patient } from '@/types/database.types';

interface UseTabSyncOptions {
    /**
     * Si es true, crea automáticamente una pestaña cuando se navega a una ruta
     * que no tiene pestaña asociada. Default: true
     */
    autoCreateTab?: boolean;

    /**
     * Contexto adicional para generar el título de la pestaña
     */
    context?: {
        patient?: Patient | null;
        encounterReason?: string;
        appointmentTitle?: string;
    };

    /**
     * Si es true, no sincroniza la ruta "/" (home/tablero). Default: true
     */
    skipHome?: boolean;
}

/**
 * Hook para sincronizar el pathname actual con el sistema de pestañas.
 *
 * @param options - Opciones de configuración
 *
 * @example
 * ```tsx
 * // En un componente de página
 * function PatientPage({ patient }) {
 *   useTabSync({
 *     context: { patient },
 *     autoCreateTab: true
 *   });
 *
 *   return <div>Patient Detail</div>;
 * }
 * ```
 */
export function useTabSync(options: UseTabSyncOptions = {}) {
    const {
        autoCreateTab = true,
        context,
        skipHome = true,
    } = options;

    const pathname = usePathname();
    const { addTab, syncWithRouter } = useTabStore();

    // Usar ref para evitar re-sincronización innecesaria
    const lastSyncedPath = useRef<string | null>(null);

    useEffect(() => {
        // Evitar sincronizar la misma ruta múltiples veces
        if (lastSyncedPath.current === pathname) {
            return;
        }

        lastSyncedPath.current = pathname;

        // Skip home si está configurado
        if (skipHome && pathname === '/') {
            syncWithRouter(pathname);
            return;
        }

        // Intentar sincronizar primero
        syncWithRouter(pathname);

        // Si autoCreateTab está habilitado y no existe la pestaña, crearla
        if (autoCreateTab && pathname !== '/') {
            const normalizedUrl = normalizeTabUrl(pathname);
            const tabId = generateTabId(normalizedUrl);

            // Verificar si ya existe la pestaña
            const existingTab = useTabStore.getState().tabs.find(t => t.id === tabId);

            if (!existingTab) {
                // Generar título contextual
                const title = getTabTitle(pathname, context);

                addTab({
                    title,
                    url: pathname,
                });
            }
        }
    }, [pathname, addTab, syncWithRouter, autoCreateTab, skipHome, context]);

    return { pathname };
}

/**
 * Hook simplificado para rutas que siempre deben crear una pestaña.
 *
 * @param title - Título de la pestaña
 * @param context - Contexto adicional para el título dinámico
 *
 * @example
 * ```tsx
 * function PatientDetailPage({ patient }) {
 *   useAutoTab('Paciente', { patient });
 *   return <div>Content</div>;
 * }
 * ```
 */
export function useAutoTab(
    title?: string,
    context?: UseTabSyncOptions['context']
) {
    return useTabSync({
        autoCreateTab: true,
        context,
    });
}

/**
 * Hook para rutas que NO deben crear pestañas automáticamente
 * pero sí necesitan sincronizar.
 *
 * Útil para modales, páginas de configuración, etc.
 *
 * @example
 * ```tsx
 * function SettingsPage() {
 *   useSyncOnly();
 *   return <div>Settings</div>;
 * }
 * ```
 */
export function useSyncOnly() {
    return useTabSync({
        autoCreateTab: false,
    });
}
