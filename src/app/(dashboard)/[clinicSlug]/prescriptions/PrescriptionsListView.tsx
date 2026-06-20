'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    X,
    RefreshCw,
    FileText,
    CheckCircle,
    Clock,
    Ban,
    ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageLayout';
import { toast } from 'sonner';
import { getPrescriptionsForTable } from '@/actions/prescriptions';
import type { PrescriptionFilters } from '@/actions/prescriptions';
import type { PrescriptionForPreview } from '@/types/database.types';
import type { MedicationRequestStatus } from '@/lib/fhir/types';
import PrescriptionTable from '@/components/ui/PrescriptionTable';

const STATUS_TABS: { value: MedicationRequestStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'draft', label: 'Borradores' },
    { value: 'on-hold', label: 'Pausadas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'cancelled', label: 'Canceladas' },
];

function getClinicSlug(pathname: string): string {
    const parts = pathname.split('/').filter(Boolean);
    return parts[0] || '';
}

function isExpiringSoon(validUntil: string | null): boolean {
    if (!validUntil) return false;
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const expiry = new Date(validUntil).getTime();
    const now = Date.now();
    return expiry >= now && expiry - now <= threeDays;
}

function isExpired(validUntil: string | null): boolean {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
}

export default function PrescriptionsListView() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const clinicSlug = getClinicSlug(pathname);

    const [prescriptions, setPrescriptions] = useState<PrescriptionForPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<MedicationRequestStatus | 'all'>(
        (searchParams.get('status') as MedicationRequestStatus | 'all') || 'all'
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const pageSize = 20;

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const fetchPrescriptions = useCallback(async (filters: PrescriptionFilters, loadingKey: 'initial' | 'refresh' = 'initial') => {
        if (loadingKey === 'initial') setIsLoading(true);
        else setIsRefreshing(true);

        const result = await getPrescriptionsForTable(undefined, filters);

        if (loadingKey === 'initial') setIsLoading(false);
        else setIsRefreshing(false);

        if (result.error) {
            toast.error('Error al cargar recetas', { description: result.error });
            return;
        }

        setPrescriptions((result.data || []) as PrescriptionForPreview[]);
        setTotal(result.count ?? 0);
    }, []);

    const applyFilters = useCallback((search: string, status: MedicationRequestStatus | 'all', page: number) => {
        fetchPrescriptions({
            search: search || undefined,
            status: status === 'all' ? 'all' : status,
            page,
            pageSize,
        }, 'refresh');
    }, [fetchPrescriptions]);

    useEffect(() => {
        const q = searchParams.get('q') || '';
        const status = (searchParams.get('status') as MedicationRequestStatus | 'all') || 'all';
        const page = parseInt(searchParams.get('page') || '1');
        setQuery(q);
        setActiveTab(status);
        setCurrentPage(page);
        fetchPrescriptions({
            search: q || undefined,
            status: status === 'all' ? 'all' : status,
            page,
            pageSize,
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearchChange = (value: string) => {
        setQuery(value);
        setCurrentPage(1);
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set('q', value);
        } else {
            params.delete('q');
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
        applyFilters(value, activeTab, 1);
    };

    const handleTabChange = (tab: MedicationRequestStatus | 'all') => {
        setActiveTab(tab);
        setCurrentPage(1);
        const params = new URLSearchParams(searchParams.toString());
        params.set('status', tab);
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
        applyFilters(query, tab, 1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(newPage));
        router.push(`${pathname}?${params.toString()}`);
        applyFilters(query, activeTab, newPage);
    };

    const handleRefresh = () => {
        applyFilters(query, activeTab, currentPage);
    };

    const expiredCount = prescriptions.filter(r => isExpired(r.valid_until)).length;
    const expiringSoonCount = prescriptions.filter(r => isExpiringSoon(r.valid_until)).length;
    const filteredTotal = prescriptions.length;

    return (
        <div className="flex flex-col h-full bg-background">
            <PageHeader
                title="Recetas"
                description="Historial completo de recetas médicas registradas en el sistema."
                actions={
                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center h-9 px-3 bg-n-2 border border-n-5 rounded-[6px] w-72">
                            <Search className="w-4 h-4 shrink-0 text-n-8" strokeWidth={1.8} />
                            <input
                                type="text"
                                placeholder="Buscar por paciente o medicamento..."
                                value={query}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="flex-1 bg-transparent text-[13px] text-n-11 placeholder:text-n-8 outline-none min-w-0 h-9"
                            />
                            {query && (
                                <button
                                    onClick={() => handleSearchChange('')}
                                    className="p-0.5 hover:bg-n-5 rounded transition-colors shrink-0"
                                >
                                    <X className="w-3 h-3 text-n-8" />
                                </button>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-n-5 text-n-12 hover:bg-n-3 transition-colors"
                            onClick={handleRefresh}
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                }
            >
                {activeTab === 'all' && (
                    <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-n-2 border border-n-4 text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-n-8" />
                            <span className="text-n-8 font-medium">Total</span>
                            <span className="font-bold text-n-12 tabular-nums">{total}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-s-success-bg border border-s-success-br text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5 text-s-success" />
                            <span className="text-s-success font-medium">Activas</span>
                            <span className="font-bold text-s-success tabular-nums">{prescriptions.filter(r => r.status === 'active').length}</span>
                        </div>
                        {expiredCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-s-danger-bg border border-s-danger-br text-[11px]">
                                <Ban className="w-3.5 h-3.5 text-s-danger" />
                                <span className="text-s-danger font-medium">Vencidas</span>
                                <span className="font-bold text-s-danger tabular-nums">{expiredCount}</span>
                            </div>
                        )}
                        {expiringSoonCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-s-warning-bg border border-s-warning-br text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-s-warning" />
                                <span className="text-s-warning font-medium">Por vencer</span>
                                <span className="font-bold text-s-warning tabular-nums">{expiringSoonCount}</span>
                            </div>
                        )}
                        <div className="h-4 w-px bg-n-5/50 mx-1" />
                        <div className="flex items-center gap-2 border-b border-transparent">
                            {STATUS_TABS.map((tab) => {
                                const count = prescriptions.filter(r => {
                                    if (tab.value === 'all') return true;
                                    return r.status === tab.value;
                                }).length;
                                const isActive = activeTab === tab.value;
                                return (
                                    <button
                                        key={tab.value}
                                        onClick={() => handleTabChange(tab.value)}
                                        className={`relative px-3 py-1.5 text-[12px] font-medium transition-colors ${
                                            isActive
                                                ? 'text-b-8'
                                                : 'text-n-8 hover:text-n-12'
                                        }`}
                                    >
                                        {tab.label}
                                        {count > 0 && (
                                            <span className={`ml-1 tabular-nums ${isActive ? 'text-b-8' : 'text-n-6'}`}>
                                                ({count})
                                            </span>
                                        )}
                                        {isActive && (
                                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-b-8 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab !== 'all' && (
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2 border-b border-transparent">
                            {STATUS_TABS.map((tab) => {
                                const count = prescriptions.filter(r => {
                                    if (tab.value === 'all') return true;
                                    return r.status === tab.value;
                                }).length;
                                const isActive = activeTab === tab.value;
                                return (
                                    <button
                                        key={tab.value}
                                        onClick={() => handleTabChange(tab.value)}
                                        className={`relative px-3 py-1.5 text-[12px] font-medium transition-colors ${
                                            isActive
                                                ? 'text-b-8'
                                                : 'text-n-8 hover:text-n-12'
                                        }`}
                                    >
                                        {tab.label}
                                        {count > 0 && (
                                            <span className={`ml-1 tabular-nums ${isActive ? 'text-b-8' : 'text-n-6'}`}>
                                                ({count})
                                            </span>
                                        )}
                                        {isActive && (
                                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-b-8 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <span className="text-[11px] text-n-8">
                            {filteredTotal === 0 ? 'Sin resultados' : `${filteredTotal} ${filteredTotal === 1 ? 'receta' : 'recetas'}`}
                        </span>
                    </div>
                )}
            </PageHeader>

            <div className="flex-1 overflow-hidden flex flex-col">
                <PrescriptionTable
                    prescriptions={prescriptions}
                    isLoading={isLoading}
                    clinicSlug={clinicSlug}
                />
            </div>

            <div className="flex items-center justify-between px-6 py-2.5 h-11 border-t border-border bg-background shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                        Total: <span className="text-foreground">{total}</span> recetas
                    </span>
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
                            disabled={currentPage <= 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-background shadow-xs hover:bg-muted transition-all border-border"
                            disabled={currentPage >= totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
