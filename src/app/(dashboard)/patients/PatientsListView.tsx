'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import type { Patient } from '@/types/database.types';
import { usePatientSearch } from '@/hooks/usePatientSearch';

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
    ? (p.identifiers as unknown as PatientIdentifier[])[0]?.value ?? '—'
    : '—';
}

function getPhone(p: Patient): string {
  return Array.isArray(p.telecom)
    ? (p.telecom as unknown as PatientTelecom[]).find(t => t.system === 'phone')?.value ?? '—'
    : '—';
}

function getFullName(p: Patient): string {
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

export default function PatientsListView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get('q') || '';
  const urlPage = parseInt(searchParams.get('page') || '1');

  const {
    patients,
    isLoading,
    error,
    total,
    query,
    setQuery,
    totalPages,
    currentPage,
    setPage,
  } = usePatientSearch({
    pageSize: 10,
    debounceMs: 300,
  });

  // Sync initial query from URL
  useEffect(() => {
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [urlQuery]);

  // Sync query changes to URL
  useEffect(() => {
    if (query !== urlQuery) {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [query]);

  // Sync page changes to URL
  useEffect(() => {
    if (urlPage !== currentPage) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(currentPage));
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [currentPage]);

  const handleSelectPatient = (p: Patient) => {
    router.push(`/patients/${p.id}`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full min-w-0 bg-background overflow-hidden border-r border-border/40">
      {/* ── Search Header ── */}
      <div className="shrink-0 border-b border-border/40 bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Buscar paciente por nombre o cédula..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9 pr-4 bg-muted/50 border-border/60 text-sm"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Button
            variant="default"
            size="sm"
            className="h-9 px-4 bg-b-8 hover:bg-b-9 text-white font-medium"
            onClick={() => router.push('/patients/new')}
          >
            <span className="mr-1">+</span> Nuevo Paciente
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto no-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-destructive gap-2">
              <AlertCircle className="w-8 h-8" />
              <span className="text-sm font-medium">Error al cargar pacientes</span>
              <span className="text-xs text-muted-foreground">{error}</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/50 gap-2">
              <AlertCircle className="w-8 h-8 opacity-20" />
              <span className="text-sm font-medium">
                {query ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
              </span>
              {query && (
                <span className="text-xs text-muted-foreground">
                  Prueba con otro nombre o número de cédula
                </span>
              )}
            </div>
          ) : (
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
                {patients.map((p) => (
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
          )}
        </div>
      </div>

      {/* ── Pagination Footer ── */}
      <div className="flex items-center justify-between px-6 py-3 h-14 border-t border-border bg-background shrink-0 font-sans">
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
            Total: <span className="text-foreground">{total}</span> registros
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
          <div className="flex items-center gap-1 bg-muted border border-border rounded-md px-2 py-1 shadow-xs">
            <span>Página <span className="text-foreground">{currentPage}</span> de <span className="text-foreground">{Math.max(totalPages, 1)}</span></span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background shadow-xs hover:bg-muted transition-all border-border"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background shadow-xs hover:bg-muted transition-all border-border"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}