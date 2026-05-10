import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { suffixIcon?: React.ReactNode }>(
  ({ className, type, suffixIcon, ...props }, ref) => {
    if (!suffixIcon) {
      return (
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-[6px] border border-n-5 bg-background px-3 py-1 text-base transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-n-8 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
      )
    }

    return (
      <div className="relative flex-1">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-[6px] border border-n-5 bg-background px-3 py-1 pr-10 text-base transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-n-8 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {suffixIcon}
        </div>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }