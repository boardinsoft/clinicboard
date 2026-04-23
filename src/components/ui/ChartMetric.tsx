'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChartMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number | null | undefined;
  diffValue?: string | number | null | undefined;
  status?: 'positive' | 'negative' | 'warning' | 'default';
  align?: 'start' | 'end';
  tooltip?: string;
}

export function ChartMetric({
  label,
  value,
  diffValue,
  status = 'default',
  align = 'start',
  className,
  ...props
}: ChartMetricProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5',
        align === 'end' && 'items-end text-right',
        className
      )}
      {...props}
    >
      <span className="text-xs font-medium text-n-8">{label}</span>
      <span className="text-xl font-semibold tracking-tight tabular-nums text-n-12 dark:text-n-12">
        {value ?? '—'}
      </span>
      {diffValue && (
        <span className={cn(
          'text-xs font-medium',
          status === 'positive' && 'text-b-8',
          status === 'negative' && 'text-destructive',
          status === 'warning' && 'text-warning',
          status === 'default' && 'text-n-8'
        )}>
          {diffValue}
        </span>
      )}
    </div>
  );
}

export default ChartMetric;