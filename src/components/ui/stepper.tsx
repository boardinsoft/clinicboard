import * as React from "react"
import { cn } from "@/lib/utils"

export interface StepperProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    value?: number
    onChange?: (value: number) => void
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
    ({ className, ...props }, ref) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { value, onChange, ...divProps } = props as Record<string, unknown>;
        return (
            <div ref={ref} className={cn("flex w-full items-center", className)} {...divProps} />
        )
    }
)
Stepper.displayName = "Stepper"

export interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number
    disabled?: boolean
}

const StepperItem = React.forwardRef<HTMLDivElement, StepperItemProps>(
    ({ className, disabled, ...props }, ref) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { value, ...divProps } = props as Record<string, unknown>;
        return (
            <div
                ref={ref}
                className={cn("flex items-center", disabled && "opacity-50 pointer-events-none", className)}
                {...divProps}
            />
        )
    }
)
StepperItem.displayName = "StepperItem"

const StepperHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return <div ref={ref} className={cn("flex w-full items-center", className)} {...props} />
    }
)
StepperHeader.displayName = "StepperHeader"

const StepperIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return <div ref={ref} className={cn("flex shrink-0 items-center justify-center", className)} {...props} />
    }
)
StepperIcon.displayName = "StepperIcon"

const StepperSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return <div ref={ref} className={cn("flex-1", className)} {...props} />
    }
)
StepperSeparator.displayName = "StepperSeparator"

export { Stepper, StepperItem, StepperHeader, StepperIcon, StepperSeparator }
