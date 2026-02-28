'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTabStore } from '@/store/useTabStore';

interface TabContentManagerProps {
    children: React.ReactNode;
}

export default function TabContentManager({ children }: TabContentManagerProps) {
    const pathname = usePathname();
    const { tabs, activeTabId } = useTabStore();

    // Guardamos un caché de los React Nodes por cada URL en el estado
    const [cache, setCache] = useState<Record<string, React.ReactNode>>({});

    useEffect(() => {
        if (pathname) {
            setCache((prev) => ({ ...prev, [pathname]: children }));
        }
    }, [pathname, children]);

    // Limpieza de caché cuando se cierra una pestaña
    useEffect(() => {
        const activeUrls = tabs.map(t => t.url);

        setCache((prev) => {
            const newCache = { ...prev };
            Object.keys(newCache).forEach(url => {
                if (url !== '/' && !activeUrls.includes(url)) {
                    delete newCache[url];
                }
            });
            return newCache;
        });
    }, [tabs]);

    return (
        <>
            {tabs.map((tab) => {
                const isActiveTab = activeTabId === tab.id;
                const isCurrentRoute = pathname === tab.url;

                // Si es la ruta actual, mostramos children directamente para no tener retraso.
                // Si no, mostramos lo guardado en el caché.
                const content = isCurrentRoute ? children : cache[tab.url];

                return (
                    <div
                        key={tab.id}
                        style={{
                            display: isActiveTab ? 'block' : 'none',
                            height: '100%'
                        }}
                    >
                        {content}
                    </div>
                );
            })}
        </>
    );
}
