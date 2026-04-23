'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export function ChartCard({ children, className, asChild = false, ...props }: ChartCardProps) {
  const Component = asChild ? Slot : 'div';
  return (
    <Component
      className={cn(
        'flex flex-col bg-card border border-border/40 rounded-lg overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default ChartCard;