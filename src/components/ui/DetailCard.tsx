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
                "group relative flex flex-col gap-1.5 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-300",
                active
                    ? "bg-accent border-primary/25 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] ring-1 ring-primary/5"
                    : "bg-card border-border/30 hover:bg-accent/30 hover:border-border/60 hover:shadow-sm"
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 pr-6">
                    {icon && <span className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")}>{icon}</span>}
                    <span className={cn(
                        "text-sm font-semibold truncate",
                        active ? "text-foreground" : "text-foreground/90"
                    )}>
                        {title}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {meta && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded shrink-0 uppercase tracking-tight">
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
                    "text-xs truncate",
                    icon ? "pl-7" : "pl-0",
                    active ? "text-foreground/70" : "text-muted-foreground"
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
                                "text-[9px] h-4 px-1.5 font-medium border-0 uppercase tracking-tighter",
                                active ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground"
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


