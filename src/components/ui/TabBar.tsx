'use client';

import { useTabStore } from '@/store/useTabStore';
import { X, Circle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';

export default function TabBar() {
    const { tabs, activeTabId, setActiveTab, removeTab, closeAllTabs, closeOtherTabs, closeTabsToRight } = useTabStore();
    const router = useRouter();

    const handleTabClick = (tabId: string, url: string) => {
        setActiveTab(tabId);
        router.push(url);
    };

    const handleCloseTab = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
        e.stopPropagation();

        const { tabs: currentTabs, activeTabId: currentActiveId } = useTabStore.getState();

        // Verificar si la pestaña tiene cambios sin guardar
        const tab = currentTabs.find(t => t.id === id);
        if (tab?.isDirty) {
            // TODO: Mostrar confirmación al usuario antes de cerrar
            // Por ahora solo emitir advertencia
            console.warn(`Cerrando pestaña con cambios sin guardar: ${tab.title}`);
        }

        // Remover la pestaña
        removeTab(id);

        // Si cerramos la pestaña activa, navegar a la nueva pestaña activa
        if (currentActiveId === id) {
            const newTabs = currentTabs.filter(t => t.id !== id);
            if (newTabs.length > 0) {
                const nextTab = newTabs[newTabs.length - 1];
                router.push(nextTab.url);
            } else {
                // No quedan pestañas, ir al tablero
                router.push('/');
            }
        }
    };

    const handleCloseAll = () => {
        closeAllTabs();
        router.push('/');
    };

    const handleCloseOthers = (id: string) => {
        closeOtherTabs(id);
        const tab = tabs.find(t => t.id === id);
        if (tab) {
            router.push(tab.url);
        }
    };

    const handleCloseToRight = (id: string) => {
        closeTabsToRight(id);
    };

    if (tabs.length === 0) return null;

    return (
        <Tabs
            value={activeTabId || undefined}
            onValueChange={(val) => {
                const tab = tabs.find(t => t.id === val);
                if (tab) handleTabClick(tab.id, tab.url);
            }}
            className="w-full"
        >
            <TabsList className="justify-start overflow-x-auto no-scrollbar max-w-full h-9">
                {tabs.map((tab, index) => (
                    <ContextMenu key={tab.id}>
                        <ContextMenuTrigger asChild>
                            <TabsTrigger
                                value={tab.id}
                                className={cn(
                                    "group relative flex items-center h-7 px-3 gap-2 min-w-[120px] max-w-[200px]",
                                    "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                )}
                            >
                                {/* Indicador de cambios sin guardar */}
                                {tab.isDirty && (
                                    <Circle
                                        className="w-2 h-2 fill-primary text-primary shrink-0"
                                        aria-label="Cambios sin guardar"
                                    />
                                )}

                                {/* Título de la pestaña */}
                                <span
                                    className="truncate flex-1 text-xs"
                                    title={tab.title}
                                >
                                    {tab.title}
                                </span>

                                {/* Botón de cerrar */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className={cn(
                                        "h-4 w-4 rounded-sm shrink-0 p-0 flex items-center justify-center",
                                        "text-muted-foreground hover:text-foreground",
                                        "opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-muted",
                                        "transition-all duration-150"
                                    )}
                                    onClick={(e) => handleCloseTab(e, tab.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleCloseTab(e, tab.id);
                                        }
                                    }}
                                    aria-label={`Cerrar ${tab.title}`}
                                >
                                    <X className="h-3 w-3" />
                                </div>
                            </TabsTrigger>
                        </ContextMenuTrigger>

                        {/* Context Menu (click derecho) */}
                        <ContextMenuContent className="w-48">
                            <ContextMenuItem
                                onClick={() => handleCloseTab(
                                    { stopPropagation: () => {} } as React.MouseEvent,
                                    tab.id
                                )}
                            >
                                Cerrar
                            </ContextMenuItem>
                            <ContextMenuItem
                                onClick={() => handleCloseOthers(tab.id)}
                                disabled={tabs.length === 1}
                            >
                                Cerrar otras
                            </ContextMenuItem>
                            <ContextMenuItem
                                onClick={() => handleCloseToRight(tab.id)}
                                disabled={index === tabs.length - 1}
                            >
                                Cerrar a la derecha
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                                onClick={handleCloseAll}
                                className="text-destructive focus:text-destructive"
                            >
                                Cerrar todas
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                ))}
            </TabsList>
        </Tabs>
    );
}
