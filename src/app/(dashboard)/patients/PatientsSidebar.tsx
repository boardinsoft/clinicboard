'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePatientStore } from '@/store/usePatientStore';
import { getTodayAppointmentsWithPatients } from '@/actions/appointments';
import { 
    Users, 
    UserPlus, 
    Clock, 
    History, 
    ChevronRight,
    Circle
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuBadge,
    SidebarSeparator,
} from "@/components/ui/sidebar";

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
    const [todayQueue, setTodayQueue] = useState<TodayQueueItem[]>([]);
    const { openPatientTab, setActivePatient, tabs: openedTabs } = usePatientStore();

    useEffect(() => {
        getTodayAppointmentsWithPatients().then(setTodayQueue);
    }, []);

    const handleOpenPatient = (id: string, name: string) => {
        openPatientTab({ id, name });
        setActivePatient(id);
        router.push(`/patients/${id}`);
    };

    return (
        <div className="flex flex-col h-full bg-sidebar border-r border-border/40">
            
            {/* ── ENCABEZADO DE SECCIÓN ── */}
            <SidebarGroup className="py-2 pb-0">
                <SidebarGroupLabel className="text-foreground font-bold text-sm">Tabla de Pacientes</SidebarGroupLabel>
            </SidebarGroup>

            <SidebarSeparator className="my-2" />

            {/* ── NAVEGACIÓN PRINCIPAL ── */}
            <SidebarGroup className="pt-0">
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton 
                                isActive={pathname === '/patients'}
                                onClick={() => router.push('/patients')}
                                tooltip="Explorar todos los pacientes"
                            >
                                <Users className="w-4 h-4" />
                                <span>Explorar todos</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton 
                                isActive={pathname === '/patients/new'}
                                onClick={() => router.push('/patients/new')}
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Nuevo Paciente</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            {/* ── SECCIÓN: COLA DE HOY ── */}
            <SidebarGroup>
                <SidebarGroupLabel className="flex items-center justify-between">
                    <span>Cola de Hoy</span>
                    <Clock className="w-3 h-3 opacity-50" />
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {todayQueue.length === 0 ? (
                            <div className="px-2 py-3 text-[11px] text-muted-foreground/50 italic">
                                Sin citas para hoy
                            </div>
                        ) : (
                            todayQueue.map((item) => (
                                <SidebarMenuItem key={item.id}>
                                    <SidebarMenuButton 
                                        onClick={() => handleOpenPatient(item.patient_id, item.patient_name)}
                                        isActive={pathname.includes(item.patient_id)}
                                        className="h-9"
                                    >
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full shrink-0",
                                            item.status === 'arrived' ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
                                        )} />
                                        <span className="truncate flex-1">{item.patient_name}</span>
                                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                                    </SidebarMenuButton>
                                    <SidebarMenuBadge className="text-[10px] tabular-nums opacity-60">
                                        {new Date(item.start_time).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </SidebarMenuBadge>
                                </SidebarMenuItem>
                            ))
                        )}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            {/* ── SECCIÓN: ABIERTOS RECIENTEMENTE ── */}
            {openedTabs.length > 0 && (
                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center justify-between">
                        <span>Abiertos</span>
                        <History className="w-3 h-3 opacity-50" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {openedTabs.map((tab) => (
                                <SidebarMenuItem key={tab.id}>
                                    <SidebarMenuButton 
                                        onClick={() => handleOpenPatient(tab.id, tab.name)}
                                        isActive={pathname.includes(tab.id)}
                                    >
                                        <Users className="w-4 h-4 opacity-40" />
                                        <span className="truncate flex-1">{tab.name}</span>
                                        {tab.isDirty && (
                                            <Circle className="w-1.5 h-1.5 fill-amber-500 text-amber-500 shrink-0" />
                                        )}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            )}
        </div>
    );
}
