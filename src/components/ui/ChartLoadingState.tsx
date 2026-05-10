'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChartLoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function ChartLoadingState({ className, ...props }: ChartLoadingStateProps) {
  return (
    <div className={cn('flex flex-col gap-3 py-8', className)} {...props}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <div className="mt-4">
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    </div>
  );
}

export default ChartLoadingState;