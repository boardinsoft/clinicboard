'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLayoutStore } from '@/store/useLayoutStore';
import { cn } from '@/lib/utils';
import { getPatientClinicalData } from '@/actions/patients';
import { getEncounters } from '@/actions/encounters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { EncounterWithSpecialty, Condition, AllergyIntolerance, Patient } from '@/types/database.types';
import { formatDate, calcAge, getGenderLabel } from '@/lib/clinical';
import TableSearch from '@/components/ui/TableSearch';
import {
  Plus,
  Search,
  SlidersHorizontal,
  User,
  AlertTriangle,
  AlertCircle,
  Stethoscope,
  Activity,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
} from 'lucide-react';

import PatientsSidebar from './PatientsSidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PatientTelecom, PatientAddress, PatientIdentifier } from '@/types/patient-jsonb';

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
  return Array.isArray(p.identifiers)
    ? (p.identifiers as PatientIdentifier[])[0]?.value ?? '—'
    : '—';
}

function getPhone(p: Patient): string {
  return (p.telecom as PatientTelecom[] | null)?.find(t => t.system === 'phone')?.value ?? '—';
}

function getInitials(p: Patient): string {
  const first = p.name_given?.[0]?.[0] ?? '';
  const last = p.name_family?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

function getFullName(p: Patient): string {
  return `${p.name_given?.join(' ') ?? ''} ${p.name_family ?? ''}`.trim();
}

// ─── Tab: Resumen ──────────────────────────────────────────────────────────────
function TabResumen({ patient }: { patient: Patient }) {
  const phone = getPhone(patient);
  const email = (patient.telecom as PatientTelecom[] | null)?.find(t => t.system === 'email')?.value ?? '—';
  const address = (patient.address as PatientAddress[] | null)?.[0]?.text ?? '—';
  const docId = getCI(patient);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 px-4 py-3">
      <div>
        <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Fecha de nacimiento</dt>
        <dd className="text-sm font-medium">{formatDate(patient.birth_date)}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Edad</dt>
        <dd className="text-sm font-medium">{calcAge(patient.birth_date)}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Cédula</dt>
        <dd className="text-sm font-mono">{docId}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Género</dt>
        <dd className="text-sm font-medium">{getGenderLabel(patient.gender)}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Teléfono</dt>
        <dd className="text-sm font-medium">{phone}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Correo</dt>
        <dd className="text-sm font-medium truncate">{email}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Dirección</dt>
        <dd className="text-sm font-medium">{address}</dd>
      </div>
    </div>
  );
}

