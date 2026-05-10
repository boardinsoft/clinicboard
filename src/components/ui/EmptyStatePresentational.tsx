'use client';

import * as React from 'react';
import { SquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStatePresentationalProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ElementType;
  title: string;
  description: string;
}

export function EmptyStatePresentational({
  icon: Icon = SquarePlus,
  title,
  description,
  className,
  children,
  ...props
}: EmptyStatePresentationalProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-n-2 mb-4">
        <Icon className="w-6 h-6 text-n-8" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-n-11 mb-1">{title}</p>
      <p className="text-xs text-n-8 max-w-[280px] leading-relaxed">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default EmptyStatePresentational;