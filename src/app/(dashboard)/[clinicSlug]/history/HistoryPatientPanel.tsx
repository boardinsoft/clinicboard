'use client';

import React from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HistoryPatientPanel() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const slug = (params.clinicSlug as string) || '';

    const isAllActive = pathname === `/${slug}/history/all`;

    return (
        <div className="flex flex-col h-full bg-n-2 border-r border-border/40 font-sans">

            {/* ── HEADER DEL MÓDULO (h-12) ── */}
            <div className="flex items-center h-12 px-4 border-b border-border/40 shrink-0">
                <span className="text-base font-semibold text-foreground tracking-tight">
                    Historia clínica
                </span>
            </div>

            {/* ── NAVEGACIÓN ── */}
            <div className="py-2">
                {/* Todas las consultas */}
                <button
                    onClick={() => router.push(`/${slug}/history/all`)}
                    className={cn(
                        "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors",
                        isAllActive
                            ? "text-b-8 bg-b-2/60"
                            : "text-foreground/80 hover:bg-n-3 hover:text-foreground"
                    )}
                >
                    <FileSearch className="w-4 h-4 text-n-8" strokeWidth={1.8} />
                    Todas las consultas
                </button>
            </div>
        </div>
    );
}
