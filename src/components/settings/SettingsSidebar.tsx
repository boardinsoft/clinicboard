'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  User,
  Users,
  CreditCard,
  Palette,
  type LucideIcon,
} from 'lucide-react';

interface SettingsNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    title: 'Clínica',
    href: '/settings/clinic',
    icon: Building2,
  },
  {
    title: 'Mi Perfil',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'Equipo',
    href: '/settings/team',
    icon: Users,
  },
  {
    title: 'Apariencia',
    href: '/settings/appearance',
    icon: Palette,
  },
];

interface SettingsSidebarProps {
  clinicSlug: string;
}

export function SettingsSidebar({ clinicSlug }: SettingsSidebarProps) {
  const pathname = usePathname() || '';

  return (
    <div className="w-56 shrink-0 border-r border-n-5/30">
      <div className="sticky top-12 py-4">
        <nav className="space-y-0.5 px-2">
          {SETTINGS_NAV_ITEMS.map((item) => {
            const isActive = pathname === `/${clinicSlug}${item.href}` || pathname === `/${clinicSlug}${item.href}/`;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={`/${clinicSlug}${item.href}`}
                className={cn(
                  'relative flex items-center gap-2.5 h-8 px-2 rounded-[6px] text-[13px] transition-colors duration-150',
                  isActive
                    ? 'bg-b-2/50 text-b-8'
                    : 'text-n-8 hover:bg-n-3 hover:text-n-11'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-b-8 rounded-r-[3px]" />
                )}
                <Icon size={16} strokeWidth={1.8} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 pt-4 px-2 border-t border-n-5/30">
          <p className="px-2 text-[10px] font-bold text-n-8 uppercase tracking-widest mb-1.5">
            Facturación
          </p>
          <Link
            href={`/${clinicSlug}/settings/billing`}
            className={cn(
              'relative flex items-center gap-2.5 h-8 px-2 rounded-[6px] text-[13px] transition-colors duration-150',
              pathname === `/${clinicSlug}/settings/billing`
                ? 'bg-b-2/50 text-b-8'
                : 'text-n-8 hover:bg-n-3 hover:text-n-11'
            )}
          >
            {pathname === `/${clinicSlug}/settings/billing` && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-b-8 rounded-r-[3px]" />
            )}
            <CreditCard size={16} strokeWidth={1.8} />
            <span>Planes y uso</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
