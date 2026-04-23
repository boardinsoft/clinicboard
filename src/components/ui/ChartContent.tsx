'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChartContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  disabledState?: React.ReactNode;
  disabledActions?: React.ReactNode;
}

export function ChartContent({
  children,
  className,
  ...props
}: ChartContentProps) {
  return (
    <div
      className={cn('relative px-5 py-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default ChartContent;