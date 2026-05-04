'use client';

import React from 'react';
import { CalendarDays, CheckSquare } from 'lucide-react';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useRouter, usePathname } from 'next/navigation';

interface AppointmentsSidebarProps {
}

export default function AppointmentsSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-sidebar border-r border-border/40 font-sans">
            {/* Header */}
            <div className="px-4 py-3 flex items-center border-b border-border/40 shrink-0">
                <span className="text-base font-semibold text-foreground tracking-tight">
                    Citas
                </span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                <SidebarMenu className="px-2">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            isActive={pathname === '/appointments'}
                            onClick={() => router.push('/appointments')}
                            className="h-9 px-3"
                        >
                            <CalendarDays className="w-4 h-4 text-muted-foreground/50" />
                            <span className="text-sm font-medium">Agenda</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => router.push('/appointments?view=queue')}
                            className="h-9 px-3"
                        >
                            <CheckSquare className="w-4 h-4 text-muted-foreground/50" />
                            <span className="text-sm font-medium">Cola de espera</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </div>
        </div>
    );
}