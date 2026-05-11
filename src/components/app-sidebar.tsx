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
    title: 'Historia Clínica',
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

const SIDEBAR_TOOLTIP_CONTENT = {
  side: 'right' as const,
  sideOffset: 12,
  className: 'text-[11px] font-medium bg-n-11 text-n-1 border-n-10 rounded-[5px] shadow-xl animate-in fade-in zoom-in-95 duration-100 dark:bg-n-4 dark:text-n-10 dark:border-n-6 dark:shadow-xl/80',
};

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
      className="flex flex-col h-full py-2"
      data-sidebar="sidebar"
      {...props}
    >
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto" style={{ color: 'var(--sidebar-foreground)' }}>
        <SidebarGroup className="px-2 -mt-[9px]">
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
                          'w-full h-8 px-2 relative',
                          hasSubItems && 'cursor-pointer',
                          isActive && 'bg-b-2/50 text-b-8',
                          'hover:bg-n-3 focus-visible:ring-2 focus-visible:ring-b-8/50 focus-visible:ring-inset',
                          'transition-colors duration-150'
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-b-8 rounded-r-[3px]" />
                        )}
                        <item.icon size={16} strokeWidth={1.8} className={cn(!isActive && 'text-n-8')} />
                        <span className="truncate text-[13px]">{item.title}</span>
                        {hasSubItems && (
                          <ChevronRight className="ml-auto size-3 transition-transform duration-200 ease-out group-data-[state=open]/collapsible:rotate-90" />
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
                                  className={cn(
                                    'h-7 text-[13px]',
                                    isSubActive && 'bg-b-2/50 text-b-8 font-medium',
                                    'hover:bg-n-3 focus-visible:ring-2 focus-visible:ring-b-8/50 focus-visible:ring-inset',
                                    'transition-colors duration-150'
                                  )}
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
        className="px-2 pt-1 shrink-0"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className={cn(
                'flex items-center gap-2 w-full h-8 px-2 rounded-[6px]',
                'text-n-8 hover:bg-n-3 hover:text-n-11',
                'focus-visible:ring-2 focus-visible:ring-b-8/50 focus-visible:ring-inset',
                'transition-all duration-150',
                'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:mx-auto'
              )}
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftClose size={16} strokeWidth={1.8} />
              ) : (
                <>
                  <ChevronRight size={16} strokeWidth={1.8} className="rotate-180" />
                  <span className="text-[13px] group-data-[collapsible=icon]:hidden">Colapsar</span>
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent {...SIDEBAR_TOOLTIP_CONTENT}>
            {isCollapsed ? 'Expandir' : 'Colapsar'}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}