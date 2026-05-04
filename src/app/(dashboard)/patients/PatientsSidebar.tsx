'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    Users,
    UserPlus,
    ChevronRight,
} from 'lucide-react';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useRouter, usePathname } from 'next/navigation';

export default function PatientsSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const [openNav, setOpenNav] = useState(true);

    return (
        <div className="flex flex-col h-full bg-sidebar border-r border-border/40 font-sans">

            {/* ── HEADER DEL MÓDULO (h-12) ── */}
            <div className="flex items-center h-12 px-4 border-b border-border/40 shrink-0">
                <span className="text-base font-semibold text-foreground tracking-tight">
                    Pacientes
                </span>
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
                                    isActive={pathname === '/patients'}
                                    onClick={() => router.push('/patients')}
                                    className="h-9 px-3"
                                >
                                    <Users className="w-4 h-4 text-muted-foreground/50" />
                                    <span className="text-sm font-medium">Todos los pacientes</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={pathname === '/patients/new'}
                                    onClick={() => router.push('/patients/new')}
                                    className="h-9 px-3"
                                >
                                    <UserPlus className="w-4 h-4 text-muted-foreground/50" />
                                    <span className="text-sm font-medium">Nuevo registro</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </CollapsibleContent>
                </Collapsible>

            </div>
        </div>
    );
}