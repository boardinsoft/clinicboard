'use client';

import React from 'react';
import { Search, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarInput } from '@/components/ui/sidebar';
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
    onSearchChange,
}: PatientsSidebarProps) {
    const active = patients.filter(p => p.active !== false);
    const inactive = patients.filter(p => p.active === false);

    return (
        <div className="flex flex-col h-full bg-sidebar">

            {/* ── Bloque 1: Header de sección ── */}
            <div className="flex items-center justify-between h-12 px-6 border-b border-border shrink-0">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Pacientes
                </span>
                <button
                    onClick={onNew}
                    title="Registrar paciente"
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* ── Bloque 2: Búsqueda ── */}
            <div className="px-6 py-3 border-b border-border shrink-0">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                    <SidebarInput
                        placeholder="Filtrar pacientes..."
                        className="pl-7 h-7 text-xs bg-sidebar-accent/40 border border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 rounded"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Bloque 3: Lista ── */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <LoadingSkeleton />
                ) : patients.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* Activos */}
                        {active.length > 0 && (
                            <section>
                                <SectionLabel label="Activos" count={active.length} />
                                {active.map(p => (
                                    <PatientRow
                                        key={p.id}
                                        patient={p}
                                        isSelected={selectedId === p.id}
                                        onSelect={onSelect}
                                    />
                                ))}
                            </section>
                        )}

                        {/* Inactivos */}
                        {inactive.length > 0 && (
                            <section>
                                <SectionLabel label="Inactivos" count={inactive.length} />
                                {inactive.map(p => (
                                    <PatientRow
                                        key={p.id}
                                        patient={p}
                                        isSelected={selectedId === p.id}
                                        onSelect={onSelect}
                                    />
                                ))}
                            </section>
                        )}
                    </>
                )}
            </div>

            {/* ── Bloque 4: Footer con conteo total ── */}
            <div className="px-6 py-3 border-t border-border shrink-0">
                <span className="text-[11px] text-muted-foreground/60">
                    {patients.length} paciente{patients.length !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
}

// ─── Sub-componentes ───────────────────────────────────────────────────────────

function SectionLabel({ label, count }: { label: string; count: number }) {
    return (
        <div className="flex items-center justify-between px-6 py-2 border-b border-border bg-sidebar-accent/20">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {label}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/50">{count}</span>
        </div>
    );
}

function PatientRow({
    patient,
    isSelected,
    onSelect,
}: {
    patient: Patient;
    isSelected: boolean;
    onSelect: (id: string) => void;
}) {
    const fullName = `${patient.name_family}, ${patient.name_given?.join(' ')}`;
    const docId = Array.isArray(patient.identifiers)
        ? (patient.identifiers as PatientIdentifier[])[0]?.value ?? '—'
        : '—';

    return (
        <button
            onClick={() => onSelect(patient.id)}
            className={cn(
                'relative w-full flex items-center gap-3 px-6 py-2 border-b border-border/60',
                'text-left transition-colors duration-100',
                isSelected
                    ? 'bg-sidebar-accent text-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
            )}
        >
            {/* Indicador activo — barra izquierda */}
            {isSelected && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-primary rounded-r-full" />
            )}

            {/* Ícono */}
            <div className={cn(
                'flex h-6 w-6 items-center justify-center rounded shrink-0',
                isSelected
                    ? 'bg-primary/15 text-primary'
                    : 'bg-sidebar-accent/60 text-muted-foreground/60'
            )}>
                <User className="w-3.5 h-3.5" />
            </div>

            {/* Texto */}
            <div className="min-w-0 flex-1">
                <p className={cn(
                    'text-[12px] font-medium truncate leading-tight',
                    isSelected ? 'text-foreground' : 'text-sidebar-foreground/80'
                )}>
                    {fullName}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">
                    {docId}
                </p>
            </div>
        </button>
    );
}

function LoadingSkeleton() {
    return (
        <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-1 py-2">
                    <Skeleton className="h-6 w-6 rounded shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-2.5 w-3/4" />
                        <Skeleton className="h-2 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-8 w-8 rounded border border-border flex items-center justify-center mb-3 text-muted-foreground/30">
                <User className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground/50">Sin pacientes</p>
        </div>
    );
}
