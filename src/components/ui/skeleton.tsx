import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-n-3 dark:bg-n-4", className)}
      {...props}
    />
  )
}

export { Skeleton }
