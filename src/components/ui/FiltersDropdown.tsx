'use client';

import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FiltersDropdownProps {
    activeCount: number;
    triggerLabel?: string;
    align?: 'start' | 'center' | 'end';
    side?: 'top' | 'bottom' | 'left' | 'right';
    children: React.ReactNode;
    className?: string;
}

export function FiltersDropdown({
    activeCount,
    triggerLabel = 'Filtros',
    align = 'end',
    side = 'bottom',
    children,
    className,
}: FiltersDropdownProps) {
    const isActive = activeCount > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        'h-8 gap-2 border-dashed font-medium px-3 transition-all',
                        isActive
                            ? 'bg-b-2 border-b-8/30 text-b-8 hover:text-b-9 hover:bg-b-3'
                            : 'border-border/60 text-n-11 hover:bg-n-3',
                        className
                    )}
                >
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>{triggerLabel}</span>
                    {isActive && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-b-8 text-white text-[10px] font-bold leading-none">
                            {activeCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={align}
                side={side}
                className="w-72 p-0"
                sideOffset={4}
            >
                {children}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

interface FilterSectionProps {
    label: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

export function FilterSection({ label, children, actions }: FilterSectionProps) {
    return (
        <div className="p-3">
            {label && (
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider font-bold text-n-8 px-0 pb-2">
                    {label}
                </DropdownMenuLabel>
            )}
            {children}
            {actions && (
                <div className="mt-2 pt-2 border-t border-border/40">
                    {actions}
                </div>
            )}
        </div>
    );
}

interface FilterDateRangeProps {
    dateFrom: string;
    dateTo: string;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onClear: () => void;
    fromLabel?: string;
    toLabel?: string;
}

export function FilterDateRange({
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    onClear,
    fromLabel = 'Desde',
    toLabel = 'Hasta',
}: FilterDateRangeProps) {
    const hasRange = dateFrom !== '' || dateTo !== '';

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider font-medium text-n-8 block mb-1">
                        {fromLabel}
                    </label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => onDateFromChange(e.target.value)}
                        className="w-full h-8 px-2.5 bg-n-2 border border-n-5 rounded-[5px] text-[12px] text-n-11 outline-none hover:border-n-6 focus:border-b-8 transition-all [color-scheme:light]"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider font-medium text-n-8 block mb-1">
                        {toLabel}
                    </label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => onDateToChange(e.target.value)}
                        className="w-full h-8 px-2.5 bg-n-2 border border-n-5 rounded-[5px] text-[12px] text-n-11 outline-none hover:border-n-6 focus:border-b-8 transition-all [color-scheme:light]"
                    />
                </div>
            </div>
            {hasRange && (
                <button
                    onClick={onClear}
                    className="flex items-center gap-1 text-[11px] text-b-8 hover:text-b-9 font-medium transition-colors"
                >
                    <X className="h-3 w-3" />
                    Limpiar rango
                </button>
            )}
        </div>
    );
}

interface FilterClearAllProps {
    onClear: () => void;
}

export function FilterClearAll({ onClear }: FilterClearAllProps) {
    return (
        <button
            onClick={onClear}
            className="w-full flex items-center justify-center gap-2 py-2 text-[12px] text-b-8 hover:text-b-9 hover:bg-b-1 rounded-md transition-colors font-medium"
        >
            <X className="h-3 w-3" />
            Limpiar todos los filtros
        </button>
    );
}
