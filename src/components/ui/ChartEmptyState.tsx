'use client';

import * as React from 'react';
import { BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function ChartEmptyState({
  title,
  description,
  icon,
  className,
  ...props
}: ChartEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-n-3 mb-3">
        {icon || <BarChart2 className="w-5 h-5 text-n-8" strokeWidth={1.8} />}
      </div>
      <p className="text-sm font-semibold text-n-11 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-n-8 max-w-[200px]">{description}</p>
      )}
    </div>
  );
}

export default ChartEmptyState;