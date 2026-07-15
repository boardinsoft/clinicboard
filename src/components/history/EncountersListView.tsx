'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname, useParams } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    X,
    RefreshCw,
    Loader2,
    Calendar,
    Clock,
    User2,
    Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    FiltersDropdown,
    FilterSection,
    FilterDateRange,
    FilterClearAll,
} from '@/components/ui/FiltersDropdown';
import { notify } from '@/lib/notify';
import { getEncountersFiltered } from '@/actions/encounters';
import type { EncounterForPreview } from '@/types/database.types';
import type { EncounterFilters } from '@/actions/encounters';
import HistoryTable from '@/components/ui/HistoryTable';
import NewWalkInEncounterDialog from '@/components/history/NewWalkInEncounterDialog';

const STATUS_TABS: { value: string; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'in-progress', label: 'En curso' },
    { value: 'finished', label: 'Finalizadas' },
    { value: 'planned', label: 'Planificadas' },
    { value: 'cancelled', label: 'Canceladas' },
];
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 200;

export default function EncountersListView() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [encounters, setEncounters] = useState<EncounterForPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [total, setTotal] = useState(0);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
        all: 0,
        'in-progress': 0,
        finished: 0,
        planned: 0,
        cancelled: 0,
    });

    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
    const inputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dataRequestIdRef = useRef(0);
    const countsRequestIdRef = useRef(0);

    const params = useParams();
    const slug = (params.clinicSlug as string) || '';
    const [isWalkInDialogOpen, setIsWalkInDialogOpen] = useState(false);

    const status = searchParams.get('status') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const fetchEncounters = useCallback(async (
        search: string,
        filterStatus: string,
        currentPage: number,
        from: string,
        to: string,
        purpose: 'data' | 'counts' = 'data'
    ) => {
        const myId = purpose === 'data' ? ++dataRequestIdRef.current : ++countsRequestIdRef.current;
        const isLatest = () => purpose === 'data'
            ? myId === dataRequestIdRef.current
            : myId === countsRequestIdRef.current;
        const wasInitial = purpose === 'data' && isLoading && encounters.length === 0 && total === 0;
        if (wasInitial) setIsLoading(true);
        if (purpose === 'data') setIsFetching(true);

        try {
            const filters: EncounterFilters = {
                search: search || undefined,
                status: filterStatus === 'all' ? undefined : filterStatus,
                page: currentPage,
                pageSize: PAGE_SIZE,
                date_from: from || undefined,
                date_to: to || undefined,
            };

            const result = await getEncountersFiltered(filters);

            if (!isLatest()) return;

            if ('error' in result) {
                if (purpose === 'data') {
                    notify.error({ title: 'No se pudieron cargar las consultas', description: 'Revisa tu conexión e intenta de nuevo' });
                    setEncounters([]);
                    setTotal(0);
                }
                return;
            }

            if (purpose === 'data') {
                setEncounters((result.data || []) as EncounterForPreview[]);
                setTotal(result.count ?? 0);
            }

            if (filterStatus === 'all' && result.statusCounts) {
                setStatusCounts(result.statusCounts as Record<string, number>);
            } else if (filterStatus !== 'all') {
                setStatusCounts(prev => ({ ...prev, [filterStatus]: result.count ?? 0 }));
            }
        } finally {
            if (isLatest()) {
                if (wasInitial) setIsLoading(false);
                if (purpose === 'data') setIsFetching(false);
            }
        }
    }, [isLoading, encounters.length, total]);

    useEffect(() => {
        const q = searchParams.get('q') || '';
        setSearchInput(q);
        fetchEncounters(q, status, page, dateFrom, dateTo, 'data');
        if (status !== 'all') {
            fetchEncounters(q, 'all', 1, dateFrom, dateTo, 'counts');
        }
    }, [searchParams.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

    const updateUrl = (updates: Record<string, string | null>, resetPage = true) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === '') params.delete(key);
            else params.set(key, value);
        }
        if (resetPage && !('page' in updates)) params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (value.length === 0 || value.length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                updateUrl({ q: value || null });
            }, SEARCH_DEBOUNCE_MS);
        }
    };

    const handleStatusFilterChange = (newStatus: string) => {
        updateUrl({ status: newStatus === 'all' ? null : newStatus });
    };

    const handleDateFromChange = (value: string) => {
        updateUrl({ date_from: value || null });
    };

    const handleDateToChange = (value: string) => {
        updateUrl({ date_to: value || null });
    };

    const handleClearDates = () => {
        updateUrl({ date_from: null, date_to: null });
    };

    const handleClearSearch = () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        setSearchInput('');
        updateUrl({ q: null });
        inputRef.current?.focus();
    };

    const handleClearAllFilters = () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        setSearchInput('');
        router.replace(pathname);
    };

    const handlePageChange = (newPage: number) => {
        const clamped = Math.max(1, Math.min(totalPages, newPage));
        if (clamped < 1 || clamped > totalPages) return;
        updateUrl({ page: String(clamped) }, false);
    };

    const handleRefresh = () => {
        const q = searchParams.get('q') || '';
        fetchEncounters(q, status, page, dateFrom, dateTo, 'data');
        if (status !== 'all') {
            fetchEncounters(q, 'all', 1, dateFrom, dateTo, 'counts');
        }
    };

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, []);

    const query = searchParams.get('q') || '';
    const hasFilters = query !== '' || dateFrom !== '' || dateTo !== '' || status !== 'all';
    const activeFilterCount = (query !== '' ? 1 : 0) + (status !== 'all' ? 1 : 0) + (dateFrom !== '' ? 1 : 0) + (dateTo !== '' ? 1 : 0);
    const isPending = isLoading || (isFetching && encounters.length === 0);

    return (
        <div className="flex flex-col h-full bg-background">
            <PageHeader
                title="Todas las consultas"
                description="Historial completo de encuentros clínicos registrados en el sistema."
            />

            <div className="flex items-center gap-2 px-6 py-2.5 border-b border-border/40 bg-muted/30 shrink-0">
                <div className="flex items-center gap-2 h-8 px-3 min-w-[200px] bg-n-2 border border-n-5 rounded-[5px] text-[13px] text-n-9 hover:bg-n-3 hover:border-n-6 hover:text-n-11 outline-none transition-all">
                    {isFetching ? (
                        <Loader2 className="w-4 h-4 shrink-0 text-b-8 animate-spin" />
                    ) : (
                        <Search className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar paciente, motivo o nota…"
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="flex-1 bg-transparent text-[13px] text-n-11 placeholder:text-n-8 outline-none min-w-0 h-8"
                        aria-label="Buscar consultas"
                    />
                    {searchInput ? (
                        <button
                            onClick={handleClearSearch}
                            aria-label="Limpiar búsqueda"
                            className="p-0.5 hover:bg-n-5 rounded transition-colors shrink-0"
                        >
                            <X className="w-3 h-3 text-n-8" />
                        </button>
                    ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium mono bg-background border border-n-5 rounded-[3px] text-n-9 shrink-0">
                            ⌘K
                        </span>
                    )}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 border-n-5 text-n-12 hover:bg-n-3 transition-colors shrink-0"
                    onClick={handleRefresh}
                    disabled={isFetching}
                >
                    <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>

                <FiltersDropdown activeCount={activeFilterCount} align="center" side="top">
                    <FilterSection label="Estado">
                        <DropdownMenuRadioGroup
                            value={status}
                            onValueChange={handleStatusFilterChange}
                        >
                            {STATUS_TABS.map(opt => (
                                <DropdownMenuRadioItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-xs cursor-pointer"
                                >
                                    {opt.label}
                                    {opt.value !== 'all' && (statusCounts[opt.value] ?? 0) > 0 && (
                                        <span className="ml-auto mr-1 text-[10px] text-n-8">
                                            ({statusCounts[opt.value]})
                                        </span>
                                    )}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </FilterSection>

                    <DropdownMenuSeparator />

                    <FilterSection label="Rango de fechas">
                        <FilterDateRange
                            dateFrom={dateFrom}
                            dateTo={dateTo}
                            onDateFromChange={handleDateFromChange}
                            onDateToChange={handleDateToChange}
                            onClear={handleClearDates}
                            fromLabel="Desde"
                            toLabel="Hasta"
                        />
                    </FilterSection>

                    {activeFilterCount > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <div className="p-2">
                                <FilterClearAll onClear={handleClearAllFilters} />
                            </div>
                        </>
                    )}
                </FiltersDropdown>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 gap-1 text-b-8 hover:bg-b-1 shrink-0"
                    onClick={() => setIsWalkInDialogOpen(true)}
                >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">+ Consulta</span>
                </Button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col relative">
                {isPending ? (
                    <TableSkeleton />
                ) : (
                    <HistoryTable
                        encounters={encounters}
                    />
                )}
                {isFetching && encounters.length > 0 && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-b-8/20 overflow-hidden">
                        <div className="h-full bg-b-8 animate-pulse w-full" />
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between px-6 py-2.5 h-11 border-t border-border bg-background shrink-0">
                <div className="flex items-center gap-4">
                    {(hasFilters || status !== 'all') && (
                        <span className="text-[11px] text-muted-foreground font-medium">
                            {encounters.length === 0 ? 'Sin resultados' : `${encounters.length} ${encounters.length === 1 ? 'consulta' : 'consultas'}`}
                        </span>
                    )}
                    {hasFilters && (
                        <button
                            onClick={handleClearAllFilters}
                            className="text-[11px] text-b-8 hover:text-b-9 font-medium transition-colors"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
                    <div className="flex items-center gap-1 bg-muted border border-border rounded-md px-2 py-1 shadow-xs">
                        <span>Página <span className="text-foreground">{page}</span> de <span className="text-foreground">{totalPages}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-background shadow-xs hover:bg-muted transition-all border-border"
                            disabled={page <= 1 || isFetching}
                            onClick={() => handlePageChange(page - 1)}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-background shadow-xs hover:bg-muted transition-all border-border"
                            disabled={page >= totalPages || isFetching}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            <NewWalkInEncounterDialog
                open={isWalkInDialogOpen}
                onOpenChange={setIsWalkInDialogOpen}
                onSuccess={(encounterId) => router.push(`/${slug}/history?encounterId=${encounterId}`)}
            />
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="flex-1 overflow-auto no-scrollbar animate-in fade-in duration-150">
            <table className="table-clinic">
                <thead className="sticky top-0 z-30">
                    <tr>
                        <th>
                            <span className="text-[11px] uppercase tracking-wider font-medium text-n-8 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Fecha
                            </span>
                        </th>
                        <th>
                            <span className="text-[11px] uppercase tracking-wider font-medium text-n-8 flex items-center gap-1.5">
                                <User2 className="w-3 h-3" /> Paciente
                            </span>
                        </th>
                        <th className="hidden md:table-cell">
                            <span className="text-[11px] uppercase tracking-wider font-medium text-n-8 flex items-center gap-1.5">
                                <Stethoscope className="w-3 h-3" /> Tipo
                            </span>
                        </th>
                        <th><span className="text-[11px] uppercase tracking-wider font-medium text-n-8">Estado</span></th>
                        <th className="hidden md:table-cell"><span className="text-[11px] uppercase tracking-wider font-medium text-n-8">Origen</span></th>
                        <th className="hidden lg:table-cell"><span className="text-[11px] uppercase tracking-wider font-medium text-n-8">Motivo</span></th>
                        <th className="hidden lg:table-cell text-right">
                            <span className="text-[11px] uppercase tracking-wider font-medium text-n-8 flex items-center justify-end gap-1.5">
                                <Clock className="w-3 h-3" /> Duración
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/30 last:border-0">
                            <td><Skeleton className="h-3 w-20 rounded" /></td>
                            <td>
                                <Skeleton className="h-3 w-28 rounded mb-1" />
                                <Skeleton className="h-2 w-12 rounded" />
                            </td>
                            <td className="hidden md:table-cell"><Skeleton className="h-4 w-16 rounded" /></td>
                            <td><Skeleton className="h-5 w-20 rounded-full" /></td>
                            <td className="hidden md:table-cell"><Skeleton className="h-3 w-14 rounded" /></td>
                            <td className="hidden lg:table-cell"><Skeleton className="h-3 w-36 rounded" /></td>
                            <td className="hidden lg:table-cell text-right"><Skeleton className="h-3 w-12 rounded ml-auto" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
