import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-brand-9 hover:bg-brand-7 dark:hover:bg-b-7",
        destructive:
          "bg-destructive text-destructive-foreground border border-success-border hover:bg-destructive/90 dark:hover:bg-red-600",
        outline:
          "bg-background text-foreground border border-border hover:bg-neutral-2 dark:hover:bg-n-4",
        secondary:
          "bg-neutral-3 dark:bg-neutral-5 text-foreground border border-neutral-5 dark:border-neutral-7 hover:bg-neutral-4 dark:hover:bg-n-5",
        ghost:
          "bg-transparent text-foreground border border-transparent hover:bg-neutral-2 dark:hover:bg-n-3",
        link:
          "bg-transparent text-primary border border-transparent hover:underline dark:hover:text-b-7 px-1",
      },
      size: {
        xs: "h-7 px-2 text-xs gap-1.5",
        sm: "h-8 px-3 text-sm gap-1.5",
        md: "h-9 px-4 text-base gap-2", // Default (15px)
        lg: "h-11 px-6 text-lg gap-2.5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
