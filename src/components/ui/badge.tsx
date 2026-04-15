import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ─── Badge variants ────────────────────────────────────────────────────────────
// Dos familias de forma:
//   • Square (rounded-md) — códigos CIE-10, categorías, tipos de dato
//   • Pill   (rounded-full) — estados clínicos, FHIR status, activo/inactivo
// ──────────────────────────────────────────────────────────────────────────────
const badgeVariants = cva(
  "inline-flex items-center border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        // ── Square (rounded-md) — categorías y códigos ──
        default:
          "rounded-md border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "rounded-md border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "rounded-md border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline:
          "rounded-md border-border text-foreground bg-transparent",

        // ── Pill (rounded-full) — estados clínicos y FHIR ──
        pill:
          "rounded-full border-transparent bg-primary/10 text-primary",

        // Éxito / Estable / Activo (verde menta)
        "pill-success":
          "rounded-full border-transparent bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",

        // Advertencia / Pendiente (ámbar)
        "pill-warning":
          "rounded-full border-transparent bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",

        // Peligro / Crítico / Error (rojo clínico)
        "pill-danger":
          "rounded-full border-transparent bg-destructive/10 text-destructive dark:bg-destructive/15",

        // Neutro / Inactivo / Resuelta (gris)
        "pill-muted":
          "rounded-full border-transparent bg-muted text-muted-foreground",

        // Azul — información / en consulta
        "pill-info":
          "rounded-full border-transparent bg-primary/10 text-primary dark:bg-primary/15",
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
