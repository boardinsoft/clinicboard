'use client';

import React from 'react';
import { User, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarInput,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Patient } from '@/types/database.types';

interface PatientIdentifier { value?: string }


interface PatientsSidebarProps {
    patients: Patient[];
    loading: boolean;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    searchQuery: string;
    onSearchChange: (val: string) => void;
}

export default function PatientsSidebar({
    patients,
    loading,
    selectedId,
    onSelect,
    onNew,
    searchQuery,
    onSearchChange
}: PatientsSidebarProps) {
    return (
        <div className="flex flex-col h-full bg-sidebar/50">
            <div className="px-4 py-3 flex items-center justify-between border-b bg-sidebar">
                <h3 className="text-xs font-semibold text-muted-foreground">
                    Pacientes
                </h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={onNew}
                    title="Registrar paciente"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            <div className="p-3 bg-sidebar/30">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground opacity-50" />
                    <SidebarInput
                        placeholder="Filtrar por nombre..."
                        className="pl-8 h-8 text-xs bg-sidebar-accent/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <SidebarGroup className="p-2 pt-0">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <SidebarMenuItem key={i} className="px-2 py-2">
                                        <div className="flex items-center gap-3 w-full">
                                            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                            <div className="space-y-1.5 flex-1">
                                                <Skeleton className="h-3 w-3/4" />
                                                <Skeleton className="h-2 w-1/2" />
                                            </div>
                                        </div>
                                    </SidebarMenuItem>
                                ))
                            ) : patients.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground opacity-60">
                                    <p className="text-xs">No se encontraron pacientes</p>
                                </div>
                            ) : (
                                patients.map((patient) => {
                                    const isActive = selectedId === patient.id;
                                    const fullName = `${patient.name_family}, ${patient.name_given?.join(' ')}`;
                                    const docId = Array.isArray(patient.identifiers) ? (patient.identifiers as PatientIdentifier[])[0]?.value || 'Sin ID' : 'Sin ID';

                                    return (
                                        <SidebarMenuItem key={patient.id}>
                                            <SidebarMenuButton
                                                onClick={() => onSelect(patient.id)}
                                                isActive={isActive}
                                                className={cn(
                                                    "h-auto p-2.5 items-start gap-3 transition-all",
                                                    isActive
                                                        ? "bg-accent/80 shadow-sm border border-border/50"
                                                        : "hover:bg-accent/40"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                                                    isActive ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border/50"
                                                )}>
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                    <span className={cn(
                                                        "text-[13px] font-medium truncate",
                                                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                                    )}>
                                                        {fullName}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-muted-foreground/70 font-mono">
                                                            {docId}
                                                        </span>
                                                        {!patient.active && (
                                                            <Badge variant="outline" className="h-3.5 px-1 py-0 text-[8px] bg-muted/50 text-muted-foreground border-none">
                                                                Inactivo
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </div>
        </div>
    );
}
