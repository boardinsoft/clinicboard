'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const REQUIREMENTS: PasswordRequirement[] = [
  { label: '8+ caracteres', test: (p) => p.length >= 8 },
  { label: 'Mayúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Número', test: (p) => /[0-9]/.test(p) },
  { label: 'Carácter especial', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const fulfilledCount = REQUIREMENTS.filter((req) => req.test(password)).length;
  const isEmpty = password.length === 0;

  const getStrengthColor = (index: number): string => {
    if (isEmpty) return 'bg-n-4';
    if (index >= fulfilledCount) return 'bg-n-4';
    if (fulfilledCount <= 2) return 'bg-destructive';
    if (fulfilledCount === 3) return 'bg-warning';
    if (fulfilledCount === 4) return 'bg-b-8';
    return 'bg-success';
  };

  const getLabel = (): { text: string; className: string } => {
    if (isEmpty) return { text: '', className: '' };
    if (fulfilledCount <= 2) return { text: 'Débil', className: 'text-destructive' };
    if (fulfilledCount === 3) return { text: 'Regular', className: 'text-warning' };
    if (fulfilledCount === 4) return { text: 'Buena', className: 'text-b-8' };
    return { text: 'Fuerte', className: 'text-success' };
  };

  const label = getLabel();

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-200',
              getStrengthColor(i)
            )}
          />
        ))}
      </div>
      {label.text && (
        <p className={cn('text-[11px] font-semibold tracking-wide uppercase', label.className)}>
          {label.text}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {REQUIREMENTS.map((req, i) => {
          const isMet = req.test(password);
          return (
            <li
              key={i}
              className={cn(
                'flex items-center gap-1.5 text-[11px] font-medium transition-colors',
                isMet ? 'text-success' : isEmpty ? 'text-n-8' : 'text-n-8'
              )}
            >
              {isMet ? (
                <Check size={12} strokeWidth={2.5} className="shrink-0" />
              ) : (
                <X size={12} strokeWidth={2.5} className="shrink-0 opacity-40" />
              )}
              <span>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}