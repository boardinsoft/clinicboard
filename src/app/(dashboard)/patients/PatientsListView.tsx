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
import type { Tables } from '@/types/database.types';
import type { Patient as PatientRow } from '@/types/database.types';
import TableSearch from '@/components/ui/TableSearch';

interface PatientsListViewProps {
  patients: Tables<'patients'>[];
  totalItems: number;
  page?: number;
  pageSize?: number;
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
function getCI(p: PatientRow): string {
  return Array.isArray(p.identifiers)
    ? (p.identifiers as unknown as PatientIdentifier[])[0]?.value ?? '—'
    : '—';
}

function getPhone(p: PatientRow): string {
  return Array.isArray(p.telecom)
    ? (p.telecom as unknown as PatientTelecom[]).find(t => t.system === 'phone')?.value ?? '—'
    : '—';
}

function getFullName(p: PatientRow): string {
  return `${p.name_given?.join(' ') ?? ''} ${p.name_family ?? ''}`.trim();
}

function calcAge(birthDate?: string | null): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} años`;
}

function getGenderLabel(gender?: string | null): string {
  switch (gender) {
    case 'male': return 'Masc.';
    case 'female': return 'Fem.';
    default: return 'Otro';
  }
}

export default function PatientsListView({
  patients,
  totalItems,
  page = 1,
  pageSize = 20
}: PatientsListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const handleSelectPatient = (p: PatientRow) => {
    router.push(`/patients/${p.id}`);
  };

  const filteredPatients = patients;

  return (
    <div className="flex flex-col h-full min-w-0 bg-background overflow-hidden border-r border-border/40">
      <TableSearch
        value={q}
        onChange={(val) => updateParams({ q: val, page: 1 })}
        filters={{ status, gender }}
        onFilterChange={(key, val) => updateParams({ [key]: val, page: 1 })}
        onNewRecord={() => router.push('/patients/new')}
        placeholder="Buscar paciente por nombre o CI..."
        hasFilters={q !== '' || status !== 'all' || gender !== 'all'}
      />

      <div className="flex-1 flex flex-col min-h-0">
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
              ) : filteredPatients.map((p) => (
                <tr
                  key={p.id}
                  className="group cursor-pointer transition-colors relative"
                  onClick={() => handleSelectPatient(p)}
                >
                  <td className="text-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-border/60 accent-primary" />
                  </td>
                  <td>
                    <span className="table-name truncate block group-hover:text-primary transition-colors">
                      {getFullName(p)}
                    </span>
                  </td>
                  <td className="mono">{getCI(p)}</td>
                  <td className="font-medium text-foreground">{getGenderLabel(p.gender)}</td>
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
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-all"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-[11px] font-medium py-1 px-2">Expandir registro</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <ChevronRight className="w-3.5 h-3.5 transition-all duration-200 text-muted-foreground/40 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-3 h-14 border-t border-border bg-background shrink-0 font-sans">
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
            Total: <span className="text-foreground">{totalItems}</span> registros
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
          <div className="flex items-center gap-1 bg-muted border border-border rounded-md px-2 py-1 shadow-xs">
            <span>Página <span className="text-foreground">{page}</span> de <span className="text-foreground">{Math.max(totalPages, 1)}</span></span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background shadow-xs hover:bg-muted transition-all border-border"
              disabled={page <= 1}
              onClick={() => updateParams({ page: page - 1 })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background shadow-xs hover:bg-muted transition-all border-border"
              disabled={page * pageSize >= totalItems}
              onClick={() => updateParams({ page: page + 1 })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}