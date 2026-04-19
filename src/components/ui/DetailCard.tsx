'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DetailCardProps {
    title: string;
    subtitle?: string;
    meta?: string;
    extra?: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    icon?: React.ReactNode;
    tags?: string[];
    actions?: React.ReactNode;
}

export function DetailCard({ title, subtitle, meta, extra, active, onClick, icon, tags, actions }: DetailCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative flex flex-col gap-1.5 px-4 py-3 rounded-lg border cursor-pointer transition-all duration-200",
                active
                    ? "bg-neutral-2 border-brand-8/30"
                    : "bg-background border-border/40 hover:bg-neutral-2/50 hover:border-border/60"
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 pr-6">
                    {icon && <span className={cn("shrink-0", active ? "text-brand-8" : "text-neutral-8")}>{icon}</span>}
                    <span className={cn(
                        "text-sm font-semibold truncate tracking-tight",
                        active ? "text-foreground" : "text-foreground/90"
                    )}>
                        {title}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {meta && (
                        <span className="text-[10px] font-bold text-neutral-8 bg-neutral-2 px-1.5 py-0.5 rounded-sm shrink-0 uppercase tracking-widest border border-border/40">
                            {meta}
                        </span>
                    )}
                    {actions && (
                        <div
                            className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            {subtitle && (
                <p className={cn(
                    "text-xs truncate font-medium",
                    icon ? "pl-7" : "pl-0",
                    active ? "text-foreground/70" : "text-neutral-8"
                )}>
                    {subtitle}
                </p>
            )}

            {extra && (
                <div className={cn(
                    "mt-0.5",
                    icon ? "pl-7" : "pl-0"
                )}>
                    {extra}
                </div>
            )}

            {tags && tags.length > 0 && (
                <div className={cn(
                    "flex flex-wrap gap-1 mt-1.5",
                    icon ? "pl-7" : "pl-0"
                )}>
                    {tags.map((tag, i) => (
                        <Badge
                            key={i}
                            variant={active ? "default" : "outline"}
                            className={cn(
                                "text-[9px] h-4.5 px-1.5 font-bold border-0 uppercase tracking-tighter",
                                active ? "bg-brand-8 text-white" : "bg-neutral-2 text-neutral-8"
                            )}
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
