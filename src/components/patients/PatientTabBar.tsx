'use client';

import { usePatientStore } from '@/store/usePatientStore';
import { X, Users, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';

export default function PatientTabBar() {
    const { tabs, activePatientId, setActivePatient, closePatientTab } = usePatientStore();
    const router = useRouter();
    const pathname = usePathname();

    const handleTabClick = (id: string, url: string) => {
        setActivePatient(id);
        router.push(url);
    };

    const handleCloseTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        closePatientTab(id);
        
        if (tabs.length <= 1) {
            router.push('/patients');
        } else if (activePatientId === id) {
            const remaining = tabs.filter(t => t.id !== id);
            router.push(remaining[remaining.length - 1].url);
        }
    };

    return (
        <div className="flex items-center h-full overflow-x-auto no-scrollbar flex-1 bg-transparent px-2">
            {/* Pestaña "Raíz" - Estilo Supabase: Texto con barra inferior fina */}
            <button
                onClick={() => { setActivePatient(null); router.push('/patients'); }}
                className={cn(
                    'flex items-center gap-2 h-full px-4 text-[13px] font-semibold tracking-tight transition-all relative',
                    pathname === '/patients'
                        ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                        : 'text-muted-foreground/80 hover:text-foreground'
                )}
            >
                <Users className="w-4 h-4" />
                <span>Pacientes</span>
            </button>

            {/* Separador vertical sutil */}
            <div className="w-px h-4 bg-border/60 mx-1" />

            {/* Pestañas de pacientes */}
            {tabs.map((tab) => {
                const isActive = activePatientId === tab.id;
                
                return (
                    <ContextMenu key={tab.id}>
                        <ContextMenuTrigger asChild>
                            <button
                                onClick={() => handleTabClick(tab.id, tab.url)}
                                className={cn(
                                    'group flex items-center gap-2 h-full px-4 text-[13px] transition-all relative min-w-fit max-w-[200px]',
                                    isActive
                                        ? 'text-foreground font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {tab.isDirty && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                )}
                                
                                <span className="truncate flex-1 text-left">
                                    {tab.name}
                                </span>

                                <div
                                    onClick={(e) => handleCloseTab(e, tab.id)}
                                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all ml-1"
                                >
                                    <X className="w-3 h-3" />
                                </div>
                            </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem onClick={() => closePatientTab(tab.id)}>
                                Cerrar Pestaña
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => router.push(`/patients/${tab.id}/edit`)}>
                                Editar Expediente
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                );
            })}

            <button
                onClick={() => router.push('/patients/new')}
                className="flex items-center justify-center h-7 w-7 ml-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                title="Nuevo Paciente"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}
