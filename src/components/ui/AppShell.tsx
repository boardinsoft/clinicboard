'use client';

import React, { ReactNode, useState, useEffect } from 'react';
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
  Search,
} from '@carbon/react';
import {
  Dashboard,
  DocumentMultiple_01,
  Calendar,
  Medication,
  UserAvatar,
  Notification as NotificationIcon,
  Settings,
  Asleep,
  Sun,
  Logout,
  SidePanelClose,
  SidePanelOpen,
  Stethoscope,
  Search as SearchIcon,
} from '@carbon/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/providers/ThemeProvider';
import { signOut } from '@/actions/auth';
import type { User } from '@supabase/supabase-js';
import TabBar from './TabBar';
import { useTabStore } from '@/store/useTabStore';
import TabContentManager from './TabContentManager';
import { useLayoutStore } from '@/store/useLayoutStore';
import SecondaryPanel from './SecondaryPanel';
import { Modal } from '@carbon/react';
import { searchGlobal, SearchResult } from '@/actions/search';
import { useDebounce } from '@/hooks/useDebounce';

interface AppShellProps {
  children: ReactNode;
  user?: User | null;
  practitioner?: any;
}

const navItems = [
  { href: '/', label: 'Tablero', icon: Dashboard },
  { href: '/patients', label: 'Pacientes', icon: UserAvatar },
  { href: '/history', label: 'Historia Clínica', icon: DocumentMultiple_01 },
  { href: '/appointments', label: 'Citas', icon: Calendar },
  { href: '/prescriptions', label: 'Recetas', icon: Medication },
];

export default function AppShell({ children, user, practitioner }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { addTab, activeTabId } = useTabStore();
  const { secondaryPanelOpen, toggleSecondaryPanel } = useLayoutStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when modal opens
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchModalOpen]);

  // Determine context for search prioritization
  const getSearchContext = () => {
    if (pathname.startsWith('/patients')) return 'patient';
    if (pathname.startsWith('/history')) return 'encounter';
    if (pathname.startsWith('/appointments')) return 'appointment';
    if (pathname.startsWith('/prescriptions')) return 'medication';
    return undefined;
  };

  useEffect(() => {
    async function performSearch() {
      if (debouncedSearchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchGlobal(debouncedSearchQuery, getSearchContext());
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }
    performSearch();
  }, [debouncedSearchQuery, pathname]);

  const handleResultClick = (result: SearchResult) => {
    setSearchQuery('');
    setSearchResults([]);
    if (result.type === 'patient') {
      addTab({ id: result.url, title: result.title, url: result.url });
    }
    router.push(result.url);
  };

  // Keep Workspace Tabs in sync with the current URL
  React.useEffect(() => {
    if (!pathname || pathname === '/') {
      // If we are at /, ensure no active tab is selected (Tablero view)
      if (activeTabId !== null) {
        useTabStore.setState({ activeTabId: null });
      }
      return;
    }

    const { tabs } = useTabStore.getState();
    const currentNavItem = navItems.find(item => item.href !== '/' && pathname.startsWith(item.href));

    if (currentNavItem) {
      const existingTab = tabs.find(t => t.id === currentNavItem.href);
      if (!existingTab) {
        // Add tab if it doesn't exist
        useTabStore.getState().addTab({
          id: currentNavItem.href,
          title: currentNavItem.label,
          url: pathname
        });
      } else if (existingTab.url !== pathname) {
        // Update URL if it changed (e.g. sub-routes)
        useTabStore.setState((state) => ({
          tabs: state.tabs.map(t => t.id === existingTab.id ? { ...t, url: pathname } : t)
        }));
      }
    }
  }, [pathname]);


  return (
    <Theme theme={theme}>
      <div className={secondaryPanelOpen ? 'secondary-panel-open' : ''}>
        <Header aria-label="Clinicboard">
          <HeaderName href="/" prefix="" className="clinicboard-brand-icon">
            <Stethoscope size={24} style={{ fill: '#A78BFA' }} />
          </HeaderName>

          <HeaderGlobalAction
            aria-label={secondaryPanelOpen ? 'Cerrar panel lateral' : 'Abrir panel lateral'}
            onClick={toggleSecondaryPanel}
            tooltipAlignment="start"
            className="clinicboard-panel-toggle"
          >
            {secondaryPanelOpen ? <SidePanelClose size={20} /> : <SidePanelOpen size={20} />}
          </HeaderGlobalAction>

          <div className="header-tabs-container">
            <TabBar />
            <div
              className="header-search-icon-only"
              onClick={() => setIsSearchModalOpen(true)}
              title="Buscar profunda (⌘K)"
            >
              <SearchIcon size={20} />
            </div>
          </div>

          <Modal
            open={isSearchModalOpen}
            onRequestClose={() => setIsSearchModalOpen(false)}
            passiveModal
            size="md"
            className="clinicboard-command-palette"
          >
            <div className="command-palette-container">
              <Search
                id="modal-search"
                ref={searchInputRef}
                labelText="Búsqueda profunda..."
                placeholder="Busca pacientes, notas clínicas, recetas o citas..."
                size="lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              />
              <div className="command-palette-results">
                {isSearching && (
                  <div className="search-status-bar">Buscando en registros...</div>
                )}
                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="search-status-bar">No hay coincidencias exactas.</div>
                )}
                {searchResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className={`command-result-item type-${result.type}`}
                    onClick={() => {
                      handleResultClick(result);
                      setIsSearchModalOpen(false);
                    }}
                  >
                    <div className="result-icon-tag">{result.type.charAt(0).toUpperCase()}</div>
                    <div className="result-info">
                      <span className="result-title">{result.title}</span>
                      <span className="result-subtitle">{result.subtitle}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="command-palette-footer">
                <span>↑↓ para navegar</span>
                <span>Enter para seleccionar</span>
                <span>Esc para cerrar</span>
              </div>
            </div>
          </Modal>

          <HeaderGlobalBar>
            {(practitioner?.name_given?.[0] || user?.email) && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', fontWeight: 500 }}>
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
              <NotificationIcon size={20} />
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
                const isActive = item.href === '/' ? (pathname === '/') : (pathname.startsWith(item.href));
                return (
                  <SideNavLink
                    key={item.href}
                    href={item.href}
                    renderIcon={IconComponent}
                    isActive={isActive}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      if (item.href === '/') {
                        useTabStore.setState({ activeTabId: null });
                      } else {
                        addTab({ id: item.href, title: item.label, url: item.href });
                      }
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

        <SecondaryPanel />

        <Content
          className="app-content"
          role="main"
        >
          <Layer>
            {!activeTabId ? (
              children
            ) : (
              <TabContentManager>{children}</TabContentManager>
            )}
          </Layer>
        </Content>
      </div>
    </Theme>
  );
}
