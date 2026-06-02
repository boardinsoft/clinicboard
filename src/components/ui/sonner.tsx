"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group flex items-center gap-3 w-full p-4 rounded-lg border shadow-lg transition-all duration-200",
          success:
            "bg-s-success/10 border-s-success/30 text-n-12 dark:text-n-12",
          error:
            "bg-s-danger/10 border-s-danger/30 text-n-12 dark:text-n-12",
          warning:
            "bg-s-warning/10 border-s-warning/30 text-n-12 dark:text-n-12",
          info:
            "bg-s-info/10 border-s-info/30 text-n-12 dark:text-n-12",
          title: "text-sm font-semibold text-foreground",
          description: "text-sm text-foreground/70",
          icon: "shrink-0",
          closeButton:
            "absolute right-2 top-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-b-8",
          actionButton:
            "bg-b-8 text-n-1 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-b-9 active:scale-[0.98] transition-all",
          cancelButton:
            "bg-n-3 text-n-8 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-n-4 transition-all",
        },
      }}
      icons={{
        success: <CheckCircle className="w-5 h-5 text-s-success" strokeWidth={1.8} />,
        error: <XCircle className="w-5 h-5 text-s-danger" strokeWidth={1.8} />,
        warning: <AlertTriangle className="w-5 h-5 text-s-warning" strokeWidth={1.8} />,
        info: <Info className="w-5 h-5 text-s-info" strokeWidth={1.8} />,
      }}
      expand={false}
      richColors
      closeButton
      duration={4000}
      visibleToasts={3}
      {...props}
    />
  )
}

export { Toaster }