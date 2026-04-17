'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search, ListFilter, X, ArrowUpDown, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

const STATUS_OPTIONS = [
    { value: 'all',         label: 'Todos los estados' },
    { value: 'in-progress', label: 'En curso' },
    { value: 'finished',    label: 'Finalizadas' },
    { value: 'planned',     label: 'Planificadas' },
    { value: 'cancelled',   label: 'Canceladas' },
];

export default function EncounterFiltersBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const currentSearch = searchParams.get('q') || '';
    const currentStatus = searchParams.get('status') || 'all';

    const updateFilter = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    }, [router, pathname, searchParams]);

    const handleClearFilters = () => {
        const params = new URLSearchParams();
        startTransition(() => {
            router.push(pathname);
        });
    };

    const hasFilters = currentSearch !== '' || currentStatus !== 'all';

    return (
        <div className="flex items-center justify-between w-full h-12 bg-background shrink-0 gap-4">
            
            {/* ── Lado Izquierdo: Búsqueda e Indicador de Filtros ── */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative w-full max-w-xs group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-foreground transition-colors" />
                    <Input
                        placeholder="Buscar paciente o motivo..."
                        defaultValue={currentSearch}
                        onChange={(e) => updateFilter('q', e.target.value)}
                        className="h-8 pl-8 pr-8 bg-muted/20 border-border/10 focus-visible:bg-background transition-all text-xs"
                    />
                    {currentSearch && (
                        <button 
                            onClick={() => updateFilter('q', '')}
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
                                size="sm" 
                                className={cn(
                                    "h-8 gap-2 border-dashed border-border/60 font-medium px-3",
                                    currentStatus !== 'all' && "bg-primary/5 border-primary/30 text-primary hover:text-primary hover:bg-primary/10"
                                )}
                            >
                                <ListFilter className="h-3 w-3" />
                                <span>Estado</span>
                                {currentStatus !== 'all' && (
                                    <>
                                        <div className="w-px h-3 bg-border/40 mx-0.5" />
                                        <span className="font-bold">
                                            {STATUS_OPTIONS.find(o => o.value === currentStatus)?.label}
                                        </span>
                                    </>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">Filtrar por estado</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={currentStatus} onValueChange={(v) => updateFilter('status', v)}>
                                {STATUS_OPTIONS.map(opt => (
                                    <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                                        {opt.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {hasFilters && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleClearFilters}
                            className="h-8 px-2 text-muted-foreground hover:text-foreground font-medium gap-1"
                        >
                            <X className="h-3 w-3" />
                            <span>Limpiar</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Lado Derecho: Acciones ── */}
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2 font-medium px-3 border-border/40"
                >
                    <ArrowUpDown className="h-3 w-3" />
                    <span>Ordenar</span>
                </Button>

                <div className="w-px h-4 bg-border/40 mx-1" />

                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2 font-medium px-3 border-border/40"
                >
                    <Download className="h-3 w-3" />
                    <span>Exportar</span>
                </Button>
            </div>
        </div>
    );
}
