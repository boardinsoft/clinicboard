'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLayoutStore } from '@/store/useLayoutStore';
import { usePatientStore } from '@/store/usePatientStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Patient } from '@/types/database.types';
import { calcAge, getGenderLabel } from '@/lib/clinical';
import TableSearch from '@/components/ui/TableSearch';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ArrowUpDown,
  Search,
  Plus,
} from 'lucide-react';

import PatientsSidebar from './PatientsSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PatientTelecom, PatientIdentifier } from '@/types/patient-jsonb';

interface PatientFilters {
  status: 'all' | 'active' | 'inactive';
  gender: 'all' | 'male' | 'female' | 'other';
  q: string;
}

interface PatientsListViewProps {
  patients: Patient[];
  totalItems: number;
  page: number;
  pageSize: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCI(p: Patient): string {
  try {
    const identifiers = typeof p.identifiers === 'string'
      ? JSON.parse(p.identifiers)
      : p.identifiers;
    return Array.isArray(identifiers)
      ? (identifiers as PatientIdentifier[])[0]?.value ?? '—'
      : '—';
  } catch {
    return '—';
  }
}

function getPhone(p: Patient): string {
  try {
    const telecom = typeof p.telecom === 'string'
      ? JSON.parse(p.telecom)
      : p.telecom;
    return Array.isArray(telecom)
      ? telecom.find(t => t.system === 'phone')?.value ?? '—'
      : '—';
  } catch {
    return '—';
  }
}

function getInitials(p: Patient): string {
  const first = p.name_given?.[0]?.[0] ?? '';
  const last = p.name_family?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

function getFullName(p: Patient): string {
  return `${p.name_given?.join(' ') ?? ''} ${p.name_family ?? ''}`.trim();
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PatientsListView({ patients, totalItems, page, pageSize }: PatientsListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setSecondaryPanel, setRightPanelOpen } = useLayoutStore();
  const { selectedPatientForPreview, setSelectedPatientForPreview } = usePatientStore();

  const [localQ, setLocalQ] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<PatientFilters>({
    status: 'all',
    gender: 'all',
    q: searchParams.get('q') || '',
  });

  // Estado para anchos de columna
  const [colWidths, setColWidths] = useState({
    name: 280,
    ci: 140,
    gender: 100,
    age: 80,
    phone: 140,
    status: 120
  });

  const startResizing = useCallback((col: keyof typeof colWidths, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = colWidths[col];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.pageX - startX;
      const newWidth = Math.max(60, startWidth + deltaX);
      setColWidths(prev => ({ ...prev, [col]: newWidth }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  }, [colWidths]);

  const updateParams = useCallback((updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
      else params.delete(key);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const filteredPatients = patients.filter(p => {
    if (filters.status === 'active' && p.active === false) return false;
    if (filters.status === 'inactive' && p.active !== false) return false;
    if (filters.gender !== 'all' && p.gender !== filters.gender) return false;
    if (localQ) {
      const q = localQ.toLowerCase();
      const name = getFullName(p).toLowerCase();
      const ci = getCI(p).toLowerCase();
      if (!name.includes(q) && !ci.includes(q)) return false;
    }
    return true;
  });

  const handleSelectPatient = useCallback((p: Patient) => {
    if (selectedPatientForPreview?.id === p.id) {
        setSelectedPatientForPreview(null);
        setRightPanelOpen(false);
    } else {
        setSelectedPatientForPreview(p);
        setRightPanelOpen(true);
    }
  }, [selectedPatientForPreview, setSelectedPatientForPreview, setRightPanelOpen]);

  useEffect(() => {
    setSecondaryPanel(<PatientsSidebar />, 'Pacientes');
  }, [setSecondaryPanel]);

  const totalPages = Math.ceil(totalItems / pageSize);
  const hasFilters = filters.status !== 'all' || filters.gender !== 'all' || localQ !== '';

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="flex flex-col h-full bg-background font-sans overflow-hidden">
      
      {/* ── SubHeader plano estilo Supabase (Blanco) ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0 bg-background">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Pacientes
          </h1>
          <p className="text-xs text-muted-foreground/70 font-medium">
            Gestión integral de expedientes clínicos y datos demográficos.
          </p>
        </div>
        <div className="flex items-center gap-2">
           {/* El botón de acción principal ahora está en la toolbar */}
        </div>
      </div>

      {/* ── Barra de herramientas (Search/Filters - Gris) ── */}
      <TableSearch 
        value={localQ}
        onChange={setLocalQ}
        hasFilters={hasFilters}
        filters={filters}
        onFilterChange={handleFilterChange}
        onNewRecord={() => router.push('/patients/new')}
        placeholder="Buscar por nombre o cédula..."
        className="px-2"
      />

      <div className="flex-1 overflow-hidden flex flex-col bg-muted/10">
        <div className="flex-1 overflow-auto min-h-0 scrollbar-thin transition-all relative bg-transparent">
          <table className="w-full border-separate border-spacing-0 table-fixed bg-transparent">
            <thead className="sticky top-0 z-30 bg-muted/40 backdrop-blur-md">
              <tr>
                <th className="w-12 h-10 border-r border-b border-border px-0 text-center sticky left-0 z-40 bg-muted shadow-[1px_0_0_0_inset_rgba(0,0,0,0.1)]">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded border-border/60 accent-primary" />
                </th>
                <th style={{ width: colWidths.name }} className="h-10 border-r border-b border-border px-4 text-left text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 relative group/header font-sans bg-muted/50 cursor-pointer hover:text-foreground transition-colors">
                    <div className="flex items-center gap-2">
                      Paciente 
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity" />
                    </div>
                    <div
                      onMouseDown={(e) => startResizing('name', e)}
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 z-30 transition-colors duration-100"
                    />
                </th>
                <th style={{ width: colWidths.ci }} className="h-10 border-r border-b border-border px-4 text-left text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 relative group/header font-sans bg-muted/50 cursor-pointer hover:text-foreground transition-colors">
                    <div className="flex items-center gap-2">
                      Cédula 
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity" />
                    </div>
                    <div
                      onMouseDown={(e) => startResizing('ci', e)}
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 z-30 transition-colors duration-100"
                    />
                </th>
                <th style={{ width: colWidths.gender }} className="h-10 border-r border-b border-border px-4 text-left text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 relative group/header font-sans bg-muted/50 cursor-pointer hover:text-foreground transition-colors">
                    <div className="flex items-center gap-2">
                      Género 
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity" />
                    </div>
                    <div
                      onMouseDown={(e) => startResizing('gender', e)}
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 z-30 transition-colors duration-100"
                    />
                </th>
                <th style={{ width: colWidths.age }} className="h-10 border-r border-b border-border px-4 text-left text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 relative group/header font-sans bg-muted/50 cursor-pointer hover:text-foreground transition-colors">
                    <div className="flex items-center gap-2">
                      Edad 
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity" />
                    </div>
                    <div
                      onMouseDown={(e) => startResizing('age', e)}
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 z-30 transition-colors duration-100"
                    />
                </th>
                <th style={{ width: colWidths.phone }} className="h-10 border-r border-b border-border px-4 text-left text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 relative group/header font-sans bg-muted/50 cursor-pointer hover:text-foreground transition-colors">
                    <div className="flex items-center gap-2">
                      Teléfono 
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity" />
                    </div>
                    <div
                      onMouseDown={(e) => startResizing('phone', e)}
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 z-30 transition-colors duration-100"
                    />
                </th>
                <th style={{ width: colWidths.status }} className="h-10 border-r border-b border-border px-4 text-left text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 relative group/header font-sans bg-muted/50 cursor-pointer hover:text-foreground transition-colors">
                    <div className="flex items-center gap-2">
                      Estado 
                      <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/header:opacity-100 transition-opacity" />
                    </div>
                    <div
                      onMouseDown={(e) => startResizing('status', e)}
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 z-30 transition-colors duration-100"
                    />
                </th>
                <th className="min-w-[100px] h-10 border-b border-border px-4 relative bg-muted/50"></th>
              </tr>
            </thead>
            <tbody className="bg-background font-sans">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-32 text-center border-b border-r border-border font-sans bg-background">
                    <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center border border-dashed border-border">
                        <Search className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground">No se encontraron pacientes</h3>
                        <p className="text-[12px] text-muted-foreground max-w-[280px] mx-auto">
                          No hay resultados que coincidan con tu búsqueda actual. Prueba con otros términos o registra un nuevo paciente.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-2 font-bold text-[11px] mt-2 shadow-sm"
                        onClick={() => router.push('/patients/new')}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Nuevo Paciente
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.map((p) => {
                const isSelected = selectedPatientForPreview?.id === p.id;
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "group transition-all duration-75 even:bg-muted/[0.01] cursor-pointer border-b border-border/40",
                      isSelected ? "bg-primary/[0.04] z-10 relative" : "hover:bg-muted/30 dark:hover:bg-muted/20"
                    )}
                    onClick={() => handleSelectPatient(p)}
                  >
                    <td className={cn(
                      "h-12 border-r border-border text-center px-0 sticky left-0 z-20 transition-colors",
                      isSelected ? "bg-primary/[0.08]" : "bg-background group-hover:bg-muted/30 dark:group-hover:bg-muted/20"
                    )} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="h-3.5 w-3.5 rounded border-border/60 accent-primary" />
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary z-30" />}
                    </td>
                    <td className="h-12 border-r border-border px-4 overflow-hidden">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-md border border-border/50 shadow-sm">
                          <AvatarFallback className="bg-muted text-[10px] font-bold text-muted-foreground">
                            {getInitials(p)}
                          </AvatarFallback>
                        </Avatar>
                        <span className={cn(
                          "text-sm truncate font-sans",
                          isSelected ? "text-primary font-bold" : "text-foreground font-medium group-hover:text-primary transition-colors duration-100"
                        )}>
                          {getFullName(p)}
                        </span>
                      </div>
                    </td>
                    <td className="h-12 border-r border-border px-4 text-[12px] text-muted-foreground/80 font-mono font-medium">{getCI(p)}</td>
                    <td className="h-12 border-r border-border px-4 text-[13px] text-muted-foreground font-sans font-medium">{getGenderLabel(p.gender)}</td>
                    <td className="h-12 border-r border-border px-4 text-[13px] text-muted-foreground tabular-nums font-sans font-medium">{calcAge(p.birth_date)}</td>
                    <td className="h-12 border-r border-border px-4 text-[12px] text-muted-foreground/80 tabular-nums font-sans font-medium">{getPhone(p)}</td>
                    <td className="h-12 border-r border-border px-4">
                      <Badge variant={p.active !== false ? 'pill-success' : 'pill-muted'} className="text-[10px] font-bold font-sans px-1.5 h-5 uppercase tracking-wider">
                        {p.active !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="h-12 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={(e) => { e.stopPropagation(); router.push(`/patients/${p.id}`); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted/50 rounded text-muted-foreground hover:text-primary transition-all duration-100"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-[11px] font-medium py-1 px-2 font-sans">Expandir registro</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <ChevronRight className={cn(
                          "w-3.5 h-3.5 transition-all duration-200",
                          isSelected ? "text-primary opacity-100 translate-x-0" : "text-muted-foreground/40 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                        )} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-2 h-12 border-t border-border bg-background shrink-0 font-sans">
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
              Total: <span className="text-foreground">{totalItems}</span> registros
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground font-sans">
            <div className="flex items-center gap-1 bg-muted/30 border border-border rounded-md px-2 py-1 shadow-sm">
              <span>Página <span className="text-foreground">{page}</span> de <span className="text-foreground">{Math.max(totalPages, 1)}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 bg-background shadow-sm hover:bg-muted transition-all border-border/60" 
                disabled={page <= 1} 
                onClick={() => updateParams({ page: page - 1 })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 bg-background shadow-sm hover:bg-muted transition-all border-border/60" 
                disabled={page * pageSize >= totalItems} 
                onClick={() => updateParams({ page: page + 1 })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
