'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Pencil,
  Printer,
  Download,
  MoreVertical,
  Eye,
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

// ─── Checkbox Helpers ─────────────────────────────────────────────────────────
function togglePatientSelection(
  selected: Set<string>,
  patientId: string
): Set<string> {
  const next = new Set(selected);
  if (next.has(patientId)) {
    next.delete(patientId);
  } else {
    next.add(patientId);
  }
  return next;
}

function toggleAllSelection(
  selected: Set<string>,
  patientIds: string[],
  allSelected: boolean
): Set<string> {
  if (allSelected) {
    return new Set(patientIds);
  }
  return new Set();
}

export default function PatientsListView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);

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

// Sync header checkbox indeterminate state
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        selectedPatients.size > 0 && selectedPatients.size < patients.length;
    }
  }, [selectedPatients, patients.length]);

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
            <div className="relative flex items-center gap-2 h-8 px-3 bg-n-2 dark:bg-n-3 border border-n-5 dark:border-n-5 rounded-[5px] text-[13px] text-n-9 dark:text-n-10 hover:bg-n-3 dark:hover:bg-n-4 hover:border-n-6 transition-all">
              <Search className="w-4 h-4 shrink-0 text-n-8" strokeWidth={1.8} />
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-[13px] text-n-11 dark:text-n-11 placeholder:text-n-8 outline-none min-w-0 h-8"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-0.5 hover:bg-n-5 rounded transition-colors shrink-0"
                >
                  <X className="w-3 h-3 text-n-8" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 border-n-5 text-n-12 hover:bg-n-3 transition-colors"
              disabled={selectedPatients.size === 0}
              onClick={() => alert('Exportar seleccionados — Próximamente')}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Exportar seleccionados
              {selectedPatients.size > 0 && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-b-8 text-[10px] font-bold text-white">
                  {selectedPatients.size}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 border-n-5 text-n-12 hover:bg-n-3 transition-colors"
              onClick={() => alert('Exportar toda la lista — Próximamente')}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Exportar lista
            </Button>
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
              <thead className="sticky top-0 z-30">
                <tr>
                  <th className="w-12 text-center">
                    <label className="flex items-center justify-center cursor-pointer h-full">
                      <input
                        type="checkbox"
                        checked={selectedPatients.size === patients.length && patients.length > 0}
                        ref={headerCheckboxRef}
                        onChange={() => {
                          if (selectedPatients.size === patients.length) {
                            setSelectedPatients(new Set());
                          } else {
                            setSelectedPatients(new Set(patients.map(p => p.id)));
                          }
                        }}
                        className="h-4 w-4 rounded border-n-5 accent-b-8 cursor-pointer"
                      />
                    </label>
                  </th>
                  <th>Paciente</th>
                  <th>Identificación</th>
                  <th>Género</th>
                  <th>Edad</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th className="w-12 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className={cn(
                      "group cursor-pointer transition-colors relative",
                      selectedPatients.has(p.id) && "bg-b-2/30"
                    )}
                    onClick={() => setOpenPopoverId(p.id)}
                  >
<td className="text-center" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedPatients.has(p.id)}
                        onCheckedChange={() => {
                          setSelectedPatients((prev) => togglePatientSelection(prev, p.id));
                        }}
                      />
                    </td>
                    <td>
                      <span className="table-name truncate block group-hover:text-b-8 transition-colors">
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
                      <div className="flex items-center justify-end gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Popover
                          open={openPopoverId === p.id}
                          onOpenChange={(open) => {
                            if (!open) setOpenPopoverId(null);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 hover:bg-n-3 dark:hover:bg-n-2 rounded text-n-8 dark:text-n-9 hover:text-n-12 dark:hover:text-n-11 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-48 p-1 bg-n-1 dark:bg-n-2 border border-n-5 dark:border-n-6 shadow-md"
                            align="end"
                            side="left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/patients/${p.id}`);
                                  setOpenPopoverId(null);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-[6px] text-n-12 dark:text-n-11 cursor-pointer hover:bg-n-3 dark:hover:bg-n-2 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-n-8" />
                                Ver detalle
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/patients/${p.id}/edit`);
                                  setOpenPopoverId(null);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-[6px] text-n-12 dark:text-n-11 cursor-pointer hover:bg-n-3 dark:hover:bg-n-2 transition-colors"
                              >
                                <Pencil className="w-4 h-4 text-n-8" />
                                Editar paciente
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(`Imprimir ficha — Próximamente`);
                                  setOpenPopoverId(null);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-[6px] text-n-12 dark:text-n-11 cursor-pointer hover:bg-n-3 dark:hover:bg-n-2 transition-colors"
                              >
                                <Printer className="w-4 h-4 text-n-8" />
                                Imprimir ficha
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>
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