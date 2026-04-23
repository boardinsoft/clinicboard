'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChartContextValue {
  isLoading: boolean;
  isDisabled: boolean;
}

const ChartContext = React.createContext<ChartContextValue | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a Chart component');
  }
  return context;
}

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  isDisabled?: boolean;
}

export function Chart({
  children,
  isLoading = false,
  isDisabled = false,
  className,
  ...props
}: ChartProps) {
  return (
    <ChartContext.Provider value={{ isLoading, isDisabled }}>
      <div className={cn('relative', className)} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export default Chart;