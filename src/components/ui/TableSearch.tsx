'use client';

import React from 'react';
import {
    ListFilter,
    X,
    Download,
    ArrowUpDown,
    Columns,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
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
    className?: string;
}

export default function TableSearch({
    value,
    onChange,
    hasFilters,
    onNewRecord,
    placeholder = "Buscar...",
    filters,
    onFilterChange,
    className
}: TableSearchProps) {
    
    const handleClearFilters = () => {
        if (onFilterChange) {
            onFilterChange('status', 'all');
            onFilterChange('gender', 'all');
        }
        onChange('');
    };

    return (
        <div className={cn("flex items-center justify-between h-12 bg-muted/50 shrink-0 border-b border-border/40 gap-4", className)}>
            
            {/* ── Lado Izquierdo: Búsqueda e Indicador de Filtros ── */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative w-full max-w-xs group ml-4">
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="h-8 pr-8 bg-background border-border transition-all text-xs"
                    />
                    {value && (
                        <button 
                            onClick={() => onChange('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-sm hover:bg-muted text-muted-foreground/40 hover:text-foreground transition-all"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Filtro: Estado */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="xs" 
                                className={cn(
                                    "h-8 gap-2 border-dashed border-border/60 font-medium px-3 bg-background",
                                    filters?.status !== 'all' && "bg-primary/5 border-primary/30 text-primary hover:text-primary hover:bg-primary/10"
                                )}
                            >
                                <ListFilter className="h-3 w-3" />
                                <span>Estado</span>
                                {filters?.status !== 'all' && (
                                    <>
                                        <div className="w-px h-3 bg-border/40 mx-0.5" />
                                        <span className="font-bold">{filters?.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                                    </>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Filtrar por estado</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={filters?.status} onValueChange={(v) => onFilterChange?.('status', v)}>
                                <DropdownMenuRadioItem value="all" className="text-xs">Todos los estados</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="active" className="text-xs">Solo activos</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="inactive" className="text-xs">Solo inactivos</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Filtro: Género */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="xs" 
                                className={cn(
                                    "h-8 gap-2 border-dashed border-border/60 font-medium px-3 bg-background",
                                    filters?.gender !== 'all' && "bg-primary/5 border-primary/30 text-primary hover:text-primary hover:bg-primary/10"
                                )}
                            >
                                <span>Género</span>
                                {filters?.gender !== 'all' && (
                                    <>
                                        <div className="w-px h-3 bg-border/40 mx-0.5" />
                                        <span className="font-bold capitalize">{filters?.gender}</span>
                                    </>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Filtrar por género</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={filters?.gender} onValueChange={(v) => onFilterChange?.('gender', v)}>
                                <DropdownMenuRadioItem value="all" className="text-xs">Todos</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="male" className="text-xs">Masculino</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="female" className="text-xs">Femenino</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="other" className="text-xs">Otro</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {hasFilters && (
                        <Button 
                            variant="ghost" 
                            size="xs" 
                            onClick={handleClearFilters}
                            className="h-8 px-2 text-muted-foreground hover:text-foreground font-medium gap-1"
                        >
                            <X className="h-3 w-3" />
                            <span>Limpiar</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Lado Derecho: Acciones y Vista ── */}
            <div className="flex items-center gap-2 mr-4">
                <Button 
                    variant="outline" 
                    size="xs" 
                    className="h-8 gap-2 font-medium px-3 border-border/40 bg-background"
                >
                    <ArrowUpDown className="h-3 w-3" />
                    <span>Ordenar</span>
                </Button>

                <Button 
                    variant="outline" 
                    size="xs" 
                    className="h-8 gap-2 font-medium px-3 border-border/40 bg-background"
                >
                    <Columns className="h-3 w-3" />
                    <span>Columnas</span>
                </Button>

                <div className="w-px h-4 bg-border/40 mx-1" />

                <Button 
                    variant="outline" 
                    size="xs" 
                    className="h-8 gap-2 font-medium px-3 border-border/40 bg-background"
                >
                    <Download className="h-3 w-3" />
                    <span>Exportar</span>
                </Button>

                {onNewRecord && (
                    <Button 
                        variant="default" 
                        size="xs" 
                        onClick={onNewRecord}
                        className="h-8 gap-2 px-3"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Nuevo</span>
                    </Button>
                )}
            </div>
        </div>
    );
}
