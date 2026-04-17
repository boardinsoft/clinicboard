'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

// ─── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
  children,
}: PageHeaderProps) {
  // Filtrar breadcrumbs que coincidan exactamente con el título para evitar redundancia
  const filteredBreadcrumbs = breadcrumbs?.filter(
    (item, index) => !(index === breadcrumbs.length - 1 && item.label === title)
  );

  return (
    <div className={cn('flex flex-col gap-4 px-6 py-6 border-b border-border/40 bg-background', className)}>
      <div className="flex flex-col gap-2">
        {filteredBreadcrumbs && filteredBreadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {filteredBreadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink href={item.href} className="text-xs font-medium transition-colors hover:text-foreground">
                        {item.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-xs font-medium text-foreground">
                        {item.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < filteredBreadcrumbs.length - 1 && (
                    <BreadcrumbSeparator className="text-muted-foreground/40" />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="text-base text-muted-foreground/80 max-w-3xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── PageContainer ────────────────────────────────────────────────────────────

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'large' | 'full' | 'narrow';
}

const containerSizes = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  large: 'max-w-7xl',
  full: 'max-w-full',
};

export function PageContainer({
  children,
  className,
  size = 'default',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-6 py-8 sm:px-8',
        containerSizes[size],
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── PageSection ──────────────────────────────────────────────────────────────

interface PageSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  actions?: React.ReactNode;
}

export function PageSection({
  title,
  description,
  children,
  className,
  orientation = 'vertical',
  actions,
}: PageSectionProps) {
  if (orientation === 'horizontal') {
    return (
      <div className={cn('grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-12 py-8 first:pt-0 last:pb-0', className)}>
        <div className="md:col-span-4 lg:col-span-3">
          <div className="sticky top-8">
            <div className="flex items-center justify-between gap-4 mb-1">
              {title && <h2 className="text-sm font-bold text-foreground">{title}</h2>}
              {actions && <div className="md:hidden">{actions}</div>}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
            {actions && <div className="hidden md:block mt-4">{actions}</div>}
          </div>
        </div>
        <div className="md:col-span-8 lg:col-span-9">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4 py-8 first:pt-0 last:pb-0', className)}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-sm font-bold text-foreground">{title}</h2>}
            {description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}

export function PageSectionSeparator() {
  return <Separator className="bg-border/40" />;
}
