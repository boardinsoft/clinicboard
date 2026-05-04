'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppointmentsStore } from '@/store/useAppointmentsStore';
import type { Appointment, AppointmentStatus } from '@/lib/fhir/types';
import { FHIR_STATUS_CONFIG, FHIR_STATUS_COLORS } from '@/lib/appointmentConstants';

interface FilterDropdownProps {
    appointments: Appointment[];
}

export default function FilterDropdown({ appointments }: FilterDropdownProps) {
    const [open, setOpen] = useState(false);

    const {
        statusFilter,
        patientSearch,
        toggleStatusFilter,
        setPatientSearch,
        clearAllFilters,
    } = useAppointmentsStore();

    const hasFilters = statusFilter.length > 0 || patientSearch.length > 0;

    const statusCounts = useMemo(() => {
        const counts: Record<AppointmentStatus, number> = {} as Record<AppointmentStatus, number>;
        appointments.forEach(apt => {
            if (apt.status) {
                counts[apt.status] = (counts[apt.status] || 0) + 1;
            }
        });
        return counts;
    }, [appointments]);

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
                        hasFilters && "border-b-8/30 bg-b-8/5 text-n-11 font-medium"
                    )}
                >
                    <span>Filtros</span>
                    {hasFilters && (
                        <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-b-8 text-[10px] font-bold text-white">
                            {statusFilter.length}
                        </span>
                    )}
                    <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0" sideOffset={4}>
                <div className="flex flex-col">
                    {/* Patient Search - More prominent */}
                    <div className="px-4 py-3.5 border-b border-n-5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-n-8" />
                            <Input
                                placeholder="Buscar por nombre..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                className="h-9 pl-9 pr-8 text-sm bg-n-2 border-n-5 text-n-11 placeholder:text-n-8 focus:outline-none"
                            />
                            {patientSearch && (
                                <button
                                    onClick={() => setPatientSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-n-8 hover:text-n-11"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Filters - Improved hierarchy */}
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-n-8 uppercase tracking-wide">
                                Estados
                            </span>
                            {hasFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[11px] text-b-8 hover:text-b-8 hover:bg-b-8/10 -mr-2"
                                    onClick={handleClearFilters}
                                >
                                    Limpiar
                                </Button>
                            )}
                        </div>
                        <div className="space-y-1">
                            {(Object.keys(FHIR_STATUS_CONFIG) as AppointmentStatus[]).map((status) => {
                                const config = FHIR_STATUS_CONFIG[status];
                                const isChecked = statusFilter.includes(status);
                                const count = statusCounts[status] || 0;

                                return (
                                    <label
                                        key={status}
                                        className={cn(
                                            "flex items-center gap-3 py-2 px-2 rounded-md cursor-pointer transition-colors group",
                                            isChecked ? "bg-b-8/5" : "hover:bg-n-2"
                                        )}
                                    >
                                        <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={() => handleStatusToggle(status)}
                                            className="border-n-5 data-[state=checked]:bg-b-8 data-[state=checked]:border-b-8"
                                        />
                                        <div className={cn("w-2 h-2 rounded-full", FHIR_STATUS_COLORS[status])} />
                                        <span className={cn(
                                            "flex-1 text-sm transition-colors",
                                            isChecked ? "text-n-12 font-medium" : "text-n-11 group-hover:text-foreground"
                                        )}>
                                            {config.label}
                                        </span>
                                        <span className={cn(
                                            "text-xs font-mono tabular-nums",
                                            isChecked ? "text-b-8 font-semibold" : "text-n-8"
                                        )}>
                                            {count > 0 ? `(${count})` : ''}
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