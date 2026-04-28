'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/db/client';
import type { Practitioner } from '@/types/database.types';
import { cn } from '@/lib/utils';

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
  HelpCircle,
  Building2,
  ChevronDown,
  Plus,
  Globe,
  ShieldCheck,
  Settings,
  Pill,
  Database,
  CreditCard,
  Keyboard,
  BookOpen,
  User as UserIcon,
  Sparkles,
  ChevronsUpDown,
  Activity,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppShellServerProps {
    user: { id: string; email: string; name: string };
    practitioner: Practitioner;
    clinics: { id: string; name: string; slug: string }[];
    children: React.ReactNode;
}

interface Clinic {
    id: string;
    name: string;
    slug: string;
}

const navMain = [
    { href: '/', label: 'Tablero', icon: Home },
    { href: '/patients', label: 'Pacientes', icon: Users },
    { href: '/appointments', label: 'Citas', icon: Notebook },
    { href: '/history', label: 'Historia', icon: History },
    { href: '/prescriptions', label: 'Recetas', icon: FileText },
];

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
                        <span className="absolute top-[5px] right-[5px] w-[7px] h-[7px] bg-warning rounded-full border-[1.5px] border-n-1 animate-pulse-dot" />
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

function IconRail({ pathname }: { pathname: string }) {
    const router = useRouter();

    return (
        <aside
            className="flex flex-col items-center w-[56px] h-full bg-n-1 dark:bg-n-12 shrink-0 z-20 border-r border-border/40 py-[10px]"
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
                                        onClick={() => router.push(item.href)}
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
        </aside>
    );
}

export function AppShellServer({ user, practitioner, clinics, children }: AppShellServerProps) {
    const pathname = usePathname() || '/';
    const { theme, setTheme } = useTheme();

    const [mounted, setMounted] = useState(false);
    const [activeClinic, setActiveClinic] = useState<Clinic | null>(null);
    const [clinicDropdownOpen, setClinicDropdownOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
    const clinicDropdownRef = useRef<HTMLDivElement>(null);

    const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';
    const initials = displayName.charAt(0).toUpperCase();
    const specialty = practitioner?.specialty || 'General';
    const prefix = practitioner?.gender === 'female' ? 'Dra.' : 'Dr.';

    useEffect(() => {
        setMounted(true);
        const storedClinic = localStorage.getItem('activeClinic');
        if (storedClinic) {
            try {
                const parsed = JSON.parse(storedClinic);
                if (clinics.some(c => c.id === parsed.id)) {
                    setActiveClinic(parsed);
                } else if (clinics.length > 0) {
                    const firstClinic = clinics[0];
                    setActiveClinic(firstClinic);
                    localStorage.setItem('activeClinic', JSON.stringify(firstClinic));
                }
            } catch {
                if (clinics.length > 0) {
                    const firstClinic = clinics[0];
                    setActiveClinic(firstClinic);
                    localStorage.setItem('activeClinic', JSON.stringify(firstClinic));
                }
            }
        } else if (clinics.length > 0) {
            const firstClinic = clinics[0];
            setActiveClinic(firstClinic);
            localStorage.setItem('activeClinic', JSON.stringify(firstClinic));
        }
    }, [clinics]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (clinicDropdownRef.current && !clinicDropdownRef.current.contains(event.target as Node)) {
                setClinicDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    const handleClinicSelect = (clinic: Clinic) => {
        setActiveClinic(clinic);
        localStorage.setItem('activeClinic', JSON.stringify(clinic));
        setClinicDropdownOpen(false);
        window.dispatchEvent(new CustomEvent('clinicChanged', { detail: clinic }));
    };

    const handleLogout = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/sign-in";
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    if (!mounted) {
        return <div className="h-screen bg-background" />;
    }

    return (
        <TooltipProvider>
        <div className="flex flex-col w-full h-screen overflow-hidden bg-background text-foreground">

            <header className="flex items-center h-12 border-b border-border px-4 shrink-0 bg-n-1 z-30">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-b-8 shadow-sm">
                            <Stethoscope className="w-4 h-4 text-white" strokeWidth={2.2} />
                        </div>
                        <span className="text-[13px] font-bold tracking-tight text-n-12 select-none">
                            ClinicBoard
                        </span>
                    </div>
                    <div className="w-px h-4 bg-n-5 mx-2" />
                    <div ref={clinicDropdownRef} className="relative">
                        <DropdownMenu open={clinicDropdownOpen} onOpenChange={setClinicDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-[5px] hover:bg-n-3 transition-all outline-none">
                                    <Building2 size={13} className="text-n-9" strokeWidth={1.8} />
                                    <span className="text-[13px] font-medium text-n-11 truncate max-w-[160px]">
                                        {activeClinic?.name || 'Sin clínica'}
                                    </span>
                                    <ChevronsUpDown size={12} className="text-n-8 ml-0.5" strokeWidth={2} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-60">
                                {clinics.map((clinic) => (
                                    <DropdownMenuItem key={clinic.id} onClick={() => handleClinicSelect(clinic)}>
                                        {clinic.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-1.5 shrink-0">
                    <IconBtn icon={Bell} label="Notificaciones" showDot />
                    <div className="w-px h-5 bg-n-5 mx-2" />
                    
                    <DropdownMenu open={isAvatarMenuOpen} onOpenChange={setIsAvatarMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center w-7 h-7 rounded-full bg-n-3 border-[1.5px] border-n-4 outline-none">
                                <span className="text-[10px] font-bold text-n-11">{initials}</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <div className="p-3 border-b">
                                <div className="text-[13px] font-bold">{displayName}</div>
                                <div className="text-[12px] text-n-8">{user?.email}</div>
                            </div>
                            <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                            <DropdownMenuSeparator />
                            <div className="p-1">
                                <DropdownMenuItem 
                                    onClick={handleLogout}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                                >
                                    <LogOut size={16} strokeWidth={1.8} />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </div>
                    </DropdownMenu>
                </div>
            </header>

            <div className="flex flex-1 min-h-0 overflow-hidden">
                <IconRail pathname={pathname} />
                <main className="flex-1 overflow-y-auto bg-background p-6">
                    {children}
                </main>
            </div>
        </div>
        </TooltipProvider>
    );
}