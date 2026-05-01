import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[6px] border border-n-5 bg-background px-3 py-1 text-base transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-n-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-b-8/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
