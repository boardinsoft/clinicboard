'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from '@/actions/auth';
import type { User } from '@supabase/supabase-js';
import type { Practitioner } from '@/types/database.types';
import TabBar from './TabBar';
import { useTabStore } from '@/store/useTabStore';
import TabContentManager from './TabContentManager';
import { useLayoutStore } from '@/store/useLayoutStore';
import AIAssistant from './AIAssistant';
import { searchGlobal, SearchResult } from '@/actions/search';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { getTabTitle } from '@/lib/tabs-utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

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
  PanelLeft,
  Sparkles,
  HelpCircle,
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

const QUICK_ACTIONS = [
  {
    id: 'new-patient',
    label: 'Nuevo Paciente',
    description: 'Registrar un nuevo expediente',
    href: '/patients/new',
    icon: Users,
  },
  {
    id: 'go-appointments',
    label: 'Agenda de Citas',
    description: 'Ver y gestionar citas del día',
    href: '/appointments',
    icon: Calendar,
  },
  {
    id: 'go-history',
    label: 'Historia Clínica',
    description: 'Consultar encuentros y evoluciones',
    href: '/history',
    icon: FileText,
  },
] as const;

// ─── Helper: Icono con tooltip ────────────────────────────────────────────────
function IconBtn({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 text-muted-foreground hover:text-foreground transition-colors duration-100', className)}
          onClick={onClick}
          aria-label={label}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

// ─── Sub-Header — TabBar filtrado + toggle panel secundario ──────────────────
function SubHeader() {
  const {
    secondaryPanelContent,
    secondaryPanelOpen,
    toggleSecondaryPanel,
    subHeaderContent
  } = useLayoutStore();
  const { tabs } = useTabStore();
  const pathname = usePathname() || '/';
  const modulePrefix = pathname === '/' ? '' : '/' + pathname.split('/')[1];
  const moduleTabs = modulePrefix ? tabs.filter(t => t.url.startsWith(modulePrefix)) : [];

  // null = explicitly suppressed by the current module layout
  if (subHeaderContent === null) return null;
  // undefined (default) with no tabs = nothing to show
  if (subHeaderContent === undefined && moduleTabs.length === 0) return null;

  const hasSidebarContent = !!secondaryPanelContent;

  return (
    <div className="flex items-center h-12 border-b border-border bg-muted shrink-0 px-2 gap-0">
      {hasSidebarContent && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSecondaryPanel}
                aria-label={secondaryPanelOpen ? 'Colapsar panel' : 'Expandir panel'}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md',
                  'text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors duration-100'
                )}
              >
                <PanelLeft className={cn('w-3.5 h-3.5 transition-transform duration-200', !secondaryPanelOpen && 'rotate-180')} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {secondaryPanelOpen ? 'Colapsar panel' : 'Expandir panel'}
            </TooltipContent>
          </Tooltip>
          <div className="w-px h-4 bg-border/40 mx-2" />
        </>
      )}
      {subHeaderContent !== undefined ? subHeaderContent : <TabBar />}
    </div>
  );
}

// ─── IconRail — solo nav de módulos + footer settings ─────────────────────────
function IconRail() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { addTab } = useTabStore();

  return (
    <aside
      className="flex flex-col items-center w-14 h-full bg-sidebar shrink-0 z-20 border-r border-border/40"
      aria-label="Navegación principal"
    >
      {/* ── Nav items — estilo Supabase ── */}
      <nav className="flex flex-col flex-1 w-full pt-2">
        {navMain.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <div className="w-full flex items-center justify-center py-0.5">
                  <button
                    onClick={() => {
                      if (item.href === '/') {
                        useTabStore.setState({ activeTabId: null });
                        router.push(item.href);
                      } else {
                        const title = getTabTitle(item.href);
                        addTab({ title, url: item.href });
                        router.push(item.href);
                      }
                    }}
                    aria-label={item.label}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-100',
                      isActive
                        ? 'text-foreground bg-muted/60'
                        : 'text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground'
                    )}
                  >
                    <item.icon className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* ── Footer: Settings ── */}
      <div className="flex flex-col w-full border-t border-border/40 pb-2 pt-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center py-0.5">
              <button
                onClick={() => router.push('/settings')}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground transition-colors duration-100"
                aria-label="Configuración"
              >
                <Settings className="w-[18px] h-[18px]" />
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Configuración
          </TooltipContent>
        </Tooltip>
      </div>

    </aside>
  );
}

