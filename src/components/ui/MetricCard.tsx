'use client';

import * as React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number; size?: number }>;
  className?: string;
}

export function MetricCard({
  label,
  value,
  delta,
  deltaType = 'neutral',
  icon: Icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col p-5 bg-card border border-border/40 rounded-lg',
        'hover:border-primary/20 hover:shadow-md transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-n-8">{label}</span>
        {Icon && (
          <div className="p-2 bg-b-8/5 rounded-md">
            <Icon className="w-[18px] h-[18px] text-b-8/70" strokeWidth={1.8} size={18} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-semibold tracking-tight tabular-nums text-n-12 dark:text-n-12">
          {value}
        </span>
        {delta && delta !== '0' && (
          <div className="flex items-center text-xs">
            {deltaType === 'positive' ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-b-8 mr-1" strokeWidth={2} />
            ) : deltaType === 'negative' ? (
              <ArrowDownRight className="w-3.5 h-3.5 text-destructive mr-1" strokeWidth={2} />
            ) : null}
            <span
              className={cn(
                'font-medium',
                deltaType === 'positive' && 'text-b-8',
                deltaType === 'negative' && 'text-destructive',
                deltaType === 'neutral' && 'text-n-8'
              )}
            >
              {delta}
            </span>
            {deltaType !== 'neutral' && (
              <span className="text-n-8 ml-1">vs. semana anterior</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;