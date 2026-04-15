'use client';

import React from 'react';
import { 
    Search, 
    ListFilter, 
    Plus, 
    X, 
    Download, 
    ArrowUpDown, 
    Columns 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TableSearchProps {
    value: string;
    onChange: (value: string) => void;
    hasFilters?: boolean;
    onNewRecord?: () => void;
    placeholder?: string;
    filters?: {
        status: string;
        gender: string;
    };
    onFilterChange?: (key: string, value: string) => void;
}

export default function TableSearch({
    value,
    onChange,
    hasFilters,
    onNewRecord,
    placeholder = "Buscar...",
    filters,
    onFilterChange
}: TableSearchProps) {
    // Helper para traducir valores de filtros
    const getStatusLabel = (status?: string) => {
        if (status === 'active') return 'Activo';
        if (status === 'inactive') return 'Inactivo';
        return 'Todos';
    };

    const getGenderLabel = (gender?: string) => {
        if (gender === 'male') return 'Masculino';
        if (gender === 'female') return 'Femenino';
        if (gender === 'other') return 'Otro';
        return 'Todos';
    };

    return (
        <div className="flex flex-col bg-background shrink-0 border-b border-border/40">
            {/* ── Fila Superior: Búsqueda ── */}
            <div className="flex items-center h-10 px-4">
                <div className="flex items-center gap-3 flex-1 h-full group">
                    <Search className="h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-foreground transition-colors" />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 h-full bg-transparent border-none outline-none text-xs placeholder:text-muted-foreground/40 text-foreground"
                    />
                    {value && (
                        <button 
                            onClick={() => onChange('')}
                            className="p-1 rounded-md text-muted-foreground/30 hover:text-foreground transition-all"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Fila Inferior: Filtros y Acciones ── */}
            <div className="flex items-center justify-between h-10 px-4 border-t border-border/20">
                {/* Lado Izquierdo: Filtros */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 pr-2 border-r border-border/30">
                        <ListFilter className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground/70">Filtros</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Filtro Estado */}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn(
                                "h-6 px-2 text-[11px] gap-1.5 rounded-full border border-dashed",
                                filters?.status !== 'all' 
                                    ? "bg-primary/5 border-primary/30 text-primary" 
                                    : "border-border/60 text-muted-foreground"
                            )}
                        >
                            <span>Estado:</span>
                            <span className="font-semibold">{getStatusLabel(filters?.status)}</span>
                        </Button>

                        {/* Filtro Género */}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn(
                                "h-6 px-2 text-[11px] gap-1.5 rounded-full border border-dashed",
                                filters?.gender !== 'all' 
                                    ? "bg-primary/5 border-primary/30 text-primary" 
                                    : "border-border/60 text-muted-foreground"
                            )}
                        >
                            <span>Género:</span>
                            <span className="font-semibold">{getGenderLabel(filters?.gender)}</span>
                        </Button>

                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (onFilterChange) {
                                        onFilterChange('status', 'all');
                                        onFilterChange('gender', 'all');
                                    }
                                    onChange('');
                                }}
                                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1"
                            >
                                <X className="h-3 w-3" />
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                </div>

                {/* Lado Derecho: Acciones secundarias */}
                <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-[11px] gap-1.5 font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <span>Ordenar</span>
                    </Button>

                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-[11px] gap-1.5 font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                        <Columns className="h-3.5 w-3.5" />
                        <span>Columnas</span>
                    </Button>

                    <div className="w-px h-3 bg-border/40 mx-1" />

                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-[11px] gap-1.5 font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Exportar</span>
                    </Button>

                    {onNewRecord && (
                        <Button
                            size="sm"
                            onClick={onNewRecord}
                            className="h-7 px-3 text-[11px] font-medium gap-1.5 shadow-none border-none ml-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Nuevo</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
