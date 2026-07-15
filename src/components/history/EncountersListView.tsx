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

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [activeTab, setActiveTab] = useState(
        searchParams.get('status') || 'all'
    );
    const [currentPage, setCurrentPage] = useState(
        parseInt(searchParams.get('page') || '1')
    );

    const requestIdRef = useRef(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const params = useParams();
    const slug = (params.clinicSlug as string) || '';
    const [isWalkInDialogOpen, setIsWalkInDialogOpen] = useState(false);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        if (query === '') {
            setDebouncedQuery('');
            return;
        }
        const t = setTimeout(() => setDebouncedQuery(query), 200);
        return () => clearTimeout(t);
    }, [query]);

    const fetchEncounters = useCallback(async (
        search: string,
        status: string,
        page: number,
        from?: string,
        to?: string,
        loadingKey: 'initial' | 'refresh' = 'refresh',
        purpose: 'data' | 'counts' = 'data'
    ) => {
        const myId = ++requestIdRef.current;

        if (loadingKey === 'initial') setIsLoading(true);
        setIsFetching(true);

        try {
            const filters: EncounterFilters = {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
                page,
                pageSize: PAGE_SIZE,
                date_from: from || undefined,
                date_to: to || undefined,
            };

            const result = await getEncountersFiltered(filters);

            if (myId !== requestIdRef.current) return;

            if ('error' in result) {
                notify.error({ title: 'No se pudieron cargar las consultas', description: 'Revisa tu conexión e intenta de nuevo' });
                setEncounters([]);
                setTotal(0);
                return;
            }

            if (purpose === 'data') {
                setEncounters((result.data || []) as EncounterForPreview[]);
                setTotal(result.count ?? 0);
            }

            if (status === 'all' && result.statusCounts) {
                setStatusCounts(result.statusCounts as Record<string, number>);
            } else if (status !== 'all') {
                setStatusCounts(prev => ({ ...prev, [status]: result.count ?? 0 }));
            }
        } finally {
            if (loadingKey === 'initial') setIsLoading(false);
            if (myId === requestIdRef.current) setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        const q = searchParams.get('q') || '';
        const status = searchParams.get('status') || 'all';
        const rawPage = parseInt(searchParams.get('page') || '1');
        const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
        setQuery(q);
        setDebouncedQuery(q);
        setActiveTab(status);
        setCurrentPage(page);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchEncounters(q, status, page, undefined, undefined, 'initial', 'data');
        if (status !== 'all') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchEncounters(q, 'all', 1, undefined, undefined, 'initial', 'counts');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const q = searchParams.get('q') || '';
        const status = searchParams.get('status') || 'all';
        const rawPage = parseInt(searchParams.get('page') || '1');
        const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
        const from = searchParams.get('date_from') || '';
        const to = searchParams.get('date_to') || '';
        if (q !== query || status !== activeTab || page !== currentPage || from !== dateFrom || to !== dateTo) {
            setQuery(q);
            setDebouncedQuery(q);
            setActiveTab(status);
            setCurrentPage(page);
            setDateFrom(from);
            setDateTo(to);
        }
    }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchEncounters(debouncedQuery, activeTab, currentPage, dateFrom || undefined, dateTo || undefined, 'refresh', 'data');
        if (activeTab !== 'all') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchEncounters(debouncedQuery, 'all', 1, dateFrom || undefined, dateTo || undefined, 'refresh', 'counts');
        }
    }, [debouncedQuery, activeTab, currentPage, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearchChange = (value: string) => {
        setQuery(value);
        setCurrentPage(1);
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set('q', value);
        else params.delete('q');
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleStatusFilterChange = (status: string) => {
        const newPage = 1;
        setActiveTab(status);
        setCurrentPage(newPage);
        const params = new URLSearchParams(searchParams.toString());
        if (status !== 'all') params.set('status', status);
        else params.delete('status');
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
        fetchEncounters(debouncedQuery, status, newPage, dateFrom || undefined, dateTo || undefined, 'refresh', 'data');
        if (status !== 'all') {
            fetchEncounters(debouncedQuery, 'all', 1, dateFrom || undefined, dateTo || undefined, 'refresh', 'counts');
        }
    };

    const handlePageChange = (newPage: number) => {
        const clamped = Math.max(1, Math.min(totalPages, newPage));
        if (clamped < 1 || clamped > totalPages) return;
        setCurrentPage(clamped);
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(clamped));
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleClearSearch = () => {
        setQuery('');
        setDebouncedQuery('');
        setCurrentPage(1);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('q');
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
        inputRef.current?.focus();
        fetchEncounters('', activeTab, 1, dateFrom || undefined, dateTo || undefined, 'refresh', 'data');
        if (activeTab !== 'all') {
            fetchEncounters('', 'all', 1, dateFrom || undefined, dateTo || undefined, 'refresh', 'counts');
        }
    };

    const handleDateFromChange = (value: string) => {
        const newPage = 1;
        setDateFrom(value);
        setCurrentPage(newPage);
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set('date_from', value);
        else params.delete('date_from');
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
        fetchEncounters(debouncedQuery, activeTab, newPage, value || undefined, dateTo || undefined, 'refresh', 'data');
        if (activeTab !== 'all') {
            fetchEncounters(debouncedQuery, 'all', 1, value || undefined, dateTo || undefined, 'refresh', 'counts');
        }
    };

    const handleDateToChange = (value: string) => {
        const newPage = 1;
        setDateTo(value);
        setCurrentPage(newPage);
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set('date_to', value);
        else params.delete('date_to');
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
        fetchEncounters(debouncedQuery, activeTab, newPage, dateFrom || undefined, value || undefined, 'refresh', 'data');
        if (activeTab !== 'all') {
            fetchEncounters(debouncedQuery, 'all', 1, dateFrom || undefined, value || undefined, 'refresh', 'counts');
        }
    };

    const handleClearDates = () => {
        const newPage = 1;
        setDateFrom('');
        setDateTo('');
        setCurrentPage(newPage);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('date_from');
        params.delete('date_to');
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
        fetchEncounters(debouncedQuery, activeTab, newPage, undefined, undefined, 'refresh', 'data');
        if (activeTab !== 'all') {
            fetchEncounters(debouncedQuery, 'all', 1, undefined, undefined, 'refresh', 'counts');
        }
    };

    const handleClearAllFilters = () => {
        setQuery('');
        setDebouncedQuery('');
        setActiveTab('all');
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
        router.replace(pathname);
        fetchEncounters('', 'all', 1, undefined, undefined, 'refresh', 'data');
    };

    const handleRefresh = () => {
        fetchEncounters(debouncedQuery, activeTab, currentPage, dateFrom || undefined, dateTo || undefined, 'refresh', 'data');
        if (activeTab !== 'all') {
            fetchEncounters(debouncedQuery, 'all', 1, dateFrom || undefined, dateTo || undefined, 'refresh', 'counts');
        }
    };

    const activeFilterCount =
        (query !== '' ? 1 : 0) +
        (activeTab !== 'all' ? 1 : 0) +
        (dateFrom !== '' ? 1 : 0) +
        (dateTo !== '' ? 1 : 0);

    const hasFilters = query !== '' || dateFrom !== '' || dateTo !== '' || activeTab !== 'all';

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
                        value={query}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="flex-1 bg-transparent text-[13px] text-n-11 placeholder:text-n-8 outline-none min-w-0 h-8"
                        aria-label="Buscar consultas"
                    />
                    {query ? (
                        <button
                            onClick={handleClearSearch}
                            aria-label="Limpiar búsqueda"
                            className="p-0.5 hover:bg-n-5 rounded transition-colors shrink-0"
                        >
                            <X className="w-3 h-3 text-n-8" />
                        </button>
                    ) : query.length > 0 && query.length < 2 ? (
                        <span className="text-[10px] text-n-8 shrink-0">2+ chars</span>
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
                            value={activeTab}
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
                    {(hasFilters || activeTab !== 'all') && (
                        <span className="text-[11px] text-muted-foreground font-medium">
                            {encounters.length === 0 ? 'Sin resultados' : `${encounters.length} ${encounters.length === 1 ? 'consulta' : 'consultas'}`}
                        </span>
                    )}
                    {hasFilters && (
                        <button
                            onClick={() => {
                                setQuery('');
                                setDebouncedQuery('');
                                setDateFrom('');
                                setDateTo('');
                                setActiveTab('all');
                                setCurrentPage(1);
                                router.replace(pathname);
                            }}
                            className="text-[11px] text-b-8 hover:text-b-9 font-medium transition-colors"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
                    <div className="flex items-center gap-1 bg-muted border border-border rounded-md px-2 py-1 shadow-xs">
                        <span>Página <span className="text-foreground">{currentPage}</span> de <span className="text-foreground">{totalPages}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-background shadow-xs hover:bg-muted transition-all border-border"
                            disabled={currentPage <= 1 || isFetching}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-background shadow-xs hover:bg-muted transition-all border-border"
                            disabled={currentPage >= totalPages || isFetching}
                            onClick={() => handlePageChange(currentPage + 1)}
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
