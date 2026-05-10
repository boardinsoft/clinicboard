'use client';

import { useTabStore } from '@/store/useTabStore';
import { X, Circle, Users, FileText, Calendar, Pill, File } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';

interface TabData {
    encounterStatus?: 'in-progress' | 'arrived' | null;
    appointmentTime?: string | null;
}

// Helper: icono según módulo
function ModuleIcon({ modulePrefix }: { modulePrefix: string }) {
    if (modulePrefix.startsWith('/patients')) return <Users className="w-3.5 h-3.5 shrink-0" />;
    if (modulePrefix.startsWith('/history')) return <FileText className="w-3.5 h-3.5 shrink-0" />;
    if (modulePrefix.startsWith('/appointments')) return <Calendar className="w-3.5 h-3.5 shrink-0" />;
    if (modulePrefix.startsWith('/prescriptions')) return <Pill className="w-3.5 h-3.5 shrink-0" />;
    return <File className="w-3.5 h-3.5 shrink-0" />;
}

export default function TabBar() {
    const { tabs, activeTabId, setActiveTab, removeTab, closeAllTabs, closeOtherTabs, closeTabsToRight } = useTabStore();
    const router = useRouter();
    const pathname = usePathname() || '/';

    // Derive module prefix from pathname
    const modulePrefix = pathname === '/' ? '' : '/' + pathname.split('/')[1];

    // Filter tabs to only those belonging to the current module
    const moduleTabs = modulePrefix ? tabs.filter(t => t.url.startsWith(modulePrefix)) : [];

    if (moduleTabs.length === 0) return null;

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
        const tab = moduleTabs.find(t => t.id === id);
        if (tab) {
            router.push(tab.url);
        }
    };

    const handleCloseToRight = (id: string) => {
        closeTabsToRight(id);
    };

    return (
        <div className="flex items-end h-full overflow-x-auto no-scrollbar flex-1">
            {moduleTabs.map((tab, index) => {
                const isActive = tab.id === activeTabId;
                const data = tab.data as TabData | undefined;
                const encounterStatus = data?.encounterStatus;
                const appointmentTime = data?.appointmentTime;

                // Dot de estado (reemplaza al isDirty dot solo si hay encounterStatus)
                const statusDot = encounterStatus === 'in-progress' ? (
                    <span
                        className="w-1.5 h-1.5 rounded-full bg-s-success shrink-0 ring-1 ring-s-success/30"
                        aria-label="Consulta en progreso"
                    />
                ) : encounterStatus === 'arrived' ? (
                    <span
                        className="w-1.5 h-1.5 rounded-full bg-s-warning shrink-0 ring-1 ring-s-warning/30"
                        aria-label="Paciente en sala de espera"
                    />
                ) : tab.isDirty ? (
                    <Circle className="w-1.5 h-1.5 fill-primary text-primary shrink-0" aria-label="Cambios sin guardar" />
                ) : null;

                return (
                    <ContextMenu key={tab.id}>
                        <ContextMenuTrigger asChild>
                            <button
                                onClick={() => handleTabClick(tab.id, tab.url)}
                                className={cn(
                                    'group flex flex-col items-start gap-0 h-full px-3 text-xs shrink-0 py-0',
                                    'border-b-2 transition-colors duration-100',
                                    isActive
                                        ? 'text-foreground border-foreground'
                                        : 'text-muted-foreground hover:text-foreground border-transparent'
                                )}
                            >
                                <div className="flex items-center gap-1.5 w-full">
                                    {statusDot ?? <ModuleIcon modulePrefix={modulePrefix} />}
                                    <span className="truncate max-w-[140px]" title={tab.title}>{tab.title}</span>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => handleCloseTab(e, tab.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleCloseTab(e, tab.id);
                                            }
                                        }}
                                        aria-label={`Cerrar ${tab.title}`}
                                        className={cn(
                                            'h-4 w-4 rounded-sm flex items-center justify-center ml-0.5 shrink-0',
                                            'text-muted-foreground hover:text-foreground hover:bg-muted',
                                            'opacity-0 group-hover:opacity-100 transition-all duration-150'
                                        )}
                                    >
                                        <X className="h-3 w-3" />
                                    </div>
                                </div>
                                {appointmentTime && (
                                    <span className="text-[10px] text-muted-foreground/60 leading-none pl-5 -mt-0.5">
                                        {appointmentTime}
                                    </span>
                                )}
                            </button>
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
                                disabled={moduleTabs.length === 1}
                            >
                                Cerrar otras
                            </ContextMenuItem>
                            <ContextMenuItem
                                onClick={() => handleCloseToRight(tab.id)}
                                disabled={index === moduleTabs.length - 1}
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
                );
            })}
        </div>
    );
}
