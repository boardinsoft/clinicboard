'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import type { Patient } from '@/lib/fhir/types';
import TableSearch from '@/components/ui/TableSearch';

interface PatientsListViewProps {
  patients: Patient[];
  totalItems: number;
  selectedPatientForPreview?: Patient | null;
  onSelectPatientForPreview?: (p: Patient | null) => void;
}

interface PatientIdentifier {
  value?: string;
  system?: string;
}

interface PatientTelecom {
  system: string;
  value: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCI(p: Patient): string {
  return Array.isArray(p.identifiers)
    ? (p.identifiers as PatientIdentifier[])[0]?.value ?? '—'
    : '—';
}

function getPhone(p: Patient): string {
  return Array.isArray(p.telecom)
    ? (p.telecom as PatientTelecom[]).find(t => t.system === 'phone')?.value ?? '—'
    : '—';
}

function getFullName(p: Patient): string {
  return `${p.name_given?.join(' ') ?? ''} ${p.name_family ?? ''}`.trim();
}

function calcAge(birthDate?: string): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} años`;
}

function getGenderLabel(gender?: string): string {
  switch (gender) {
    case 'male': return 'Masc.';
    case 'female': return 'Fem.';
    default: return 'Otro';
  }
}

export default function PatientsListView({ 
  patients, 
  totalItems, 
  selectedPatientForPreview,
  onSelectPatientForPreview 
}: PatientsListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Pagination & Filters State
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 20;
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || 'all';
  const gender = searchParams.get('gender') || 'all';

  const totalPages = Math.ceil(totalItems / pageSize);

  const updateParams = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSelectPatient = (p: Patient) => {
    if (typeof onSelectPatientForPreview !== 'function') return;
    if (selectedPatientForPreview?.id === p.id) {
      onSelectPatientForPreview(null);
    } else {
      onSelectPatientForPreview(p);
    }
  };

  const filteredPatients = patients; // Assume filtered by server

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden border-r border-border/40">
      {/* ── Toolbar / Filtros ── */}
      <TableSearch 
        value={q} 
        onChange={(val) => updateParams({ q: val, page: 1 })}
        filters={{ status, gender }}
        onFilterChange={(key, val) => updateParams({ [key]: val, page: 1 })}
        onNewRecord={() => router.push('/patients/new')}
        placeholder="Buscar paciente por nombre o CI..."
        hasFilters={q !== '' || status !== 'all' || gender !== 'all'}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="table-clinic">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="w-12 text-center">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded border-border/60 accent-primary" />
                </th>
                <th>Paciente</th>
                <th>Identificación</th>
                <th>Género</th>
                <th>Edad</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th className="w-20 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                      <AlertCircle className="w-8 h-8 opacity-20" />
                      <span className="text-sm font-medium">No se encontraron pacientes</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.map((p) => {
                const isSelected = selectedPatientForPreview?.id === p.id;
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "group cursor-pointer transition-colors relative",
                      isSelected && "bg-brand-8/[0.03] z-10"
                    )}
                    onClick={() => handleSelectPatient(p)}
                  >
                    <td className="text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="h-3.5 w-3.5 rounded border-border/60 accent-primary" />
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-8 z-30" />}
                    </td>
                    <td>
                      <span className={cn(
                        "table-name truncate block",
                        isSelected ? "text-brand-8" : "group-hover:text-brand-8 transition-colors"
                      )}>
                        {getFullName(p)}
                      </span>
                    </td>
                    <td className="mono">{getCI(p)}</td>
                    <td className="font-medium text-neutral-9">{getGenderLabel(p.gender)}</td>
                    <td className="mono">{calcAge(p.birth_date)}</td>
                    <td className="mono">{getPhone(p)}</td>
                    <td>
                      <Badge variant={p.active !== false ? 'pill-success' : 'pill-neutral'}>
                        {p.active !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2 pr-2">
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={(e) => { e.stopPropagation(); router.push(`/patients/${p.id}`); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-neutral-3 rounded text-neutral-8 hover:text-brand-8 transition-all"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-[11px] font-medium py-1 px-2">Expandir registro</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <ChevronRight className={cn(
                          "w-3.5 h-3.5 transition-all duration-200",
                          isSelected ? "text-brand-8 opacity-100 translate-x-0" : "text-neutral-7 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                        )} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Footer / Paginación ── */}
        <div className="flex items-center justify-between px-6 py-2 h-12 border-t border-border bg-neutral-1 shrink-0 font-sans">
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-neutral-8 font-bold uppercase tracking-widest">
              Total: <span className="text-foreground">{totalItems}</span> registros
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-neutral-8">
            <div className="flex items-center gap-1 bg-white dark:bg-neutral-2 border border-border rounded-md px-2 py-1 shadow-xs">
              <span>Página <span className="text-foreground">{page}</span> de <span className="text-foreground">{Math.max(totalPages, 1)}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 bg-white dark:bg-neutral-2 shadow-xs hover:bg-neutral-2 dark:hover:bg-neutral-3 transition-all border-border" 
                disabled={page <= 1} 
                onClick={() => updateParams({ page: page - 1 })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 bg-white dark:bg-neutral-2 shadow-xs hover:bg-neutral-2 dark:hover:bg-neutral-3 transition-all border-border" 
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
