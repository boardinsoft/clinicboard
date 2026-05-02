'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from '@/actions/auth';
import { useActiveClinic } from '@/providers/ActiveClinicContext';
import type { User } from '@supabase/supabase-js';
import type { Practitioner } from '@/types/database.types';
import type { Clinic } from '@/lib/supabase/clinic-utils';
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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ClinicChangeModal } from '@/components/ui/ClinicChangeModal';
import { Loader2 } from 'lucide-react';

import {
  Home,
  Users,
  Notebook,
  FileText,
  History,
  Bell,
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
  Globe,
  ShieldCheck,
  BookOpen,
  Keyboard,
  Settings,
  Pill,
  Calendar,
  LayoutDashboard,
  AlertCircle,
} from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
  user?: User | null;
  practitioner?: Practitioner | null;
  clinics: Clinic[];
  initialClinic: Clinic | null;
  emailConfirmed?: boolean;
}

const navMain = [
  { href: '/', label: 'Tablero', icon: Home },
  { href: '/patients', label: 'Pacientes', icon: Users },
  { href: '/appointments', label: 'Citas', icon: Notebook },
  { href: '/history', label: 'Historia', icon: History },
  { href: '/prescriptions', label: 'Recetas', icon: FileText },
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
          className={cn('h-8 w-8 text-n-8 hover:text-n-12 hover:bg-n-3 dark:hover:bg-n-2 transition-all duration-100 relative', className)}
          onClick={onClick}
          aria-label={label}
        >
          <Icon size={17} strokeWidth={1.8} />
          {showDot && (
            <span className="absolute top-[5px] right-[5px] w-[7px] h-[7px] bg-warning rounded-full border-[1.5px] border-n-12 dark:border-n-1 animate-pulse-dot" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent 
        side="bottom" 
        sideOffset={12}
        className="text-[11px] font-medium bg-n-11 text-n-1 border-n-10 rounded-[5px] shadow-xl animate-in fade-in zoom-in-95 duration-100"
      >
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
          <div className="w-px h-4 bg-n-5" />
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
      className="flex flex-col items-center w-[56px] h-full bg-n-1 shrink-0 z-20 border-r border-border/40 py-[10px]"
      aria-label="Navegación principal"
    >
      <nav className="flex flex-col flex-1 w-full gap-1">
        {navMain.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <div className="w-full flex items-center justify-center relative">
                  {isActive && (
                    <div className="absolute left-0 w-[3px] h-[18px] bg-b-8 rounded-r-[3px]" />
                  )}
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
                      'flex h-9 w-9 items-center justify-center rounded-[6px] transition-colors duration-100 relative',
                      isActive
                        ? 'text-b-8 bg-b-1 dark:bg-n-3'
                        : 'text-n-8 hover:bg-n-3 hover:text-n-11'
                    )}
                  >
                    <item.icon size={17} strokeWidth={1.8} />
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                sideOffset={12}
                className="text-[11px] font-medium bg-n-11 text-n-1 dark:bg-n-4 dark:text-n-10 border-n-10 dark:border-n-6 rounded-[5px] shadow-xl animate-in fade-in zoom-in-95 duration-100"
              >
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
function AppLayout({ children, user, practitioner, clinics, initialClinic, emailConfirmed }: AppShellProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { addTab, activeTabId } = useTabStore();
  const { rightPanelOpen, toggleRightPanel } = useLayoutStore();
  const { theme, setTheme } = useTheme();
  const { activeClinic, setActiveClinic, isChangingClinic } = useActiveClinic();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [pendingClinic, setPendingClinic] = useState<Clinic | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Usuario';
  const initials = displayName.charAt(0).toUpperCase();

  const specialty = practitioner?.specialty || 'Sin especialidad';

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

  const handleClinicSelect = (clinic: Clinic) => {
    if (clinic.id === activeClinic?.id) return;
    setPendingClinic(clinic);
    setChangeError(null);
    setShowChangeModal(true);
  };

  const handleConfirmClinicChange = async () => {
    if (!pendingClinic) return;
    try {
      setChangeError(null);
      await setActiveClinic(pendingClinic);
      setShowChangeModal(false);
      setPendingClinic(null);
    } catch {
      setChangeError('Error al cambiar de clínica. Intenta de nuevo.');
    }
  };

  const handleCancelClinicChange = () => {
    setShowChangeModal(false);
    setPendingClinic(null);
    setChangeError(null);
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-background text-foreground">
      {isChangingClinic && (
        <div className="clinic-change-overlay">
          <div className="clinic-change-spinner">
            <Loader2 className="h-8 w-8 text-b-8 animate-spin" />
            <p className="text-sm font-medium text-white">Cambiando de clínica...</p>
          </div>
        </div>
      )}

      <ClinicChangeModal
        isOpen={showChangeModal}
        currentClinic={activeClinic}
        targetClinic={pendingClinic}
        isLoading={isChangingClinic}
        error={changeError}
        onConfirm={handleConfirmClinicChange}
        onCancel={handleCancelClinicChange}
      />

      {/* ══ WORKSPACE BAR (Topbar) ═════════════════════════════════════════════ */}
      <header
        data-workspace-bar
        className="flex items-center h-12 border-b border-border px-4 shrink-0 bg-n-1 z-30"
      >

        {/* ── SECCIÓN IZQUIERDA: Contexto (Macro-gap: 4) ── */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Brand Mark (h-8 for alignment, gap-2) */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-b-8 shadow-sm">
              <Stethoscope className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-[13px] font-bold tracking-tight text-n-12 select-none">
              ClinicBoard
            </span>
          </div>

          <div className="w-px h-4 bg-n-5" />

          {/* Clínica Selector (Meso: px-3, gap-2) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Seleccionar organización activa"
                className="flex items-center gap-2 px-3 py-1.5 rounded-[5px] hover:bg-n-3 dark:hover:bg-n-2 transition-all outline-none group"
                disabled={isChangingClinic}
              >
                {isChangingClinic ? (
                  <Loader2 size={13} className="text-b-8 animate-spin" strokeWidth={1.8} />
                ) : (
                  <Building2 size={13} className="text-n-9 group-hover:text-n-11 transition-colors" strokeWidth={1.8} />
                )}
                <span className="text-[13px] font-medium text-n-11 dark:text-n-11 truncate max-w-[160px]">
                  {activeClinic?.name || 'Sin clínica'}
                </span>
                <ChevronsUpDown size={12} className="text-n-8 dark:text-n-9 ml-0.5" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 rounded-lg shadow-lg border-n-5 p-1 bg-popover">
              <div className="px-3 py-2 border-b border-n-4">
                <h4 className="text-[10px] uppercase tracking-wider text-n-9 dark:text-n-10 font-bold">Clínicas Vinculadas</h4>
              </div>
              <div className="p-1">
                {clinics.map((clinic) => (
                  <DropdownMenuItem
                    key={clinic.id}
                    onClick={() => handleClinicSelect(clinic)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] cursor-pointer transition-colors',
                      activeClinic?.id === clinic.id
                        ? 'bg-n-2 dark:bg-n-3 text-n-12 dark:text-n-11 font-medium'
                        : 'text-n-11 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-2'
                    )}
                  >
                    <Building2 size={14} strokeWidth={1.8} className={activeClinic?.id === clinic.id ? 'text-b-8' : 'text-n-9'} />
                    <span className="flex-1">{clinic.name}</span>
                    {activeClinic?.id === clinic.id && (
                      <Activity size={12} className="text-b-8" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Plan Badge (neutral pill) */}
          <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-medium text-n-9 dark:text-n-9 bg-n-3 dark:bg-n-3 border border-n-4 dark:border-n-4 rounded-full leading-none flex-shrink-0">
            Pro
          </span>

          <div className="w-px h-4 bg-n-5" />

          {/* Cargo/Especialidad */}
          <div className="inline-flex items-center gap-1">
            <span className="text-sm font-medium text-n-10 dark:text-n-11 whitespace-nowrap transition-colors">
              {specialty}
            </span>
          </div>

          {/* Connect Resources Pill (px-3, gap-2) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Ver estado de servicios y recursos conectados"
                className="flex items-center gap-2 h-8 px-3 rounded-[5px] bg-n-3 dark:bg-n-3 border border-n-4 dark:border-n-4 text-n-10 dark:text-n-11 hover:bg-n-4 dark:hover:bg-n-4 transition-all outline-none group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[12.5px] font-medium whitespace-nowrap">
                  3 recursos
                </span>
                <ChevronDown size={12} className="text-n-9 dark:text-n-10 ml-0.5" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[320px] rounded-lg shadow-2xl border-n-5 p-0 bg-popover overflow-hidden mt-2">
              <div className="flex items-center justify-between px-3.5 py-3 border-b border-n-4">
                <h3 className="text-[11px] font-semibold text-n-10 dark:text-n-11 uppercase tracking-wider">Recursos conectados</h3>
                <button className="text-[11px] font-medium text-n-9 dark:text-n-10 hover:text-n-11 dark:hover:text-n-12 transition-colors">+ Agregar</button>
              </div>

              <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                {/* FHIR */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-n-4 hover:bg-n-3 dark:hover:bg-n-2 transition-all group/item">
                  <div className="w-9 h-9 rounded-md bg-info-bg dark:bg-info/10 flex items-center justify-center text-info dark:text-info/60 shrink-0">
                    <Globe size={16} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-n-12 dark:text-n-11 leading-tight mb-0.5">FHIR R4 Server</div>
                    <div className="text-[11px] text-n-9 truncate mono">api.fhir.example.com</div>
                  </div>
                  <span className="text-[11px] font-medium text-n-9 dark:text-n-10 whitespace-nowrap px-1">● Conectado</span>
                </div>

                {/* HL7 */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-n-4 hover:bg-n-3 dark:hover:bg-n-2 transition-all group/item">
                  <div className="w-9 h-9 rounded-md bg-b-1 dark:bg-b-8/10 flex items-center justify-center text-b-8 dark:text-b-8/60 shrink-0 border border-b-2 dark:border-b-2/30">
                    <ShieldCheck size={16} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-n-12 dark:text-n-11 leading-tight mb-0.5">HL7v2 Interface</div>
                    <div className="text-[11px] text-n-9 truncate mono">hl7.hospital.local:2575</div>
                  </div>
                  <span className="text-[11px] font-medium text-n-9 dark:text-n-10 whitespace-nowrap px-1">● Conectado</span>
                </div>

                {/* DICOM */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-n-4 hover:bg-n-3 dark:hover:bg-n-2 transition-all group/item">
                  <div className="w-9 h-9 rounded-md bg-warning-bg dark:bg-warning/10 flex items-center justify-center text-warning dark:text-warning/60 shrink-0 border border-warning-border/30 dark:border-warning-border/15">
                    <Pill size={16} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-n-12 dark:text-n-11 leading-tight mb-0.5">PACS / DICOM</div>
                    <div className="text-[11px] text-n-9 truncate mono">pacs.hospital.local:104</div>
                  </div>
                  <span className="text-[11px] font-medium text-n-9 dark:text-n-10 whitespace-nowrap px-1">● Conectado</span>
                </div>

                {/* LIS (Offline) */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-n-3 dark:hover:bg-n-2 transition-all group/item">
                  <div className="w-9 h-9 rounded-md bg-n-3 flex items-center justify-center text-n-8 shrink-0 border border-n-4">
                    <Database size={16} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-n-12 leading-tight mb-0.5 opacity-60">Laboratorio (LIS)</div>
                    <div className="text-[11px] text-n-9 truncate mono opacity-60">lab.system.local</div>
                  </div>
                  <span className="text-[11px] font-medium text-n-9 dark:text-n-10 whitespace-nowrap px-1">● Offline</span>
                </div>
              </div>

              <div className="bg-n-2 dark:bg-n-2 border-t border-n-4">
                <a href="#integrations" className="flex items-center gap-2.5 px-3.5 py-3 text-[12.5px] font-medium text-n-10 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-3 transition-all">
                  <Settings size={14} className="text-n-9 dark:text-n-10" strokeWidth={1.8} />
                  <span>Gestionar integraciones</span>
                </a>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── CENTRO: Espacio Flexible ── */}
        <div className="flex-1" />

        {/* ── SECCIÓN DERECHA: Acciones (Micro-gap: 1.5) ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Feedback (px-3) */}
          <button className="px-3 py-1.5 text-[13px] font-medium text-n-11 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-2 hover:text-n-12 dark:hover:text-n-12 rounded-[5px] transition-all">
            Feedback
          </button>

          {/* Ayuda */}
          <IconBtn icon={HelpCircle} label="Ayuda" className="text-n-9 dark:text-n-10" />

          {/* Search Pill (px-3, gap-2) */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            aria-label="Abrir búsqueda global (⌘K)"
            className="flex items-center gap-2 h-8 px-3 min-w-[200px] bg-n-2 dark:bg-n-3 border border-n-5 dark:border-n-5 rounded-[5px] text-[13px] text-n-9 dark:text-n-10 hover:bg-n-3 dark:hover:bg-n-4 hover:border-n-6 hover:text-n-11 dark:hover:text-n-11 focus:bg-background focus:border-b-8 focus:ring-2 focus:ring-b-8/10 outline-none transition-all shadow-sm"
          >
            <SearchIcon size={14} strokeWidth={1.8} />
            <span className="flex-1 text-left font-medium">Buscar…</span>
            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium mono bg-background border border-n-5 rounded-[3px] text-n-9 dark:text-n-10">
              ⌘K
            </span>
          </button>

          <IconBtn icon={Bell} label="Notificaciones" className="text-n-9 dark:text-n-10" showDot />
          
          {/* Asistente IA */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRightPanel}
                className={cn(
                  'h-8 w-8 transition-all duration-200 relative group/ia',
                  rightPanelOpen
                    ? "bg-b-1 text-b-8 shadow-sm"
                    : "text-n-9 dark:text-n-10 hover:bg-b-8/10 hover:text-b-8"
                )}
                aria-label="Asistente IA"
              >
                <Sparkles 
                  size={16} 
                  strokeWidth={1.8} 
                  className={cn("transition-transform", rightPanelOpen ? "animate-float" : "group-hover/ia:animate-float")} 
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={12} className="text-[11px] font-medium bg-n-11 text-n-1 border-n-10 rounded-[5px] shadow-xl animate-in fade-in zoom-in-95 duration-100">
              Asistente IA
            </TooltipContent>
          </Tooltip>
          <div className="w-px h-5 bg-n-5 mx-2" />

          {/* Upgrade Plan CTA */}
          <button
            className="inline-flex items-center justify-center px-3 h-8 text-[12px] font-semibold text-n-1 dark:text-n-1 bg-b-8 border border-b-9 rounded-[5px] hover:bg-b-7 dark:hover:bg-b-6 active:scale-95 transition-all tracking-tight whitespace-nowrap shadow-sm hover:shadow-md"
          >
            Actualizar
          </button>

          <div className="w-px h-5 bg-n-5 mx-2" />

          {/* Avatar Menu Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-7 h-7 rounded-full bg-n-3 border-[1.5px] border-n-4 dark:bg-n-5 dark:border-n-6 shadow-[0_0_0_1px_var(--n-5)] dark:shadow-[0_0_0_1px_var(--n-6)] hover:shadow-[0_0_0_1px_var(--n-6),0_2px_8px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_0_1px_var(--n-7),0_2px_8px_rgba(0,0,0,0.2)] transition-all outline-none">
                <span className="text-[10px] font-bold text-n-11 dark:text-n-12 leading-none">
                  {initials}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-lg shadow-2xl border-n-5 p-0 bg-popover overflow-hidden mt-2">
              {/* Profile Header */}
              <div className="flex gap-3 p-3.5 border-b border-n-4 items-start">
                <div className="w-10 h-10 rounded-full bg-n-2 dark:bg-n-4 flex items-center justify-center shrink-0 shadow-sm border border-n-3 dark:border-n-5">
                  <span className="text-sm font-bold text-n-10 dark:text-n-11">{initials}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="text-[13px] font-bold text-n-12 truncate leading-tight mb-0.5">{displayName}</div>
                  <div className="text-[12px] text-n-8 truncate mb-1">{user?.email}</div>
                  {!emailConfirmed && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-warning/10 border border-warning/30 text-warning text-[11px] font-semibold w-fit mb-1.5">
                      <AlertCircle size={11} strokeWidth={2.5} />
                      <span>Email no confirmado</span>
                    </div>
                  )}
                  <div className="text-[11px] text-n-8 mono uppercase tracking-tight">{specialty}</div>
                </div>
              </div>

              <div className="p-1">
                <DropdownMenuItem onClick={() => router.push('/settings')} className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-n-10 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-2 hover:text-n-12 cursor-pointer transition-colors">
                  <UserIcon size={16} className="text-n-8" strokeWidth={1.8} />
                  <span>Mi perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings?tab=preferences')} className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-n-10 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-2 hover:text-n-12 cursor-pointer transition-colors">
                  <Settings size={16} className="text-n-8" strokeWidth={1.8} />
                  <span>Preferencias</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings?tab=billing')} className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-n-10 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-2 hover:text-n-12 cursor-pointer transition-colors">
                  <CreditCard size={16} className="text-n-8" strokeWidth={1.8} />
                  <span>Facturación</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings?tab=organization')} className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-n-10 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-2 hover:text-n-12 cursor-pointer transition-colors">
                  <Building2 size={16} className="text-n-8" strokeWidth={1.8} />
                  <span>Gestionar organización</span>
                </DropdownMenuItem>
              </div>

              <div className="h-px bg-n-4 dark:bg-n-5 mx-1.5 my-1" />

              <div className="p-1">
                <DropdownMenuItem
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-n-10 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-2 hover:text-n-12 cursor-pointer transition-colors"
                >
                  {/* Icono: Sol si está en dark (para cambiar a light), Luna si está en light (para cambiar a dark) */}
                  {mounted ? (
                    theme === 'dark' ? (
                      <Sun size={16} className="text-n-8" strokeWidth={1.8} />
                    ) : (
                      <Moon size={16} className="text-n-8" strokeWidth={1.8} />
                    )
                  ) : (
                    <Moon size={16} className="text-n-8" strokeWidth={1.8} />
                  )}
                  <span>{mounted ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : 'Modo'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-n-10 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-2 hover:text-n-12 cursor-pointer transition-colors">
                  <Keyboard size={16} className="text-n-8" strokeWidth={1.8} />
                  <span>Atajos de teclado</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-n-10 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-2 hover:text-n-12 cursor-pointer transition-colors">
                  <BookOpen size={16} className="text-n-8" strokeWidth={1.8} />
                  <span>Documentación</span>
                </DropdownMenuItem>
              </div>

              <div className="h-px bg-n-4 dark:bg-n-5 mx-1.5 my-1" />

              <div className="p-1">
                <DropdownMenuItem
                  onClick={async () => await signOut()}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-semibold text-n-10 dark:text-n-11 hover:bg-n-3 dark:hover:bg-n-2 hover:text-n-12 cursor-pointer transition-colors"
                >
                  <LogOut size={16} className="text-n-8" strokeWidth={1.8} />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ══ CUERPO ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <IconRail />
        <SecondarySidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <SubHeader />
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
