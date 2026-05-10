import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ─── Badge / Pill variants ───────────────────────────────────────────────────
// Estética inspirada en Supabase:
//   • Square (default) — categorías, códigos CIE-10.
//   • Pill — estados dinámicos con punto de color (success, warning, etc).
// ──────────────────────────────────────────────────────────────────────────────
const badgeVariants = cva(
  "inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        // ── Square (CIE-10, Categorías) ──
        default:
          "rounded-md border border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-2 py-0.5 text-[11px] font-medium",
        secondary:
          "rounded-md border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2 py-0.5 text-[11px] font-medium",
        destructive:
          "rounded-md border border-transparent bg-s-danger text-white hover:bg-s-danger/80 px-2 py-0.5 text-[11px] font-medium",
        outline:
          "rounded-md border border-border text-foreground bg-transparent px-2 py-0.5 text-[11px] font-medium",

        // ── Pill (Estados Clínicos) ──
        pill: "pill pill-neutral",
        "pill-success": "pill pill-success",
        "pill-warning": "pill pill-warning",
        "pill-danger": "pill pill-danger",
        "pill-info": "pill pill-info",
        "pill-neutral": "pill pill-neutral",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
