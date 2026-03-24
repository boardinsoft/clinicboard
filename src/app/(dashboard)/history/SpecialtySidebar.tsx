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
            <SidebarGroupLabel className="justify-between px-2 text-foreground font-semibold h-8">
                <div className="flex items-center gap-2">
                    <SpecialtyIcon specialty={specialty} />
                    <span>{specialty}</span>
                </div>
                <Badge variant="secondary" className="h-5 px-1.5 min-w-5 justify-center rounded-full text-[10px] font-bold">
                    {encounters.length}
                </Badge>
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton className="px-4 text-muted-foreground hover:text-foreground">
                                    <FileText className="w-4 h-4" />
                                    <span>Historial</span>
                                    <ChevronRight className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="pl-6 pr-2 space-y-0.5 mt-1 border-l ml-6">
                                    {encounters.map(enc => (
                                        <button
                                            key={enc.id}
                                            onClick={() => onSelectEncounter(enc.id, enc)}
                                            className={`w-full text-left p-2 rounded-md transition-colors text-xs flex flex-col gap-1 ${activeEncounterId === enc.id
                                                ? 'bg-accent font-medium text-accent-foreground shadow-sm'
                                                : 'hover:bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <span className={activeEncounterId === enc.id ? "text-primary-foreground" : ""}>{formatShortDate(enc.start_time)}</span>
                                                {enc.status === 'finished' ? (
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                ) : (
                                                    <Clock className="w-3 h-3 text-amber-500" />
                                                )}
                                            </div>
                                            <p className="line-clamp-1 opacity-70">
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
                                <SidebarMenuButton className="px-4 text-muted-foreground hover:text-foreground">
                                    <Folder className="w-4 h-4" />
                                    <span>Documentos</span>
                                    <ChevronRight className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="pl-10 pr-2 py-2 text-xs text-muted-foreground/60">
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
            <div className="flex flex-col items-center justify-center h-40 text-center p-6 text-muted-foreground">
                <Search className="w-10 h-10 opacity-20 mb-3" />
                <p className="text-xs">Selecciona un paciente para ver su historial</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-4 space-y-8">
                {[1, 2].map(i => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-5 w-32" />
                        <div className="space-y-2 pl-4 border-l ml-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-sidebar/50">
            <div className="px-4 py-3 flex items-center justify-between border-b bg-sidebar">
                <h3 className="text-xs font-semibold text-muted-foreground">
                    Atenciones
                </h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={onNewEncounter}
                    title="Nueva consulta"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
                {encounters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-60">
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
