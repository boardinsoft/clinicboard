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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
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
  MessageSquare,
  Building2,
  ChevronDown,
  Database,
  User as UserIcon,
  CreditCard,
  Zap,
  Activity,
  Server,
  Network,
  ChevronsUpDown,
  Plus,
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
  showDot,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; size?: number }>;
  label: string;
  onClick?: () => void;
  className?: string;
  showDot?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 text-n-8 hover:text-n-12 hover:bg-n-3 transition-colors duration-100 relative', className)}
          onClick={onClick}
          aria-label={label}
        >
          <Icon size={16} strokeWidth={1.8} />
          {showDot && (
            <span className="absolute top-2 right-2 w-[7px] h-[7px] bg-amber-500 rounded-full border border-n-1" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[11px] font-medium bg-n-12 text-n-1 border-none shadow-md">
        {label}
      </TooltipContent>
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

  if (subHeaderContent === null) return null;
  if (subHeaderContent === undefined && moduleTabs.length === 0) return null;

  const hasSidebarContent = !!secondaryPanelContent;

  return (
    <div className="flex items-center h-12 border-b border-border bg-n-2 shrink-0 px-2 gap-0">
      {hasSidebarContent && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSecondaryPanel}
                className="flex h-7 w-7 items-center justify-center rounded-md text-n-8 hover:bg-n-3 hover:text-n-12 transition-colors duration-100"
              >
                <PanelLeft className={cn('w-4 h-4 transition-transform duration-200', !secondaryPanelOpen && 'rotate-180')} strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px] font-medium">
              {secondaryPanelOpen ? 'Colapsar panel' : 'Expandir panel'}
            </TooltipContent>
          </Tooltip>
          <div className="w-px h-4 bg-n-5 mx-2" />
        </>
      )}
      {subHeaderContent !== undefined ? subHeaderContent : <TabBar />}
    </div>
  );
}

// ─── IconRail — solo nav de módulos ───────────────────────────────────────────
function IconRail() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { addTab } = useTabStore();

  return (
    <aside
      className="flex flex-col items-center w-14 h-full bg-n-1 shrink-0 z-20 border-r border-border/40"
      aria-label="Navegación principal"
    >
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
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-100',
                      isActive
                        ? 'text-n-12 bg-n-2'
                        : 'text-n-8 hover:bg-n-2 hover:text-n-11'
                    )}
                  >
                    <item.icon className="w-5 h-5" strokeWidth={1.8} />
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px] font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      <div className="pb-4 pt-1 opacity-0 pointer-events-none">
        <div className="h-9 w-9" />
      </div>
    </aside>
  );
}

