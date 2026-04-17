'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePatientStore } from '@/store/usePatientStore';
import { getTodayAppointmentsWithPatients } from '@/actions/appointments';
import { 
    Users, 
    UserPlus, 
    ChevronRight,
    Circle,
    LayoutGrid,
    Search
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TodayQueueItem {
    id: string;
    start_time: string;
    status: string;
    patient_id: string;
    patient_name: string;
}

export default function PatientsSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [todayQueue, setTodayQueue] = useState<TodayQueueItem[]>([]);
    const { openPatientTab, setActivePatient, tabs: openedTabs } = usePatientStore();

    // Collapsible states
    const [openNav, setOpenNav] = useState(true);
    const [openToday, setOpenToday] = useState(true);
    const [openRecent, setOpenRecent] = useState(true);

    useEffect(() => {
        getTodayAppointmentsWithPatients().then(setTodayQueue);
    }, []);

    const handleOpenPatient = (id: string, name: string) => {
        openPatientTab({ id, name });
        setActivePatient(id);
        router.push(`/patients/${id}`);
    };

    const filteredQueue = useMemo(() => {
        if (!searchQuery) return todayQueue;
        return todayQueue.filter(item => 
            item.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [todayQueue, searchQuery]);

    const filteredOpened = useMemo(() => {
        if (!searchQuery) return openedTabs;
        return openedTabs.filter(tab => 
            tab.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [openedTabs, searchQuery]);

    return (
        <div className="flex flex-col h-full bg-sidebar border-r border-border/40 font-sans">
            
            {/* ── HEADER DEL MÓDULO (h-12) ── */}
            <div className="flex items-center h-12 px-4 border-b border-border/40 shrink-0">
                <span className="text-base font-semibold text-foreground tracking-tight">
                    Pacientes
                </span>
            </div>

            {/* ── BÚSQUEDA INTEGRADA (InnerSideBarFilterSearchInput style) ── */}
            <div className="px-3 py-3 border-b border-border/20">
                <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Buscar..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-9 pr-2 bg-muted/20 border-border/10 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:bg-background transition-all placeholder:text-muted-foreground/40"
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

                <div className="h-2" />

                {/* ── SECCIÓN: COLA DE HOY ── */}
                <Collapsible open={openToday} onOpenChange={setOpenToday} className="group/collapsible">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center justify-between w-full px-4 py-2 text-xs tracking-wider uppercase font-bold text-muted-foreground/60 hover:text-foreground transition-colors group">
                            <div className="flex items-center gap-2">
                                <ChevronRight className={cn(
                                    "w-3 h-3 transition-transform duration-200",
                                    openToday && "rotate-90"
                                )} />
                                <span>Citas de hoy</span>
                            </div>
                            <Badge variant="secondary" className="h-4 px-1 rounded-sm text-[10px] font-bold bg-muted/50 text-muted-foreground/60 border-none">
                                {todayQueue.length}
                            </Badge>
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenu className="px-2">
                            {filteredQueue.length === 0 ? (
                                <div className="px-8 py-2 text-xs text-muted-foreground/40 italic leading-relaxed">
                                    {searchQuery ? 'Sin coincidencias' : 'Sin citas para hoy'}
                                </div>
                            ) : (
                                filteredQueue.map((item) => (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton 
                                            onClick={() => handleOpenPatient(item.patient_id, item.patient_name)}
                                            isActive={pathname.includes(item.patient_id)}
                                            className="h-9 px-3 group/item transition-colors duration-100"
                                        >
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full shrink-0",
                                                item.status === 'arrived' 
                                                    ? "bg-[var(--clinical-stable)] shadow-[0_0_6px_var(--clinical-stable)/0.4]" 
                                                    : "bg-muted-foreground/20"
                                            )} />
                                            <span className="truncate flex-1 text-sm font-medium">{item.patient_name}</span>
                                            <span className="text-[11px] tabular-nums text-muted-foreground/40 group-hover/item:text-muted-foreground/70 transition-colors">
                                                {new Date(item.start_time).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))
                            )}
                        </SidebarMenu>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    );
}
