'use client';

import React, { ReactNode, useState } from 'react';
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderMenuButton,
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
  Logout,
  SidePanelClose,
  SidePanelOpen,
} from '@carbon/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/providers/ThemeProvider';
import { signOut } from '@/actions/auth';
import type { User } from '@supabase/supabase-js';
import TabBar from './TabBar';
import { useTabStore } from '@/store/useTabStore';
import TabContentManager from './TabContentManager';

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
  const { addTab } = useTabStore();

  // Keep Workspace Tabs in sync with the current URL
  // This ensures that if the user clicks onto a patient Detail, the "Pacientes" tab 
  // correctly reflects the /patients/[id] URL instead of resetting to /patients.
  React.useEffect(() => {
    if (!pathname) return;
    const { tabs } = useTabStore.getState();
    const currentTab = tabs.find(t => {
      if (t.id === '/patients' && pathname.startsWith('/patients')) return true;
      if (t.id === '/history' && pathname.startsWith('/history')) return true;
      if (t.url === pathname) return true;
      return false;
    });

    if (currentTab && currentTab.url !== pathname) {
      useTabStore.setState((state) => ({
        tabs: state.tabs.map(t => t.id === currentTab.id ? { ...t, url: pathname } : t)
      }));
    }
  }, [pathname]);

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
            <Logout size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>

        <SideNav
          aria-label="Navegación principal"
          isRail
          expanded={false}
          isFixedNav={true}
          className="clinicboard-primary-rail"
        >
          <SideNavItems>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <SideNavLink
                  key={item.href}
                  href={item.href}
                  renderIcon={IconComponent}
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    addTab({ id: item.href, title: item.label, url: item.href });
                    router.push(item.href);
                  }}
                  title={item.label}
                >
                  {item.label}
                </SideNavLink>
              );
            })}
          </SideNavItems>
        </SideNav>
      </Header>

      <TabBar />

      <Content
        className="app-content"
        role="main"
      >
        <Layer>
          <TabContentManager>{children}</TabContentManager>
        </Layer>
      </Content>
    </Theme>
  );
}