// ─── Secondary Sidebar ────────────────────────────────────────────────────────
function SecondarySidebar() {
  const { secondaryPanelContent, secondaryPanelOpen } = useLayoutStore();

  if (!secondaryPanelOpen || !secondaryPanelContent) return null;

  return (
    <aside
      className="flex flex-col h-full w-64 bg-n-1 shrink-0 overflow-hidden border-r border-border/40"
      data-secondary-sidebar
    >
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
  const { rightPanelOpen, toggleRightPanel } = useLayoutStore();
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
  const initials = displayName.charAt(0).toUpperCase();

  const specialty = practitioner?.specialty || 'Cardiología';
  const prefix = practitioner?.gender === 'female' ? 'Dra.' : 'Dr.';

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    useTabStore.getState().loadPersistedTabs();
    return () => clearTimeout(timer);
  }, []);

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
    if (result.type === 'patient') {
      addTab({ id: result.url, title: result.title, url: result.url });
    }
    router.push(result.url);
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-background text-foreground">

      {/* ══ WORKSPACE BAR (Topbar) ═════════════════════════════════════════════ */}
      <header className="flex items-center h-12 border-b border-border/40 px-4 shrink-0 bg-n-1 z-30">

        {/* ── SECCIÓN IZQUIERDA: Contexto (Macro-gap: 4) ── */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Brand Mark (Micro-gap: 2) */}
          <div className="flex items-center gap-2 mr-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-b-8 shadow-sm">
              <Stethoscope className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-[13px] font-bold tracking-tight text-n-12 select-none">
              ClinicBoard
            </span>
          </div>

          <div className="w-px h-4 bg-n-5" />

          {/* Clínica Selector (Meso-gap: 2) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-[5px] hover:bg-n-3 transition-colors outline-none group">
                <Building2 size={13} className="text-n-8 group-hover:text-n-10 transition-colors" strokeWidth={1.8} />
                <span className="text-[13px] font-medium text-n-12 truncate max-w-[160px]">
                  Clínica San Rafael
                </span>
                <ChevronsUpDown size={12} className="text-n-7 ml-0.5" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 rounded-lg shadow-lg border-n-5 p-1 bg-popover">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-n-8 px-3 py-2">
                Mis Organizaciones
              </DropdownMenuLabel>
              <DropdownMenuItem className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] bg-b-1 text-b-8 font-medium cursor-pointer">
                <Building2 size={14} strokeWidth={1.8} />
                <span className="flex-1">Clínica San Rafael</span>
                <Activity size={12} className="text-b-8" />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-n-10 hover:bg-n-2 cursor-pointer transition-colors">
                <Building2 size={14} className="text-n-8" strokeWidth={1.8} />
                <span className="flex-1">Hospital Central</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-n-4 my-1" />
              <DropdownMenuItem className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-b-8 font-medium hover:bg-b-1 cursor-pointer transition-colors">
                <Plus size={14} strokeWidth={2} />
                <span>Agregar clínica</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Plan Badge */}
          <span className="inline-flex items-center px-2 py-[3px] text-[10px] font-semibold tracking-[0.06em] uppercase rounded-[3px] bg-info-bg text-info leading-none flex-shrink-0">
            Plan Pro
          </span>

          <div className="w-px h-4 bg-n-5" />

          {/* Cargo/Especialidad */}
          <span className="text-[12px] font-bold text-n-10 whitespace-nowrap">
            {prefix} {specialty}
          </span>

          {/* Connect Resources Pill (Meso-gap: 2) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 h-6 px-2.5 rounded-full bg-b-2/50 border border-b-4/30 hover:bg-b-2 transition-colors outline-none">
                <div className="w-1.5 h-1.5 rounded-full bg-b-8" />
                <span className="text-[10px] font-bold text-b-9 uppercase tracking-wider">
                  3 recursos conectados
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-xl p-1">
              <DropdownMenuLabel className="px-3 py-2 text-[10px] uppercase tracking-widest text-n-8">
                Recursos del Sistema
              </DropdownMenuLabel>
              <DropdownMenuItem className="gap-3 px-3 py-2.5 rounded-lg">
                <Database className="w-4 h-4 text-b-8" strokeWidth={1.8} />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">FHIR Server</span>
                  <span className="text-[10px] text-n-8 font-mono">https://fhir.clinicboard.com</span>
                </div>
                <Badge variant="pill-success" className="ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 px-3 py-2.5 rounded-lg">
                <Server className="w-4 h-4 text-b-8" strokeWidth={1.8} />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">PACS / DICOM</span>
                  <span className="text-[10px] text-n-8 font-mono">DCM4CHEE local</span>
                </div>
                <Badge variant="pill-success" className="ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 px-3 py-2.5 rounded-lg">
                <Network className="w-4 h-4 text-b-8" strokeWidth={1.8} />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">HL7 LIS Gateway</span>
                  <span className="text-[10px] text-n-8 font-mono">Mirth Connect v3.12</span>
                </div>
                <Badge variant="pill-success" className="ml-auto" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── CENTRO: Espacio Flexible ── */}
        <div className="flex-1" />

        {/* ── SECCIÓN DERECHA: Acciones (Micro-gap: 1) ── */}
        <div className="flex items-center gap-1 shrink-0">
          
          {/* Feedback */}
          <button className="px-3 py-1.5 text-xs font-bold text-n-10 hover:bg-n-3 rounded-md transition-colors mr-1">
            Feedback
          </button>

          <IconBtn icon={HelpCircle} label="Ayuda" />

          {/* Search Pill */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2 h-7 px-3 rounded-full bg-n-2 border border-n-5 hover:bg-n-3 transition-colors min-w-[140px] ml-1"
          >
            <SearchIcon size={14} className="text-n-8" strokeWidth={1.8} />
            <span className="flex-1 text-left text-[11px] text-n-8 font-medium">Buscar…</span>
            <kbd className="font-mono text-[9px] text-n-8 opacity-60">⌘K</kbd>
          </button>

          <IconBtn icon={Bell} label="Notificaciones" showDot />
          
          <IconBtn 
            icon={Sparkles} 
            label="Asistente IA" 
            onClick={toggleRightPanel}
            className={cn(rightPanelOpen && "text-b-8 bg-b-2/40")}
          />

          <div className="w-px h-5 bg-n-5 mx-2" />

          {/* Upgrade Plan CTA */}
          <Button 
            variant="default" 
            size="sm" 
            className="h-7 px-3 bg-b-8 hover:bg-b-7 text-white border border-b-9 font-bold text-[10px] uppercase tracking-widest rounded-md"
          >
            Actualizar plan <Zap size={12} className="ml-1 fill-current" />
          </Button>

          <div className="w-px h-5 bg-n-5 mx-2" />

          {/* Avatar Menu Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 h-8 rounded-full pl-0.5 pr-2 hover:bg-n-2 transition-colors outline-none">
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-b-9 to-b-5 p-[1px]">
                  <Avatar className="h-full w-full border-none rounded-full">
                    <AvatarFallback className="bg-n-1 text-b-8 text-[11px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-n-8" strokeWidth={1.8} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl p-1 mt-1 shadow-xl">
              <DropdownMenuLabel className="px-3 py-2.5 font-normal">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-bold text-n-12 truncate">{displayName}</p>
                  <p className="text-[10px] text-n-8 truncate font-mono">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/settings')} className="gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer">
                  <UserIcon size={16} className="text-n-9" strokeWidth={1.8} />
                  Ajustes de Cuenta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings?tab=organization')} className="gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer">
                  <Building2 size={16} className="text-n-9" strokeWidth={1.8} />
                  Mi Organización
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer">
                  <CreditCard size={16} className="text-n-9" strokeWidth={1.8} />
                  Facturación
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer"
                >
                  {mounted && theme === 'dark' ? (
                    <Sun size={16} className="text-n-9" strokeWidth={1.8} />
                  ) : (
                    <Moon size={16} className="text-n-9" strokeWidth={1.8} />
                  )}
                  {mounted && theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => await signOut()}
                className="gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <LogOut size={16} strokeWidth={1.8} />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ══ CUERPO ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <IconRail />
        <SecondarySidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Global Search Dialog */}
          <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
            <DialogContent className="sm:max-w-xl top-[18%] w-full rounded-xl shadow-2xl p-0 overflow-hidden border-n-5 bg-popover">
              <div className="flex items-center border-b border-n-5 px-3 py-2 bg-n-2/50">
                <SearchIcon className="mr-2 h-4 w-4 shrink-0 text-n-8" strokeWidth={1.8} />
                <Input
                  className="flex h-11 w-full bg-transparent py-3 text-sm outline-none border-0 focus-visible:ring-0 placeholder:text-n-8"
                  placeholder="Pacientes, citas, historias, acciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-n-5 bg-n-1 px-1.5 py-0.5 font-mono text-[10px] text-n-8 mr-1 shadow-sm">
                  ESC
                </kbd>
              </div>
              <div className="max-h-[320px] overflow-y-auto px-2 py-2 bg-n-1">
                {isSearching && (
                  <div className="p-4 text-center text-sm text-n-8">Buscando...</div>
                )}
                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="p-4 text-center text-sm text-n-8 font-medium">
                    Sin resultados para &quot;{searchQuery}&quot;
                  </div>
                )}
                {!isSearching && searchQuery.length === 0 && (
                  <div className="p-1">
                    <p className="px-2 py-1 text-[10px] font-bold text-n-8 mb-1 uppercase tracking-widest">
                      Acciones rápidas
                    </p>
                    {QUICK_ACTIONS.map(action => (
                      <div
                        key={action.id}
                        onClick={() => { setIsSearchModalOpen(false); router.push(action.href); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-n-2 rounded-md transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-n-5 bg-n-1 shrink-0">
                          <action.icon className="w-4 h-4 text-n-9" strokeWidth={1.8} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-n-12 text-[13px]">{action.label}</span>
                          <span className="text-[11px] text-n-8">{action.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-n-2 rounded-md transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-n-5 bg-n-2 font-bold text-[10px] text-n-8 shrink-0 uppercase tracking-tighter">
                      {result.type.slice(0, 3)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-n-12 truncate text-[13px]">{result.title}</span>
                      <span className="text-[11px] text-n-8 truncate font-medium">{result.subtitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <div className="flex flex-1 overflow-hidden bg-background">
            <ResizablePanelGroup orientation="horizontal" id="main-content-layout">
              <ResizablePanel id="main-content-panel" defaultSize={100} minSize={50}>
                <main className="flex-1 overflow-y-auto bg-background relative h-full">
                  {!activeTabId ? children : <TabContentManager>{children}</TabContentManager>}
                </main>
              </ResizablePanel>
              {rightPanelOpen && (
                <>
                  <ResizableHandle withHandle className="w-px bg-border hover:bg-b-8 transition-colors" />
                  <ResizablePanel id="right-panel" defaultSize={25} minSize={20} maxSize={50}>
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

export default function AppShellWrapper(props: AppShellProps) {
  return (
    <SidebarProvider
      defaultOpen={false}
      style={
        {
          '--sidebar-width': '16rem',
          '--sidebar-width-icon': '3.5rem',
          display: 'contents',
        } as React.CSSProperties
      }
    >
      <AppLayout {...props} />
    </SidebarProvider>
  );
}
