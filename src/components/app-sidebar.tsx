'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Home,
  Users,
  Notebook,
  History,
  FileText,
  ChevronRight,
  UserPlus,
  CalendarDays,
  CheckSquare,
  FileSearch,
  Pill,
  PanelLeftClose,
  type LucideIcon,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: {
    title: string;
    url: string;
  }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Tablero',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'Pacientes',
    url: '/patients',
    icon: Users,
    items: [
      { title: 'Todos los pacientes', url: '/patients' },
      { title: 'Nuevo registro', url: '/patients/new' },
    ],
  },
  {
    title: 'Citas',
    url: '/appointments',
    icon: Notebook,
    items: [
      { title: 'Agenda', url: '/appointments' },
      { title: 'Cola de espera', url: '/appointments?view=queue' },
    ],
  },
  {
    title: 'Historia',
    url: '/history/all',
    icon: History,
    items: [
      { title: 'Todas las consultas', url: '/history/all' },
    ],
  },
  {
    title: 'Recetas',
    url: '/prescriptions',
    icon: FileText,
    items: [
      { title: 'Todas las recetas', url: '/prescriptions' },
      { title: 'Recetas activas', url: '/prescriptions?filter=active' },
    ],
  },
];

function getActiveItem(pathname: string): string {
  for (const item of NAV_ITEMS) {
    if (item.url === '/dashboard') {
      if (pathname === '/dashboard' || pathname.endsWith('/dashboard')) {
        return item.title;
      }
    } else if (pathname.includes(item.url.split('?')[0].replace('/dashboard', ''))) {
      return item.title;
    }
  }
  return 'Tablero';
}

export function AppSidebar({ ...props }: React.ComponentProps<'div'>) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { state, toggleSidebar } = useSidebar();
  const activeItemTitle = getActiveItem(pathname);
  const isCollapsed = state === 'collapsed';

  const handleNavigation = (url: string) => {
    if (url.startsWith('/')) {
      router.push(`/${url.replace(/^\//, '')}`);
    } else {
      router.push(url);
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      data-sidebar="sidebar"
      {...props}
    >
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2" style={{ color: 'var(--sidebar-foreground)' }}>
        <SidebarGroup className="px-2">
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const isActive = item.title === activeItemTitle;
              const hasSubItems = item.items && item.items.length > 0;

              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isActive && hasSubItems}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        onClick={() => !hasSubItems && handleNavigation(item.url)}
                        className={cn(
                          'w-full',
                          hasSubItems && 'cursor-pointer'
                        )}
                      >
                        <item.icon size={18} strokeWidth={1.8} />
                        <span className="truncate">{item.title}</span>
                        {hasSubItems && (
                          <ChevronRight className="ml-auto transition-transform duration-200 size-4 group-data-[state=open]/collapsible:rotate-90" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {hasSubItems && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const isSubActive = pathname === subItem.url || (subItem.url.includes('?') && pathname.startsWith(subItem.url.split('?')[0]));
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  isActive={isSubActive}
                                  onClick={() => handleNavigation(subItem.url)}
                                >
                                  <span>{subItem.title}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </div>

      {/* Collapse button */}
      <div
        className="p-2 shrink-0"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className="flex items-center gap-2 w-full h-9 px-3 rounded-[6px] transition-colors duration-100 hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
              style={{ color: 'var(--sidebar-foreground)' }}
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftClose size={17} strokeWidth={1.8} />
              ) : (
                <>
                  <ChevronRight size={17} strokeWidth={1.8} className="rotate-180" />
                  <span className="text-sm transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">Colapsar</span>
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={12}
            className="text-[11px] font-medium bg-n-11 text-n-1 dark:bg-n-4 dark:text-n-10 border-n-10 dark:border-n-6 rounded-[5px] shadow-xl"
          >
            {isCollapsed ? 'Expandir' : 'Colapsar'}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}