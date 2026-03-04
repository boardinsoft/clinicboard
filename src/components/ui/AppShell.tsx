'use client';

import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from '@/actions/auth';
import type { User } from '@supabase/supabase-js';
import type { Practitioner } from '@/types/database.types';
import TabBar from './TabBar';
import { useTabStore } from '@/store/useTabStore';
import TabContentManager from './TabContentManager';
import { useLayoutStore } from '@/store/useLayoutStore';
import RightPanel from './RightPanel';
import { searchGlobal, SearchResult } from '@/actions/search';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
} from '@/components/ui/sidebar';

import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Pill,
  Bell,
  Settings,
  Moon,
  Sun,
  LogOut,
  Stethoscope,
  Search as SearchIcon,
  MessageSquare,
  PanelLeft,
} from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
  user?: User | null;
  practitioner?: Practitioner | null;
}

const navMain = [
  { href: '/', label: 'Tablero', icon: LayoutDashboard },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/history', label: 'Historia Clínica', icon: FileText },
  { href: '/appointments', label: 'Citas', icon: Calendar },
  { href: '/prescriptions', label: 'Recetas', icon: Pill },
];

// ─── Icon Rail Sidebar (always-visible, never collapses) ──────────────────────
function IconRail({ user, practitioner }: { user?: User | null; practitioner?: Practitioner | null }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { addTab } = useTabStore();
  const { theme, setTheme } = useTheme();

  const displayName =
    practitioner?.name_given?.[0] ||
    user?.email?.split('@')[0] ||
    'Usuario';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className="flex flex-col items-center w-14 h-full bg-sidebar shrink-0 py-2 gap-1 z-20"
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-1 shrink-0">
        <Stethoscope className="w-5 h-5" />
      </div>

      <div className="w-7 h-px bg-sidebar-border my-1 opacity-50" />

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1 w-full px-2">
        {navMain.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <TooltipProvider key={item.href} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (item.href === '/') {
                        useTabStore.setState({ activeTabId: null });
                      } else {
                        addTab({ id: item.href, title: item.label, url: item.href });
                      }
                      router.push(item.href);
                    }}
                    aria-label={item.label}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150 mx-auto',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon className="w-[18px] h-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </nav>

      {/* Footer: settings + user */}
      <div className="flex flex-col gap-1 w-full px-2 pb-1">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => router.push('/settings')}
                className="flex h-10 w-10 items-center justify-center rounded-lg mx-auto text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all"
                aria-label="Configuración"
              >
                <Settings className="w-[18px] h-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Configuración</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full mx-auto border border-sidebar-border hover:border-sidebar-accent-foreground/30 transition-all bg-sidebar-accent/30 hover:bg-sidebar-accent/60"
              aria-label={`Usuario: ${displayName}`}
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" sideOffset={10} className="w-56 rounded-xl shadow-lg">
            <div className="px-3 py-2.5 border-b border-border/60">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <DropdownMenuItem
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="gap-2.5 rounded-lg"
              >
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="gap-2.5 rounded-lg">
                <Settings className="w-4 h-4" />
                Configuración
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <div className="p-1">
              <DropdownMenuItem
                onClick={async () => await signOut()}
                className="gap-2.5 rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

// ─── Secondary Sidebar Panel ──────────────────────────────────────────────────
function SecondarySidebar() {
  const { secondaryPanelContent, secondaryPanelOpen } = useLayoutStore();

  if (!secondaryPanelOpen || !secondaryPanelContent) return null;

  return (
    <aside
      className="flex flex-col h-full w-64 bg-sidebar shrink-0 overflow-hidden"
      data-secondary-sidebar
    >
      {secondaryPanelContent}
    </aside>
  );
}

