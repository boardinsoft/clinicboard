'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsCard({ title, description, children, className }: SettingsCardProps) {
  return (
    <div className={cn('bg-n-1 rounded-lg border border-n-5/30 overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-n-5/30">
        <h2 className="text-sm font-bold text-n-11">{title}</h2>
        {description && (
          <p className="text-[11px] text-n-8 mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 py-6">
        {children}
      </div>
    </div>
  );
}

interface SettingsCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingsCardFooter({ children, className }: SettingsCardFooterProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-n-5/30 bg-n-2 flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  );
}