// ─── Tab: Condiciones ──────────────────────────────────────────────────────────
function TabCondiciones({ patientId }: { patientId: string }) {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPatientClinicalData(patientId)
      .then(data => { if (!cancelled) setConditions(data.conditions as Condition[]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [patientId]);

  if (loading) return (
    <div className="p-4 space-y-2">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-full rounded" />)}
    </div>
  );

  if (conditions.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <Stethoscope className="w-8 h-8 mb-2 opacity-20" />
      <p className="text-xs">Sin condiciones registradas</p>
    </div>
  );

  return (
    <table className="w-full table-dense">
      <thead>
        <tr>
          <th>Código</th>
          <th>Descripción</th>
          <th>Desde</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {conditions.map(c => (
          <tr key={c.id}>
            <td><span className="font-mono text-muted-foreground">{c.code || '—'}</span></td>
            <td className="font-medium">{c.code_display || 'Sin descripción'}</td>
            <td className="text-muted-foreground">{c.onset_date ? formatDate(c.onset_date) : '—'}</td>
            <td>
              <Badge variant={c.clinical_status === 'active' ? 'pill-success' : 'pill-muted'}>
                {c.clinical_status === 'active' ? 'Activa' : 'Resuelta'}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Tab: Alergias ─────────────────────────────────────────────────────────────
function TabAlergias({ patientId }: { patientId: string }) {
  const [allergies, setAllergies] = useState<AllergyIntolerance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPatientClinicalData(patientId)
      .then(data => { if (!cancelled) setAllergies(data.allergies as AllergyIntolerance[]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [patientId]);

  if (loading) return (
    <div className="p-4 space-y-2">
      {[1, 2].map(i => <Skeleton key={i} className="h-9 w-full rounded" />)}
    </div>
  );

  if (allergies.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <AlertTriangle className="w-8 h-8 mb-2 opacity-20" />
      <p className="text-xs">Sin alergias registradas</p>
    </div>
  );

  return (
    <table className="w-full table-dense">
      <thead>
        <tr>
          <th>Alérgeno</th>
          <th>Categoría</th>
          <th>Criticidad</th>
        </tr>
      </thead>
      <tbody>
        {allergies.map(a => (
          <tr key={a.id}>
            <td>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                <span className="font-medium text-destructive">{a.code_display || 'Sin descripción'}</span>
              </div>
            </td>
            <td>{a.category ? <Badge variant="secondary">{a.category}</Badge> : '—'}</td>
            <td>
              {a.criticality
                ? <Badge variant={a.criticality === 'high' ? 'pill-danger' : 'pill-warning'}>{a.criticality}</Badge>
                : '—'
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Tab: Encuentros ───────────────────────────────────────────────────────────
function TabEncuentros({ patientId, router }: { patientId: string; router: ReturnType<typeof useRouter> }) {
  const [encounters, setEncounters] = useState<EncounterWithSpecialty[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEncounters(patientId)
      .then(({ data }) => { if (!cancelled) setEncounters((data || []) as EncounterWithSpecialty[]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [patientId]);

  if (loading) return (
    <div className="p-4 space-y-2">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-full rounded" />)}
    </div>
  );

  if (encounters.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <Activity className="w-8 h-8 mb-2 opacity-20" />
      <p className="text-xs">Sin consultas registradas</p>
    </div>
  );

  return (
    <table className="w-full table-dense">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Motivo</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {encounters.map(enc => (
          <tr key={enc.id}>
            <td className="font-mono text-muted-foreground">{formatDate(enc.start_time)}</td>
            <td className="font-medium max-w-[240px]">
              <span className="truncate block">
                {(Array.isArray(enc.reason_code)
                  ? (enc.reason_code as Array<{ text?: string }>)[0]?.text
                  : undefined) || 'Consulta general'}
              </span>
            </td>
            <td>
              <Badge variant={enc.status === 'finished' ? 'pill-success' : 'pill-info'}>
                {enc.status === 'finished' ? 'Completada' : 'En curso'}
              </Badge>
            </td>
            <td>
              <button
                className="row-actions flex items-center gap-1 text-[11px] text-primary hover:underline"
                onClick={() => router.push(`/history?patientId=${patientId}`)}
              >
                Ver <ArrowRight className="w-3 h-3" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Panel de detalle — aparece al seleccionar una fila ───────────────────────
const DETAIL_TABS = [
  { value: 'resumen', label: 'Resumen', icon: User },
  { value: 'condiciones', label: 'Condiciones', icon: Stethoscope },
  { value: 'alergias', label: 'Alergias', icon: AlertTriangle },
  { value: 'encuentros', label: 'Encuentros', icon: Activity },
] as const;

type DetailTabValue = typeof DETAIL_TABS[number]['value'];

function DetailPanel({
  patient,
  onClose,
  router,
}: {
  patient: Patient;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [activeTab, setActiveTab] = useState<DetailTabValue>('resumen');

  return (
    <div className="flex flex-col border-t border-border bg-background" style={{ height: '42%' }}>
      {/* ── Panel header ── */}
      <div className="flex items-center h-10 px-3 py-2 border-b border-border shrink-0 gap-3">
        {/* Avatar + nombre */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
            {getInitials(patient)}
          </div>
          <span className="text-sm font-medium truncate">{getFullName(patient)}</span>
          <Badge variant={patient.active !== false ? 'pill-success' : 'pill-muted'}>
            {patient.active !== false ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as DetailTabValue)} className="flex-1">
          <TabsList className="h-auto bg-transparent p-0 gap-0 rounded-none">
            {DETAIL_TABS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'relative h-10 gap-1.5 rounded-none text-[11px] font-medium px-3',
                  'text-muted-foreground data-[state=active]:text-foreground',
                  'data-[state=active]:shadow-none data-[state=active]:bg-transparent',
                  'data-[state=active]:after:absolute data-[state=active]:after:bottom-0',
                  'data-[state=active]:after:left-0 data-[state=active]:after:right-0',
                  'data-[state=active]:after:h-px data-[state=active]:after:bg-primary',
                  'hover:text-foreground transition-colors'
                )}
              >
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Cerrar panel */}
        <button
          onClick={onClose}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Cerrar panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Contenido del tab seleccionado ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'resumen' && <TabResumen patient={patient} />}
        {activeTab === 'condiciones' && <TabCondiciones patientId={patient.id} />}
        {activeTab === 'alergias' && <TabAlergias patientId={patient.id} />}
        {activeTab === 'encuentros' && <TabEncuentros patientId={patient.id} router={router} />}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PatientsListView({ patients, totalItems, page, pageSize }: PatientsListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setSecondaryPanel } = useLayoutStore();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [localQ, setLocalQ] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<PatientFilters>({
    status: 'all',
    gender: 'all',
    q: searchParams.get('q') || '',
  });

  // Estado para anchos de columna (Estilo Excel)
  const [colWidths, setColWidths] = useState({
    name: 280,
    ci: 140,
    gender: 100,
    age: 80,
    phone: 140,
    status: 120
  });

  // Lógica de redimensión horizontal únicamente
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

  const ResizeHandle = ({ col }: { col: keyof typeof colWidths }) => (
    <div
      onMouseDown={(e) => startResizing(col, e)}
      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/60 z-30 transition-colors"
      title="Arrastrar para redimensionar"
    />
  );

  const updateParams = useCallback((updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
      else params.delete(key);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  // Filtrado client-side sobre el array recibido
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
    setSelectedPatient(prev => prev?.id === p.id ? null : p);
  }, []);

  // Montar el sidebar de contexto
  useEffect(() => {
    setSecondaryPanel(<PatientsSidebar />, 'Pacientes');
  }, [patients, setSecondaryPanel]);

  const totalPages = Math.ceil(totalItems / pageSize);
  const hasFilters = filters.status !== 'all' || filters.gender !== 'all' || localQ !== '';

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <section className="flex flex-col h-full bg-background">

      {/* ── Nueva Toolbar Integrada (Estilo Supabase) ── */}
      <TableSearch 
        value={localQ}
        onChange={setLocalQ}
        hasFilters={hasFilters}
        filters={filters}
        onFilterChange={handleFilterChange}
        onNewRecord={() => router.push('/patients/new')}
        placeholder="Buscar por nombre o cédula..."
      />

      {/* ── Tabla + Panel de detalle ── */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* Tabla Estilo Excel/Supabase Grid */}
        <div className={cn(
          'overflow-auto min-h-0 transition-all scrollbar-thin border-l border-t border-border/40 relative',
          selectedPatient ? 'flex-[0_0_58%]' : 'flex-1'
        )}>
          <table className="w-full border-separate border-spacing-0 table-fixed">
            <thead className="sticky top-0 z-30 bg-[#f8f9fa] dark:bg-muted/20">
              <tr>
                <th className="w-10 h-10 border-r border-b border-border px-0 text-center sticky left-0 z-40 bg-[#f8f9fa] dark:bg-muted/20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-border/60 accent-primary"
                  />
                </th>
                <th style={{ width: colWidths.name }} className="h-10 border-r border-b border-border px-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 relative group/header">
                    Paciente <ResizeHandle col="name" />
                </th>
                <th style={{ width: colWidths.ci }} className="h-10 border-r border-b border-border px-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 relative group/header">
                    Cédula <ResizeHandle col="ci" />
                </th>
                <th style={{ width: colWidths.gender }} className="h-10 border-r border-b border-border px-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 relative group/header">
                    Género <ResizeHandle col="gender" />
                </th>
                <th style={{ width: colWidths.age }} className="h-10 border-r border-b border-border px-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 relative group/header">
                    Edad <ResizeHandle col="age" />
                </th>
                <th style={{ width: colWidths.phone }} className="h-10 border-r border-b border-border px-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 relative group/header">
                    Teléfono <ResizeHandle col="phone" />
                </th>
                <th style={{ width: colWidths.status }} className="h-10 border-r border-b border-border px-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 relative group/header">
                    Estado <ResizeHandle col="status" />
                </th>
                <th className="min-w-[100px] h-10 border-b border-border px-3 relative"></th>
              </tr>
            </thead>
            <tbody className="bg-background">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center text-muted-foreground/60 text-[13px] italic border-b border-r border-border">
                    No se encontraron registros.
                  </td>
                </tr>
              ) : filteredPatients.map((p, idx) => {
                const isSelected = selectedPatient?.id === p.id;
                
                return (
                  <tr
                    key={p.id}
                    data-selected={isSelected}
                    className={cn(
                      "group transition-all duration-75 even:bg-muted/5",
                      isSelected 
                          ? "bg-primary/[0.04] z-10 relative" 
                          : "hover:bg-[#f8f9fa] dark:hover:bg-muted/10"
                    )}
                    onClick={() => handleSelectPatient(p)}
                  >
                    <td className={cn(
                      "h-11 border-r border-b border-border text-center px-0 sticky left-0 z-20 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                      isSelected ? "bg-[#f0f7ff] dark:bg-primary/10" : "bg-background group-hover:bg-[#f8f9fa] dark:group-hover:bg-muted/10"
                    )} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-border/60 accent-primary"
                      />
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary z-30" />}
                    </td>
                    <td className="h-11 border-r border-b border-border px-3 overflow-hidden">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors shadow-sm',
                          isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10'
                        )}>
                          {getInitials(p)}
                        </div>
                        <span className={cn(
                          "text-[13.5px] truncate",
                          isSelected ? "text-primary font-bold" : "text-foreground font-medium group-hover:text-primary transition-colors"
                        )}>
                          {getFullName(p)}
                        </span>
                      </div>
                    </td>
                    <td className="h-11 border-r border-b border-border px-3 font-mono text-[12px] text-muted-foreground/80 tabular-nums">
                      {getCI(p)}
                    </td>
                    <td className="h-11 border-r border-b border-border px-3 text-[13px] text-muted-foreground">
                      {getGenderLabel(p.gender)}
                    </td>
                    <td className="h-11 border-r border-b border-border px-3 text-[13px] text-muted-foreground tabular-nums">
                      {calcAge(p.birth_date)}
                    </td>
                    <td className="h-11 border-r border-b border-border px-3 font-mono text-[12px] text-muted-foreground/80 tabular-nums">
                      {getPhone(p)}
                    </td>
                    <td className="h-11 border-r border-b border-border px-3">
                      <Badge 
                        variant={p.active !== false ? 'pill-success' : 'pill-muted'}
                        className="font-semibold"
                      >
                        {p.active !== false ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="h-11 border-b border-border px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/patients/${p.id}`);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-all"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-[11px] font-medium py-1 px-2">
                              Expandir registro
                            </TooltipContent>
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

        {/* Panel de detalle — aparece al seleccionar fila */}
        {selectedPatient && (
          <DetailPanel
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
            router={router}
          />
        )}
      </div>

      {/* ── Barra de paginación — estilo Supabase ── */}
      <div className="flex items-center justify-between px-3 py-2 h-9 border-t border-border bg-background shrink-0">
        <span className="text-[11px] font-mono text-muted-foreground/70">
          {totalItems} registros
        </span>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>Página {page} de {Math.max(totalPages, 1)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={page <= 1}
            onClick={() => updateParams({ page: page - 1 })}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={page * pageSize >= totalItems}
            onClick={() => updateParams({ page: page + 1 })}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
