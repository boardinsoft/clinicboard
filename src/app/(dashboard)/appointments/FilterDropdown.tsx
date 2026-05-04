'use client';

import React, { useState, useCallback } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppointmentsStore, selectFilteredCount } from '@/store/useAppointmentsStore';
import type { AppointmentStatus } from '@/lib/fhir/types';

const FHIR_STATUS_CONFIG: Record<AppointmentStatus, { label: string; colorClass: string }> = {
    proposed: { label: 'Propuesta', colorClass: 'bg-n-5' },
    pending: { label: 'Pendiente', colorClass: 'bg-warning' },
    booked: { label: 'Confirmada', colorClass: 'bg-info' },
    arrived: { label: 'En Consulta', colorClass: 'bg-warning' },
    fulfilled: { label: 'Completada', colorClass: 'bg-success' },
    cancelled: { label: 'Cancelada', colorClass: 'bg-destructive' },
    noshow: { label: 'No asistió', colorClass: 'bg-n-8' },
};

export default function FilterDropdown() {
    const [open, setOpen] = useState(false);

    const {
        statusFilter,
        patientSearch,
        toggleStatusFilter,
        setPatientSearch,
        clearAllFilters,
    } = useAppointmentsStore();

    const filteredCount = useAppointmentsStore(selectFilteredCount);
    const hasFilters = statusFilter.length > 0 || patientSearch.length > 0;

    const handleStatusToggle = useCallback((status: AppointmentStatus) => {
        toggleStatusFilter(status);
    }, [toggleStatusFilter]);

    const handleClearFilters = useCallback(() => {
        clearAllFilters();
    }, [clearAllFilters]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5 border-n-5 text-n-8 hover:text-n-11 transition-colors",
                        hasFilters && "border-b-8/30 bg-b-8/5"
                    )}
                >
                    <span>Filtros</span>
                    {hasFilters && (
                        <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-b-8 text-[10px] font-bold text-white">
                            {filteredCount}
                        </span>
                    )}
                    <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0" sideOffset={4}>
                <div className="flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-n-5">
                        <span className="text-sm font-semibold text-n-11">Filtrar citas</span>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-n-8 hover:text-n-11"
                                onClick={handleClearFilters}
                            >
                                Limpiar
                            </Button>
                        )}
                    </div>

                    {/* Patient Search */}
                    <div className="px-4 py-3 border-b border-n-5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-n-8" />
                            <Input
                                placeholder="Buscar paciente..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                className="h-8 pl-9 pr-3 text-sm bg-n-2 border-n-5 focus-visible:ring-b-8/10"
                            />
                            {patientSearch && (
                                <button
                                    onClick={() => setPatientSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-n-8 hover:text-n-11"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Filters */}
                    <div className="px-4 py-3">
                        <span className="text-xs font-medium text-n-8 uppercase tracking-wide mb-2 block">
                            Estados
                        </span>
                        <div className="space-y-1.5">
                            {(Object.keys(FHIR_STATUS_CONFIG) as AppointmentStatus[]).map((status) => {
                                const config = FHIR_STATUS_CONFIG[status];
                                const isChecked = statusFilter.includes(status);

                                return (
                                    <label
                                        key={status}
                                        className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-n-2 cursor-pointer transition-colors group"
                                    >
                                        <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={() => handleStatusToggle(status)}
                                            className="border-n-5 data-[state=checked]:bg-b-8 data-[state=checked]:border-b-8"
                                        />
                                        <div className={cn("w-2 h-2 rounded-full", config.colorClass)} />
                                        <span className="text-sm text-n-11 group-hover:text-foreground transition-colors">
                                            {config.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}