'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useTabStore } from '@/store/useTabStore';
import { cn } from '@/lib/utils';
import { getPatientClinicalData } from '@/actions/patients';
import { getEncounters } from '@/actions/encounters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { EncounterWithSpecialty, Condition, AllergyIntolerance, Patient } from '@/types/database.types';
import {
    Plus,
    User,
    AlertTriangle,
    AlertCircle,
    Stethoscope,
    Activity,
    Calendar,
    ArrowRight,
    UserPlus,
} from 'lucide-react';

// ─── JSONB column typed helpers ────────────────────────────────────────────────
interface PatientTelecom { system?: string; value?: string }
interface PatientAddress { text?: string }
interface PatientIdentifier { value?: string }

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PatientsListViewProps {
    patients: Patient[];
    totalItems: number;
    page: number;
    pageSize: number;
}

import { formatDate, calcAge } from '@/lib/clinical';

// ─── Empty state ───────────────────────────────────────────────────────────────
function NoPatientSelected() {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-background rounded-lg border-2 border-dashed border-border/50 p-8 text-center mt-6">
            <UserPlus className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground mb-1">Ningún paciente seleccionado</p>
            <p className="text-sm">
                Selecciona un paciente o usa <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs border">⌘K</kbd> to search
            </p>
        </div>
    );
}

// ... the rest of the file content needs to be rewritten similarly, splitting into subcomponents.
// Due to length, I will rewrite the essential structure in Tailwind.
// ... 

