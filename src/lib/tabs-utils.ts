/**
 * Utilidades para el sistema de gestión de pestañas (tabs)
 * Proporciona funciones para normalización de URLs, generación de IDs únicos
 * y obtención de títulos de pestañas de forma consistente.
 */

import type { Patient } from '@/types/database.types';

/**
 * Genera un ID único para una pestaña basado en la URL completa.
 * Usa un hash simple pero efectivo para evitar duplicados.
 *
 * @param url - URL completa de la pestaña
 * @returns Hash único como string
 */
export function generateTabId(url: string): string {
    const normalized = normalizeTabUrl(url);
    // Usar la URL normalizada como ID directamente para mejor debugging
    // Si necesitamos IDs más cortos en el futuro, podemos usar un hash
    return normalized;
}

/**
 * Normaliza una URL para comparación consistente.
 * - Elimina trailing slashes
 * - Preserva query params importantes (patientId, encounterId, appointmentId)
 * - Convierte a lowercase
 *
 * @param url - URL a normalizar
 * @returns URL normalizada
 */
export function normalizeTabUrl(url: string): string {
    try {
        // Crear URL object para parsing robusto
        const urlObj = new URL(url, 'http://localhost');

        // Eliminar trailing slash del pathname
        const pathname = urlObj.pathname.replace(/\/$/, '') || '/';

        // Query params importantes que deben preservarse en el ID
        const importantParams = ['patientId', 'encounterId', 'appointmentId', 'id'];
        const params = new URLSearchParams();

        importantParams.forEach(param => {
            const value = urlObj.searchParams.get(param);
            if (value) {
                params.set(param, value);
            }
        });

        const query = params.toString();
        const result = query ? `${pathname}?${query}` : pathname;

        return result.toLowerCase();
    } catch {
        // Fallback si no es una URL válida
        return url.replace(/\/$/, '').toLowerCase();
    }
}

/**
 * Obtiene el título apropiado para una pestaña basado en el pathname
 * y datos opcionales del contexto (ej: paciente, cita).
 *
 * @param pathname - Ruta de la aplicación
 * @param context - Contexto adicional (paciente, etc.)
 * @returns Título de la pestaña
 */