// ─── Secondary Sidebar ────────────────────────────────────────────────────────
// El botón de colapsar vive AQUÍ, no en el header global.
function SecondarySidebar() {
  const { secondaryPanelContent, secondaryPanelOpen } = useLayoutStore();

  if (!secondaryPanelOpen || !secondaryPanelContent) return null;

  return (
    <aside
      className="flex flex-col h-full w-64 bg-sidebar shrink-0 overflow-hidden border-r border-border/40"
      data-secondary-sidebar
    >
      {/* ── Contenido inyectado por cada página ── */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {secondaryPanelContent}
      </div>
    </aside>
  );
}

// ─── App Layout ───────────────────────────────────────────────────────────────
function AppLayout({ children, user, practitioner }: AppShellProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { addTab, activeTabId } = useTabStore();
  const { rightPanelOpen, secondaryPanelOpen, setSecondaryPanelOpen, toggleRightPanel } = useLayoutStore();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    useTabStore.getState().loadPersistedTabs();
    return () => clearTimeout(timer);
  }, []);

  // Cmd+K
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

  // Auto-abrir sidebar contextual según ruta
  useEffect(() => {
    const routesWithSidebar = ['/patients', '/history', '/appointments'];
    const hasSidebar = routesWithSidebar.some(r => pathname.startsWith(r));
    if (hasSidebar && !secondaryPanelOpen) {
      setSecondaryPanelOpen(true);
    }
  }, [pathname, secondaryPanelOpen, setSecondaryPanelOpen]);

  useEffect(() => {
    async function performSearch() {
      if (debouncedSearchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchGlobal(debouncedSearchQuery);
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

  React.useEffect(() => {
    useTabStore.getState().syncWithRouter(pathname);
  }, [pathname]);

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-background text-foreground">

      {/* ══ HEADER FULL-WIDTH ══════════════════════════════════════════════════ */}
      <header className="flex items-center h-12 border-b border-border/40 px-3 shrink-0 bg-neutral-1 z-30 gap-2">

        {/* ── Logo Clinicboard — sin fondo ── */}
        <div className="flex items-center gap-2 shrink-0 mr-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          <span className="text-[13px] font-semibold tracking-tight text-foreground select-none">
            Clinicboard
          </span>
        </div>

        {/* ── Separador ── */}
        <div className="w-px h-5 bg-border shrink-0" />

        {/* ── Search button ── */}
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className={cn(
            'flex items-center gap-2 h-8 px-3 rounded-md border border-border/60',
            'text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50',
            'transition-colors min-w-[148px]'
          )}
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Buscar o ir a...</span>
          <kbd className="pointer-events-none font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground/70">
            ⌘K
          </kbd>
        </button>

        {/* ── Spacer pushes everything to the right ── */}
        <div className="flex-1" />

        {/* ── Acciones derecha ── */}
        <div className="flex items-center gap-0.5 shrink-0">
          <IconBtn
            icon={Sparkles}
            label="Asistente IA"
            onClick={toggleRightPanel}
            className={cn("text-muted-foreground/70 transition-colors", rightPanelOpen && "text-primary")}
          />
          <IconBtn icon={HelpCircle} label="Ayuda" />
          <IconBtn icon={Bell} label="Notificaciones" />

          <div className="w-px h-5 bg-border mx-1" />

          {/* Avatar + Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                id="user-menu-trigger"
                className="flex h-7 w-7 items-center justify-center rounded-full hover:ring-1 hover:ring-primary/20 transition-all outline-none"
                aria-label={`Usuario: ${displayName}`}
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold rounded-full">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" sideOffset={8} className="w-56 rounded-xl shadow-lg">
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <DropdownMenuItem
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="gap-2.5 rounded-lg text-sm"
                >
                  {mounted ? (
                    <>
                      {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4" />
                      Modo Oscuro
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')} className="gap-2.5 rounded-lg text-sm">
                  <Settings className="w-4 h-4" />
                  Configuración
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <div className="p-1">
                <DropdownMenuItem
                  onClick={async () => await signOut()}
                  className="gap-2.5 rounded-lg text-sm text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ══ CUERPO — debajo del header full-width ═════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Icon Rail (sin logo, nav desde arriba) ── */}
        <IconRail />

        {/* ── Sidebar contextual: PatientsSidebar / HistorySidebar / etc. ── */}
        <SecondarySidebar />

        {/* ── Contenido principal ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Global Search Dialog */}
          <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
            <DialogContent className="sm:max-w-xl top-[18%] w-full rounded-xl shadow-xl p-0 overflow-hidden border-border bg-popover">
              <div className="flex items-center border-b px-3 py-2">
                <SearchIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground/40" />
                <Input
                  className="flex h-11 w-full bg-transparent py-3 text-sm outline-none border-0 focus-visible:ring-0 placeholder:text-muted-foreground"
                  placeholder="Pacientes, citas, historias, acciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground mr-1">
                  ESC
                </kbd>
              </div>
              <div className="max-h-[320px] overflow-y-auto px-2 py-1.5">
                {isSearching && (
                  <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
                )}
                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Sin resultados para &quot;{searchQuery}&quot;
                  </div>
                )}
                {!isSearching && searchQuery.length === 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground/70 mb-1">
                      Acciones rápidas
                    </p>
                    {QUICK_ACTIONS.map(action => (
                      <div
                        key={action.id}
                        onClick={() => { setIsSearchModalOpen(false); router.push(action.href); }}
                        className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-md transition-colors"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted/50 shrink-0">
                          <action.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-foreground">{action.label}</span>
                          <span className="text-xs text-muted-foreground">{action.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!isSearching && searchQuery.length >= 1 && searchQuery.length < 2 && (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Escribe al menos 2 caracteres
                  </div>
                )}
                {searchResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors"
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

          {/* Main content + optional right panel */}
          <div className="flex flex-1 overflow-hidden bg-background">
            <ResizablePanelGroup orientation="horizontal" id="main-content-layout">
              <ResizablePanel
                id="main-content-panel"
                defaultSize={rightPanelOpen ? "75%" : "100%"}
                minSize="50%"
              >
                <main className="flex-1 overflow-y-auto bg-background relative h-full">
                  {!activeTabId ? children : <TabContentManager>{children}</TabContentManager>}
                </main>
              </ResizablePanel>
              {rightPanelOpen && (
                <>
                  <ResizableHandle withHandle className="w-px bg-border hover:bg-primary/40 transition-colors" />
                  <ResizablePanel id="right-panel" defaultSize="25%" minSize="20%" maxSize="50%">
                    <AIAssistant />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>
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
          display: 'contents',
        } as React.CSSProperties
      }
    >
      <AppLayout {...props} />
    </SidebarProvider>
  );
}
