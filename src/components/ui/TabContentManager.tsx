'use client';

import React, { useRef, useEffect } from 'react';
import { useTabStore } from '@/store/useTabStore';

interface TabContentManagerProps {
    children: React.ReactNode;
}

/**
 * TabContentManager mejorado con preservación de scroll position.
 *
 * Renderiza el contenido de cada pestaña en el DOM pero solo muestra
 * la pestaña activa usando display:none. Esto permite:
 * - Preservar el scroll position al cambiar entre pestañas
 * - Mantener el estado de los componentes montados
 * - Evitar re-renders innecesarios
 *
 * Estrategia:
 * 1. Cada pestaña tiene su propio contenedor div con ref
 * 2. Se guarda el scrollTop antes de cambiar de pestaña
 * 3. Se restaura el scrollTop al volver a la pestaña
 */
export default function TabContentManager({ children }: TabContentManagerProps) {
    const { tabs, activeTabId } = useTabStore();

    // Map para guardar las posiciones de scroll de cada pestaña
    const scrollPositions = useRef<Map<string, number>>(new Map());

    // Refs para los contenedores de cada pestaña
    const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Guardar scroll position cuando cambia la pestaña activa
    useEffect(() => {
        // Guardar la posición de scroll de todas las pestañas visibles
        tabs.forEach(tab => {
            const container = containerRefs.current.get(tab.id);
            if (container) {
                const scrollTop = container.scrollTop;
                if (scrollTop > 0) {
                    scrollPositions.current.set(tab.id, scrollTop);
                }
            }
        });

        // Restaurar la posición de scroll de la pestaña activa
        if (activeTabId) {
            const container = containerRefs.current.get(activeTabId);
            const savedPosition = scrollPositions.current.get(activeTabId);

            if (container && savedPosition) {
                // Usar requestAnimationFrame para asegurar que el DOM está listo
                requestAnimationFrame(() => {
                    container.scrollTop = savedPosition;
                });
            }
        }
    }, [activeTabId, tabs]);

    // Si no hay pestañas, renderizar children directamente
    if (tabs.length === 0) {
        return <>{children}</>;
    }

    return (
        <>
            {tabs.map((tab) => {
                const isActiveTab = activeTabId === tab.id;

                return (
                    <div
                        key={tab.id}
                        ref={(el) => {
                            if (el) {
                                containerRefs.current.set(tab.id, el);
                            } else {
                                containerRefs.current.delete(tab.id);
                            }
                        }}
                        style={{
                            display: isActiveTab ? 'block' : 'none',
                            height: '100%',
                            overflow: 'auto',
                        }}
                        data-tab-id={tab.id}
                        data-tab-active={isActiveTab}
                    >
                        {isActiveTab && children}
                    </div>
                );
            })}
        </>
    );
}
