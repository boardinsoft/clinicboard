"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { FieldSet, FieldLegend } from "@/components/ui/field"

interface FieldsetProps {
    title: string
    description?: string
    className?: string
    children: React.ReactNode
}

function Fieldset({ title, description, className, children }: FieldsetProps) {
    return (
        <FieldSet className={cn("gap-0", className)}>
            <div className="px-5 pt-5 pb-4 border-b border-n-5/30 bg-n-2/30">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-b-8 shrink-0" />
                    <div>
                        <FieldLegend className="text-xs font-semibold uppercase tracking-wider text-n-8 mb-0 not:first-of-type:mt-2">
                            {title}
                        </FieldLegend>
                        {description && (
                            <p className="text-[11px] text-n-8 mt-0.5 leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-5 bg-n-2/20">
                {children}
            </div>
        </FieldSet>
    )
}

export { Fieldset, Fieldset as FieldsetSection }
