'use client';

import React, { useState } from 'react';
import {
    Activity,
    CheckSquare,
    BookOpen,
    LayoutTemplate,
    Search,
    FileSearch,
    FilePlus,
    Clock,
    ChevronRight,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function SpecialtySidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');

    // Collapsible states
    const [openNav, setOpenNav] = useState(true);
    const [openStatus, setOpenStatus] = useState(true);
    const [openResources, setOpenResources] = useState(true);

    const isAllActive = pathname === '/history/all' && !getCurrentStatus();
    const isInProgressActive = getCurrentStatus() === 'in-progress';
    const isFinishedActive = getCurrentStatus() === 'finished';

    function getCurrentStatus() {
        if (typeof window === 'undefined') return null;
        return new URLSearchParams(window.location.search).get('status');
    }

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            router.push(`/history/all?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div className="flex flex-col h-full bg-sidebar border-r border-border/40 font-sans">

            {/* ── HEADER DEL MÓDULO (h-12) ── */}
            <div className="flex items-center h-12 px-4 border-b border-border/40 shrink-0">
                <span className="text-base font-semibold text-foreground tracking-tight">
                    Historia clínica
                </span>
            </div>

            {/* ── BÚSQUEDA INTEGRADA ── */}
            <div className="px-3 py-3 border-b border-border/20">
                <div className="relative group/search">
                    <Input
                        placeholder="Buscar especialidad..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pr-2 bg-muted/20 border-border text-sm rounded-md focus-visible:bg-background transition-all placeholder:text-neutral-8"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">

                {/* ── SECCIÓN: NAVEGACIÓN ── */}
                <Collapsible open={openNav} onOpenChange={setOpenNav} className="group/collapsible">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 w-full px-4 py-2 text-xs tracking-wider uppercase font-bold text-muted-foreground/60 hover:text-foreground transition-colors group">
                            <ChevronRight className={cn(
                                "w-3 h-3 transition-transform duration-200",
                                openNav && "rotate-90"
                            )} />
                            <span>Navegación</span>
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenu className="px-2">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={isAllActive}
                                    onClick={() => router.push('/history/all')}
                                    className="h-9 px-3"
                                >
                                    <FileSearch className="w-4 h-4 text-muted-foreground/50" />
                                    <span className="text-sm font-medium">Todas las consultas</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={pathname === '/history' && !new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('encounterId')}
                                    onClick={() => router.push('/history')}
                                    className="h-9 px-3"
                                >
                                    <FilePlus className="w-4 h-4 text-muted-foreground/50" />
                                    <span className="text-sm font-medium">Nueva consulta</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </CollapsibleContent>
                </Collapsible>

                <div className="h-2" />

                {/* ── SECCIÓN: ESTADO ── */}
                <Collapsible open={openStatus} onOpenChange={setOpenStatus} className="group/collapsible">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 w-full px-4 py-2 text-xs tracking-wider uppercase font-bold text-muted-foreground/60 hover:text-foreground transition-colors group">
                            <ChevronRight className={cn(
                                "w-3 h-3 transition-transform duration-200",
                                openStatus && "rotate-90"
                            )} />
                            <span>Estado</span>
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenu className="px-2">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={isInProgressActive}
                                    onClick={() => router.push('/history/all?status=in-progress')}
                                    className="h-9 px-3"
                                >
                                    <Activity className="w-4 h-4 text-emerald-500/70" />
                                    <span className="text-sm font-medium">En curso</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={isFinishedActive}
                                    onClick={() => router.push('/history/all?status=finished')}
                                    className="h-9 px-3"
                                >
                                    <CheckSquare className="w-4 h-4 text-primary/60" />
                                    <span className="text-sm font-medium">Finalizadas</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => router.push('/history/all?status=planned')}
                                    className="h-9 px-3"
                                >
                                    <Clock className="w-4 h-4 text-amber-500/70" />
                                    <span className="text-sm font-medium">Planificadas</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </CollapsibleContent>
                </Collapsible>

                <div className="h-2" />

                {/* ── SECCIÓN: RECURSOS ── */}
                <Collapsible open={openResources} onOpenChange={setOpenResources} className="group/collapsible">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 w-full px-4 py-2 text-xs tracking-wider uppercase font-bold text-muted-foreground/60 hover:text-foreground transition-colors group">
                            <ChevronRight className={cn(
                                "w-3 h-3 transition-transform duration-200",
                                openResources && "rotate-90"
                            )} />
                            <span>Recursos</span>
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenu className="px-2">
                            <SidebarMenuItem>
                                <SidebarMenuButton className="h-9 px-3">
                                    <BookOpen className="w-4 h-4 text-muted-foreground/50" />
                                    <span className="text-sm font-medium">Buscador CIE-10</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="h-9 px-3">
                                    <LayoutTemplate className="w-4 h-4 text-muted-foreground/50" />
                                    <span className="text-sm font-medium">Plantillas</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </CollapsibleContent>
                </Collapsible>

            </div>
        </div>
    );
}
