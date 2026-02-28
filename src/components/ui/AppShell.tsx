'use client';

import React, { ReactNode } from 'react';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SideNav,
  SideNavItems,
  SideNavLink,
  Content,
  Theme,
  Layer,
} from '@carbon/react';
import {
  Dashboard,
  DocumentMultiple_01,
  Calendar,
  Medication,
  UserAvatar,
  Notification,
  Settings,
  Asleep,
  Sun,
} from '@carbon/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/providers/ThemeProvider';
import { signOut } from '@/actions/auth';
import type { User } from '@supabase/supabase-js';

interface AppShellProps {
  children: ReactNode;
  user?: User | null;
  practitioner?: any;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: Dashboard },
  { href: '/patients', label: 'Pacientes', icon: UserAvatar },
  { href: '/history', label: 'Historia Clínica', icon: DocumentMultiple_01 },
  { href: '/appointments', label: 'Citas', icon: Calendar },
  { href: '/prescriptions', label: 'Recetas', icon: Medication },
];

export default function AppShell({ children, user, practitioner }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  return (
    <Theme theme={theme}>
      <Header aria-label="Clinicboard">
        <HeaderName href="/" prefix="">
          <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
            clinic
          </span>
          <span style={{ fontWeight: 300, color: 'var(--clinicboard-accent)' }}>
            board
          </span>
        </HeaderName>

        <HeaderNavigation aria-label="Clinicboard Navigation">
          {navItems.map((item) => (
            <HeaderMenuItem
              key={item.href}
              href={item.href}
              isCurrentPage={pathname === item.href}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                router.push(item.href);
              }}
            >
              {item.label}
            </HeaderMenuItem>
          ))}
        </HeaderNavigation>

        <HeaderGlobalBar>
          {(practitioner?.name_given?.[0] || user?.email) && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', fontWeight: 500, borderRight: '1px solid var(--cds-border-subtle)' }}>
              Hola, {practitioner?.name_given?.[0] || user?.email}
            </div>
          )}
          <HeaderGlobalAction
            aria-label={
              theme === 'white' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'
            }
            onClick={toggleTheme}
          >
            {theme === 'white' ? <Asleep size={20} /> : <Sun size={20} />}
          </HeaderGlobalAction>
          <HeaderGlobalAction aria-label="Notificaciones" onClick={() => { }}>
            <Notification size={20} />
          </HeaderGlobalAction>
          <HeaderGlobalAction
            aria-label="Configuración"
            onClick={() => router.push('/settings')}
          >
            <Settings size={20} />
          </HeaderGlobalAction>
          <HeaderGlobalAction aria-label="Cerrar sesión" onClick={async () => await signOut()}>
            <UserAvatar size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>

        <SideNav
          aria-label="Navegación lateral"
          isRail={false}
          expanded={true}
          isFixedNav={true}
        >
          <SideNavItems>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <SideNavLink
                  key={item.href}
                  href={item.href}
                  renderIcon={IconComponent}
                  isActive={pathname === item.href}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    router.push(item.href);
                  }}
                >
                  {item.label}
                </SideNavLink>
              );
            })}
          </SideNavItems>
        </SideNav>
      </Header>

      <Content className="app-content">
        <Layer>{children}</Layer>
      </Content>
    </Theme>
  );
}