// ─── App Layout (inner, inside SidebarProvider) ───────────────────────────────
function AppLayout({ children, user, practitioner }: AppShellProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { addTab, activeTabId } = useTabStore();
  const { toggleRightPanel } = useLayoutStore();

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

  const getSearchContext = useCallback(() => {
    if (pathname.startsWith('/patients')) return 'patient';
    if (pathname.startsWith('/history')) return 'encounter';
    if (pathname.startsWith('/appointments')) return 'appointment';
    if (pathname.startsWith('/prescriptions')) return 'medication';
    return undefined;
  }, [pathname]);

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
  }, [debouncedSearchQuery, pathname, getSearchContext]);

  const handleResultClick = (result: SearchResult) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchModalOpen(false);

    if (pathname.startsWith('/history') && result.type === 'patient') {
      router.push(`/history?patientId=${result.id}`);
    } else {
      if (result.type === 'patient') {
        addTab({ id: result.url, title: result.title, url: result.url });
      }
      router.push(result.url);
    }
  };

  // Sync tab with current pathname
  React.useEffect(() => {
    if (pathname === '/') {
      if (activeTabId !== null) {
        useTabStore.setState({ activeTabId: null });
      }
      return;
    }

    const { tabs } = useTabStore.getState();
    const currentNavItem = navMain.find(
      (item) => item.href !== '/' && pathname.startsWith(item.href)
    );

    if (currentNavItem) {
      const existingTab = tabs.find((t) => t.id === currentNavItem.href);
      if (!existingTab) {
        useTabStore.getState().addTab({
          id: currentNavItem.href,
          title: currentNavItem.label,
          url: pathname,
        });
      } else if (existingTab.url !== pathname) {
        useTabStore.setState((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === existingTab.id ? { ...t, url: pathname } : t
          ),
        }));
      }
    }
  }, [pathname, activeTabId]);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background text-foreground">
      {/* ── Icon Rail (fixed, always visible) ── */}
      <IconRail user={user} practitioner={practitioner} />

      {/* ── Secondary context sidebar ── */}
      <SecondarySidebar />

      {/* ── Main content area ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* ── Top Header ── */}
        <header className="flex items-center h-14 border-b border-border/40 px-3 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 gap-2">
          {/* Sidebar Toggle */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:bg-muted/60"
                  onClick={() => useLayoutStore.getState().toggleSecondaryPanel()}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                Alternar barra lateral
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Tab bar */}
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <TabBar />
          </div>

          {/* Search trigger */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-muted-foreground h-8 px-3 rounded-md text-xs font-normal min-w-[160px] justify-start border-border/60 shrink-0"
            onClick={() => setIsSearchModalOpen(true)}
          >
            <SearchIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Buscar...</span>
            <kbd className="ml-auto pointer-events-none text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
              ⌘K
            </kbd>
          </Button>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={toggleRightPanel}
                    aria-label="Panel de documentos"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Panel de documentos</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    aria-label="Notificaciones"
                  >
                    <Bell className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Notificaciones</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        {/* ── Global Search Dialog ── */}
        <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
          <DialogContent className="sm:max-w-xl top-[18%] w-full rounded-xl shadow-xl p-0 overflow-hidden border-border bg-popover">
            <div className="flex items-center border-b px-3">
              <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-40" />
              <Input
                className="flex h-11 w-full bg-transparent py-3 text-sm outline-none border-0 focus-visible:ring-0 placeholder:text-muted-foreground"
                placeholder="Busca pacientes, notas clínicas, recetas o citas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground mr-1">
                ESC
              </kbd>
            </div>
            <div className="max-h-[320px] overflow-y-auto p-2">
              {isSearching && (
                <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
              )}
              {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Sin resultados para &quot;{searchQuery}&quot;
                </div>
              )}
              {!isSearching && searchQuery.length < 2 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Escribe al menos 2 caracteres para buscar
                </div>
              )}
              {searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="flex items-center gap-3 p-2.5 text-sm cursor-pointer hover:bg-accent rounded-lg transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted font-bold text-xs text-muted-foreground shrink-0">
                    {result.type.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground truncate">{result.title}</span>
                    <span className="text-xs text-muted-foreground truncate">{result.subtitle}</span>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Main content + right panel ── */}
        <div className="flex flex-1 overflow-hidden bg-background">
          <main className="flex-1 overflow-y-auto bg-background relative">
            <div className="h-full p-4 md:p-6 bg-background">
              {!activeTabId ? children : <TabContentManager>{children}</TabContentManager>}
            </div>
          </main>
          <RightPanel />
        </div>
      </div>
    </div>
  );
}

// ─── Shell Wrapper ─────────────────────────────────────────────────────────────
export default function AppShellWrapper(props: AppShellProps) {
  return (
    <SidebarProvider
      defaultOpen={false}
      style={
        {
          '--sidebar-width': '16rem',
          '--sidebar-width-icon': '3rem',
          display: 'contents', // neutralize the provider's own flex container
        } as React.CSSProperties
      }
    >
      <AppLayout {...props} />
    </SidebarProvider>
  );
}
