'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChartHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center';
}

export function ChartHeader({
  children,
  className,
  align = 'center',
  ...props
}: ChartHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-row items-center justify-between gap-4 px-5 py-4 border-b border-border/40',
        align === 'start' && 'justify-start',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default ChartHeader;