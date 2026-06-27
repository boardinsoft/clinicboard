'use client';

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    titleIcon?: React.ReactNode;
    description: React.ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    destructive?: boolean;
    loading?: boolean;
    disabled?: boolean;
    showReasonField?: boolean;
    reasonValue?: string;
    onReasonChange?: (value: string) => void;
    reasonSuggestions?: string[];
    reasonLabel?: string;
    reasonPlaceholder?: string;
    onConfirm: () => void;
}

export default function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    titleIcon,
    description,
    confirmLabel,
    cancelLabel = 'Volver',
    destructive = false,
    loading = false,
    disabled = false,
    showReasonField = false,
    reasonValue = '',
    onReasonChange,
    reasonSuggestions = [],
    reasonLabel = 'Motivo',
    reasonPlaceholder = '',
    onConfirm,
}: ConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {titleIcon && <span className="text-destructive">{titleIcon}</span>}
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <span className="text-sm text-muted-foreground leading-relaxed">
                            {description}
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {showReasonField && (
                    <div className="py-2 space-y-3">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                            {reasonLabel}
                        </Label>
                        {reasonSuggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {reasonSuggestions.map((s) => (
                                    <Badge
                                        key={s}
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-primary/20 text-xs"
                                        onClick={() => onReasonChange?.(s)}
                                    >
                                        {s}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <Textarea
                            placeholder={reasonPlaceholder}
                            value={reasonValue}
                            onChange={(e) => onReasonChange?.(e.target.value)}
                            className="min-h-[80px] resize-none"
                        />
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={loading || disabled}
                        className={destructive ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