export function getTabTitle(
    pathname: string,
    context?: {
        patient?: Patient | null;
        encounterReason?: string;
        appointmentTitle?: string;
    }
): string {
    // Rutas base
    const routeTitles: Record<string, string> = {
        '/': 'Tablero',
        '/patients': 'Pacientes',
        '/history': 'Historia Clínica',
        '/appointments': 'Citas',
        '/prescriptions': 'Recetas',
        '/settings': 'Configuración',
    };

    // Buscar coincidencia exacta primero
    if (routeTitles[pathname]) {
        return routeTitles[pathname];
    }

    // Rutas dinámicas
    if (pathname.startsWith('/patients/')) {
        if (pathname.includes('/edit')) {
            return context?.patient
                ? `Editar: ${context.patient.name_given?.[0]} ${context.patient.name_family}`
                : 'Editar Paciente';
        }
        if (pathname === '/patients/new') {
            return 'Nuevo Paciente';
        }
        // Vista de detalle de paciente
        return context?.patient
            ? `${context.patient.name_given?.[0]} ${context.patient.name_family}`
            : 'Paciente';
    }

    if (pathname.startsWith('/history')) {
        return context?.encounterReason || 'Historia Clínica';
    }

    if (pathname.startsWith('/appointments')) {
        return context?.appointmentTitle || 'Citas';
    }

    // Fallback: capitalizar y limpiar el pathname
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    return lastSegment
        ? lastSegment
              .replace(/-/g, ' ')
              .replace(/_/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
        : 'Página';
}

/**
 * Determina si dos URLs deben considerarse la misma pestaña.
 *
 * @param url1 - Primera URL
 * @param url2 - Segunda URL
 * @returns true si son la misma pestaña
 */
export function isSameTab(url1: string, url2: string): boolean {
    return generateTabId(url1) === generateTabId(url2);
}

/**
 * Extrae el patientId de una URL si existe.
 *
 * @param url - URL a analizar
 * @returns ID del paciente o null
 */
export function extractPatientId(url: string): string | null {
    try {
        const urlObj = new URL(url, 'http://localhost');

        // Desde query param
        const queryPatientId = urlObj.searchParams.get('patientId');
        if (queryPatientId) return queryPatientId;

        // Desde pathname /patients/:id
        const match = urlObj.pathname.match(/^\/patients\/([a-f0-9-]{36})/i);
        if (match) return match[1];

        return null;
    } catch {
        return null;
    }
}

/**
 * Valida si una URL es una ruta válida de la aplicación.
 *
 * @param url - URL a validar
 * @returns true si es una ruta válida
 */
export function isValidAppRoute(url: string): boolean {
    const validRoutes = [
        '/',
        '/patients',
        '/history',
        '/appointments',
        '/prescriptions',
        '/settings',
    ];

    const normalized = normalizeTabUrl(url);

    // Ruta exacta
    if (validRoutes.includes(normalized)) return true;

    // Subrutas válidas
    const validPrefixes = ['/patients/', '/history', '/appointments/', '/settings/'];
    return validPrefixes.some(prefix => normalized.startsWith(prefix));
}

/**
 * Configuración del sistema de pestañas.
 */
export const TAB_CONFIG = {
    MAX_TABS: 10,
    DEFAULT_TAB_ID: '/',
    DEFAULT_TAB_TITLE: 'Tablero',
    STORAGE_KEY: 'clinicboard:tabs:state',
    STORAGE_VERSION: 1,
} as const;

/**
 * Tipo para el estado de persistencia de pestañas.
 */
export interface PersistedTabsState {
    version: number;
    tabs: Array<{
        id: string;
        title: string;
        url: string;
        timestamp: number;
    }>;
    activeTabId: string | null;
}

/**
 * Guarda el estado de las pestañas en localStorage.
 *
 * @param tabs - Array de pestañas
 * @param activeTabId - ID de la pestaña activa
 */
export function saveTabsToStorage(
    tabs: Array<{ id: string; title: string; url: string }>,
    activeTabId: string | null
): void {
    try {
        const state: PersistedTabsState = {
            version: TAB_CONFIG.STORAGE_VERSION,
            tabs: tabs.map(tab => ({
                ...tab,
                timestamp: Date.now(),
            })),
            activeTabId,
        };
        localStorage.setItem(TAB_CONFIG.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.warn('Failed to save tabs to storage:', error);
    }
}

/**
 * Carga el estado de las pestañas desde localStorage.
 *
 * @returns Estado de pestañas o null si no existe o es inválido
 */
export function loadTabsFromStorage(): PersistedTabsState | null {
    try {
        const stored = localStorage.getItem(TAB_CONFIG.STORAGE_KEY);
        if (!stored) return null;

        const state = JSON.parse(stored) as PersistedTabsState;

        // Validar versión
        if (state.version !== TAB_CONFIG.STORAGE_VERSION) {
            console.warn('Tabs storage version mismatch, clearing');
            localStorage.removeItem(TAB_CONFIG.STORAGE_KEY);
            return null;
        }

        // Filtrar tabs muy antiguas (más de 7 días)
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        state.tabs = state.tabs.filter(tab => tab.timestamp > weekAgo);

        return state;
    } catch (error) {
        console.warn('Failed to load tabs from storage:', error);
        return null;
    }
}

/**
 * Limpia el storage de pestañas.
 */
export function clearTabsStorage(): void {
    try {
        localStorage.removeItem(TAB_CONFIG.STORAGE_KEY);
    } catch (error) {
        console.warn('Failed to clear tabs storage:', error);
    }
}