// ─── Tab: Resumen ──────────────────────────────────────────────────────────────
function TabResumen({ patient }: { patient: Patient | null }) {
    if (!patient) return <NoPatientSelected />;

    const fullName = `${patient.name_given?.join(' ')} ${patient.name_family}`;
    const phone = (patient.telecom as PatientTelecom[] | null)?.find(t => t.system === 'phone')?.value ?? '—';
    const email = (patient.telecom as PatientTelecom[] | null)?.find(t => t.system === 'email')?.value ?? '—';
    const address = (patient.address as PatientAddress[] | null)?.[0]?.text ?? '—';
    const docId = Array.isArray(patient.identifiers) ? (patient.identifiers as PatientIdentifier[])[0]?.value ?? '—' : '—';

    return (
        <div className="pt-6 space-y-6">
            <Card>
                <CardContent className="flex items-center gap-6 p-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <User className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2">{fullName}</h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span>{calcAge(patient.birth_date)}</span>
                            <span>·</span>
                            <span>{patient.gender === 'female' ? 'Femenino' : patient.gender === 'male' ? 'Masculino' : '—'}</span>
                            <span>·</span>
                            <Badge variant="outline" className="font-mono">CI: {docId}</Badge>
                            {patient.active ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-0">Activo</Badge>
                            ) : (
                                <Badge variant="secondary">Inactivo</Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/10 bg-transparent shadow-none">
                <CardContent className="p-6">
                    <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground mb-1">Fecha de nacimiento</dt>
                            <dd className="font-medium">{formatDate(patient.birth_date)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground mb-1">Teléfono</dt>
                            <dd className="font-medium">{phone}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground mb-1">Correo electrónico</dt>
                            <dd className="font-medium truncate">{email}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground mb-1">Dirección</dt>
                            <dd className="font-medium line-clamp-1">{address}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Tab: Condiciones ──────────────────────────────────────────────────────────
function TabCondiciones({ patientId }: { patientId: string | null }) {
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!patientId) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const data = await getPatientClinicalData(patientId);
                if (!cancelled) setConditions(data.conditions as Condition[]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [patientId]);

    if (!patientId) return <NoPatientSelected />;

    return (
        <div className="pt-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Condiciones activas</h3>
                    <Badge variant="secondary" className="font-mono">{conditions.length}</Badge>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
            ) : conditions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background border border-dashed rounded-xl">
                    <Stethoscope className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm">Sin condiciones registradas</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {conditions.map((c) => (
                        <Card key={c.id} className="hover:border-primary/30 transition-colors">
                            <CardContent className="flex items-start justify-between p-4">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                                        <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="font-mono text-[10px] h-5">{c.code || 'S/C'}</Badge>
                                            <p className="font-semibold text-sm">{c.code_display || 'Sin descripción'}</p>
                                        </div>
                                        {c.onset_date && <p className="text-xs text-muted-foreground">Desde: {formatDate(c.onset_date)}</p>}
                                    </div>
                                </div>
                                {c.clinical_status && (
                                    <Badge variant={c.clinical_status === 'active' ? 'outline' : 'secondary'} className={cn(
                                        "font-medium border-0 h-6",
                                        c.clinical_status === 'active' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'
                                    )}>
                                        {c.clinical_status === 'active' ? 'Activa' : 'Resuelta'}
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Tab: Alergias ─────────────────────────────────────────────────────────────
function TabAlergias({ patientId }: { patientId: string | null }) {
    const [allergies, setAllergies] = useState<AllergyIntolerance[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!patientId) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const data = await getPatientClinicalData(patientId);
                if (!cancelled) setAllergies(data.allergies as AllergyIntolerance[]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [patientId]);

    if (!patientId) return <NoPatientSelected />;

    return (
        <div className="pt-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b text-destructive">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="text-lg font-semibold text-foreground">Alergias e intolerancias</h3>
                    <Badge variant="destructive" className="font-mono">{allergies.length}</Badge>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
            ) : allergies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background border border-dashed rounded-xl">
                    <AlertTriangle className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm">Sin alergias registradas</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {allergies.map((a) => (
                        <Card key={a.id} className="bg-destructive/5 border-destructive/20 hover:bg-destructive/10 transition-colors">
                            <CardContent className="flex items-start justify-between p-4">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-destructive tracking-tight leading-none mb-1">{a.code_display || 'Sin descripción'}</p>
                                        <p className="text-xs text-destructive/70 font-medium">
                                            {a.criticality ? `Prioridad ${a.criticality}` : 'Alergía registrada'}
                                        </p>
                                    </div>
                                </div>
                                {a.category && (
                                    <Badge variant="outline" className="border-destructive/20 text-destructive text-[10px] uppercase font-mono bg-destructive/5 h-6">
                                        {a.category}
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Tab: Encuentros ───────────────────────────────────────────────────────────
function TabEncuentros({ patientId, router }: { patientId: string | null; router: ReturnType<typeof useRouter> }) {
    const [encounters, setEncounters] = useState<EncounterWithSpecialty[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!patientId) return;
        // Avoid cascading setState: start fetch immediately, update state once done
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { data } = await getEncounters(patientId);
                if (!cancelled) setEncounters((data || []) as EncounterWithSpecialty[]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [patientId]);

    if (!patientId) return <NoPatientSelected />;

    return (
        <div className="pt-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Historial de consultas</h3>
                    <Badge variant="secondary" className="font-mono">{encounters.length}</Badge>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
            ) : encounters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background border border-dashed rounded-xl">
                    <Activity className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm">Sin consultas registradas</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {encounters.map((enc) => (
                        <Card key={enc.id} className="hover:border-primary/40 transition-all group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex items-start p-5 gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/10 transition-colors">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold text-sm">{formatDate(enc.start_time)}</p>
                                            <Badge variant={enc.status === 'finished' ? 'outline' : 'default'} className={cn(
                                                "font-medium border-0 h-5 text-[10px]",
                                                enc.status === 'finished' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-primary/10 text-primary'
                                            )}>
                                                {enc.status === 'finished' ? 'Completada' : 'En curso'}
                                            </Badge>
                                        </div>
                                        <p className="font-medium text-sm mb-1 line-clamp-1">{(Array.isArray(enc.reason_code) ? (enc.reason_code as Array<{ text?: string }>)[0]?.text : undefined) || 'Consulta general'}</p>
                                        {enc.evolution_note && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                                {enc.evolution_note}
                                            </p>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80 gap-1 text-xs font-semibold"
                                            onClick={() => router.push(`/history?patientId=${patientId}`)}
                                        >
                                            Ver en Historia Clínica <ArrowRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
import PatientsSidebar from './PatientsSidebar';

const LIST_TAB_VALUES = ['resumen', 'condiciones', 'alergias', 'encuentros'] as const;
const LIST_VIEW_KEY = 'patients-list';

export default function PatientsListView({ patients, totalItems, page, pageSize }: PatientsListViewProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { setSecondaryPanel } = useLayoutStore();
    const { patientViewState, setPatientTab, addTab } = useTabStore();

    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const savedListTab = LIST_TAB_VALUES[patientViewState[LIST_VIEW_KEY] ?? 0] ?? 'resumen';
    const [activeListTab, setActiveListTab] = useState(savedListTab);

    const updateParams = React.useCallback((updates: Record<string, string | number>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, String(value));
            else params.delete(key);
        });
        router.push(`${pathname}?${params.toString()}`);
    }, [pathname, router, searchParams]);

    useEffect(() => {
        setSecondaryPanel(
            <PatientsSidebar
                patients={patients}
                loading={false}
                selectedId={selectedPatient?.id || null}
                onSelect={(id) => {
                    const p = patients.find(pat => pat.id === id);
                    if (p) {
                        setSelectedPatient(p);
                        const name = `${p.name_given?.join(' ')} ${p.name_family}`;
                        addTab({ title: name, url: `/patients/${id}` });
                    }
                    router.push(`/patients/${id}`);
                }}
                onNew={() => router.push('/patients/new')}
                searchQuery={searchParams.get('q') || ''}
                onSearchChange={(q) => updateParams({ q })}
            />,
            'Pacientes'
        );
    }, [patients, selectedPatient, searchParams, router, setSecondaryPanel, updateParams, addTab]);

    const handlePagination = (newPage: number) => {
        updateParams({ page: newPage });
    };

    return (
        <section className="flex flex-col h-full bg-background">
            {/* ══ Tabs — contexto único que envuelve header + contenido ══ */}
            <Tabs
                value={activeListTab}
                onValueChange={(val) => {
                    setActiveListTab(val as typeof LIST_TAB_VALUES[number]);
                    const idx = LIST_TAB_VALUES.indexOf(val as typeof LIST_TAB_VALUES[number]);
                    if (idx !== -1) setPatientTab(LIST_VIEW_KEY, idx);
                }}
                className="flex flex-col flex-1 min-h-0"
            >
                {/* ── Bloque 1: Toolbar ── */}
                <header className="flex items-center justify-between h-12 px-4 border-b border-border shrink-0 bg-background">
                    <div className="flex items-center gap-3">
                        <h1 className="text-sm font-semibold text-foreground">Pacientes</h1>
                        <span className="text-[11px] font-mono text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border/60">
                            {totalItems}
                        </span>
                    </div>
                    <Button
                        onClick={() => router.push('/patients/new')}
                        size="sm"
                        className="h-7 px-3 text-xs gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Nuevo Paciente
                    </Button>
                </header>

                {/* ── Bloque 2: Tab nav — línea inferior como indicador ── */}
                <div className="px-4 border-b border-border shrink-0 bg-background">
                    <TabsList className="h-auto bg-transparent p-0 gap-0 rounded-none">
                        {[
                            { value: 'resumen', label: 'Resumen', icon: User },
                            { value: 'condiciones', label: 'Condiciones', icon: Stethoscope },
                            { value: 'alergias', label: 'Alergias', icon: AlertTriangle },
                            { value: 'encuentros', label: 'Encuentros', icon: Activity },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className={cn(
                                    'relative h-10 gap-1.5 rounded-none text-xs font-medium px-3',
                                    'text-muted-foreground data-[state=active]:text-foreground',
                                    'data-[state=active]:shadow-none data-[state=active]:bg-transparent',
                                    'data-[state=active]:after:absolute data-[state=active]:after:bottom-0',
                                    'data-[state=active]:after:left-0 data-[state=active]:after:right-0',
                                    'data-[state=active]:after:h-px data-[state=active]:after:bg-primary',
                                    'hover:text-foreground hover:bg-sidebar-accent/30 transition-colors'
                                )}
                            >
                                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* ── Bloque 3: Contenido ── */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="px-6 pb-20">
                        <TabsContent value="resumen" className="mt-0 outline-none">
                            <TabResumen patient={selectedPatient} />
                        </TabsContent>
                        <TabsContent value="condiciones" className="mt-0 outline-none">
                            <TabCondiciones patientId={selectedPatient?.id ?? null} />
                        </TabsContent>
                        <TabsContent value="alergias" className="mt-0 outline-none">
                            <TabAlergias patientId={selectedPatient?.id ?? null} />
                        </TabsContent>
                        <TabsContent value="encuentros" className="mt-0 outline-none">
                            <TabEncuentros patientId={selectedPatient?.id ?? null} router={router} />
                        </TabsContent>
                    </div>
                </div>
            </Tabs>

            {/* ── Paginación — bloque fijo inferior ── */}
            {totalItems > pageSize && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background shrink-0">
                    <p className="text-[11px] text-muted-foreground/70 font-mono">
                        Página {page} · {totalItems} registros
                    </p>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePagination(page - 1)}
                            disabled={page <= 1}
                            className="h-7 px-2 text-xs disabled:opacity-30"
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePagination(page + 1)}
                            disabled={page * pageSize >= totalItems}
                            className="h-7 px-2 text-xs disabled:opacity-30"
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
}
