'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Stethoscope,
    Plus,
    ChevronRight,
    MessageSquare,
    Folder,
    FileText,
    Clock,
    CheckCircle2,
    Search,
} from 'lucide-react';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

import type { EncounterWithSpecialty, Patient } from '@/types/database.types';

// ─── Types ─────────────────────────────────────────────────────────────────────


interface SpecialtySidebarProps {
    selectedPatient: Patient | null;
    encounters: EncounterWithSpecialty[];
    isLoading: boolean;
    activeEncounterId: string | null;
    onSelectEncounter: (id: string | null, enc: EncounterWithSpecialty | null) => void;
    onNewEncounter: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function getSpecialtyLabel(specialty: string | undefined | null): string {
    if (!specialty) return 'Medicina General';
    return specialty.trim();
}

const SPECIALTY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    'Cardiología': Stethoscope,
    'Medicina Interna': Stethoscope,
    'Medicina General': Stethoscope,
    'Neurología': Stethoscope,
    'Pediatría': Stethoscope,
    'Ginecología': Stethoscope,
    'Traumatología': Stethoscope,
    'Dermatología': Stethoscope,
};

function SpecialtyIcon({ specialty }: { specialty: string }) {
    const Icon = SPECIALTY_ICONS[specialty] ?? Stethoscope;
    return <Icon className="w-4 h-4" />;
}

// ─── SpecialtyGroup ─────────────────────────────────────────────────────────────

function SpecialtyGroup({
    specialty,
    encounters,
    activeEncounterId,
    onSelectEncounter,
    defaultOpen = true,
}: {
    specialty: string;
    encounters: EncounterWithSpecialty[];
    activeEncounterId: string | null;
    onSelectEncounter: (id: string | null, enc: EncounterWithSpecialty | null) => void;
    defaultOpen?: boolean;
}) {
    return (
        <SidebarGroup className="py-2">
            <SidebarGroupLabel className="justify-between px-4 py-2 text-foreground font-semibold h-9 text-sm">
                <div className="flex items-center gap-2">
                    <SpecialtyIcon specialty={specialty} />
                    <span>{specialty}</span>
                </div>
                <Badge variant="secondary" className="h-5 px-2 min-w-5 justify-center rounded-full text-[11px] font-bold">
                    {encounters.length}
                </Badge>
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton className="px-4 text-muted-foreground hover:text-foreground h-9">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-sm">Consultas</span>
                                    <ChevronRight className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="pl-4 pr-3 space-y-1 mt-1 ml-4 border-l border-border/60">
                                    {encounters.map(enc => (
                                        <button
                                            key={enc.id}
                                            onClick={() => onSelectEncounter(enc.id, enc)}
                                            className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm flex flex-col gap-1 ${activeEncounterId === enc.id
                                                ? 'bg-sidebar-accent font-medium text-foreground'
                                                : 'hover:bg-sidebar-accent/60 text-muted-foreground'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <span className="font-medium text-foreground">{formatShortDate(enc.start_time)}</span>
                                                {enc.status === 'finished' ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                ) : (
                                                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                )}
                                            </div>
                                            <p className="line-clamp-1 text-xs text-muted-foreground">
                                                {enc.evolution_note || 'Sin nota clínica'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>

                    <Collapsible className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton className="px-4 text-muted-foreground hover:text-foreground h-9">
                                    <Folder className="w-4 h-4" />
                                    <span className="text-sm">Documentos</span>
                                    <ChevronRight className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="pl-10 pr-4 py-2 text-sm text-muted-foreground/60">
                                    Sin documentos registrados
                                </div>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

// ─── Main Export ────────────────────────────────────────────────────────────────

export default function SpecialtySidebar({
    selectedPatient,
    encounters,
    isLoading,
    activeEncounterId,
    onSelectEncounter,
    onNewEncounter,
}: SpecialtySidebarProps) {
    const grouped = useMemo(() => {
        const map = new Map<string, EncounterWithSpecialty[]>();
        for (const enc of encounters) {
            const key = getSpecialtyLabel(enc.practitioner?.specialty);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(enc);
        }
        return Array.from(map.entries()).sort(([a], [b]) => {
            if (a === 'Medicina General') return 1;
            if (b === 'Medicina General') return -1;
            return a.localeCompare(b, 'es');
        });
    }, [encounters]);

    if (!selectedPatient) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 text-muted-foreground">
                <Search className="w-10 h-10 opacity-20 mb-4" />
                <p className="text-sm font-medium text-foreground mb-1">Sin paciente seleccionado</p>
                <p className="text-xs text-muted-foreground">Selecciona un paciente para ver su historial de consultas</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="px-6 py-5 space-y-6">
                {[1, 2].map(i => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <div className="space-y-2 pl-4 border-l ml-2">
                            <Skeleton className="h-9 w-full rounded-md" />
                            <Skeleton className="h-9 w-full rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-sidebar/50">
            <div className="px-4 py-3 border-b border-border shrink-0">
                <h2 className="text-sm font-semibold text-foreground">Historia clínica</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedPatient.name_given?.join(' ')} {selectedPatient.name_family}
                </p>
            </div>

            {/* Toolbar: nueva consulta */}
            <div className="flex items-center h-10 px-4 border-b border-border shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground ml-auto"
                    onClick={onNewEncounter}
                >
                    <Plus className="w-3.5 h-3.5" /> Nueva consulta
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pt-1">
                {encounters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground opacity-60">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs">Sin registros previos</p>
                    </div>
                ) : (
                    grouped.map(([specialty, encs], index) => (
                        <SpecialtyGroup
                            key={specialty}
                            specialty={specialty}
                            encounters={encs}
                            activeEncounterId={activeEncounterId}
                            onSelectEncounter={onSelectEncounter}
                            defaultOpen={index === 0}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
