'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldRowProps {
    label: string;
    description?: string;
    value: React.ReactNode | null | undefined;
    mono?: boolean;
    className?: string;
    warning?: boolean;
}

export function FormFieldRow({
    label,
    description,
    value,
    mono = false,
    className,
    warning = false,
}: FormFieldRowProps) {
    if (!value) return null;

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-6 py-4 px-5',
                'border-b border-n-5/30 last:border-b-0',
                className
            )}
        >
            <div className="min-w-0 w-40 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-n-8 block leading-tight">
                    {label}
                </span>
                {description && (
                    <span className="text-[11px] text-n-7 mt-1 block leading-relaxed">
                        {description}
                    </span>
                )}
            </div>
            <span
                className={cn(
                    'text-base font-medium text-n-11 text-right break-words min-w-0 flex-1',
                    mono ? 'font-mono' : 'font-sans',
                    warning && 'text-s-warning'
                )}
            >
                {value}
            </span>
        </div>
    );
}
