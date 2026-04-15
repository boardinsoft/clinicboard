'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Pill,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Plus,
  MessageSquare,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const statusLabels: Record<string, string> = {
  booked: 'Confirmada',
  pending: 'Pendiente',
  arrived: 'En Consulta',
  fulfilled: 'Completada',
  cancelled: 'Cancelada',
};

// Mapeamos FHIR status → variante pill del Badge
const statusBadgeVariant: Record<string, 'pill' | 'pill-success' | 'pill-warning' | 'pill-danger' | 'pill-muted' | 'pill-info'> = {
  booked:    'pill',
  pending:   'pill-warning',
  arrived:   'pill-info',
  fulfilled: 'pill-success',
  cancelled: 'pill-danger',
  noshow:    'pill-muted',
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  interface StatItem { label: string; value: string; delta: string; deltaType: 'positive' | 'negative'; icon: React.ComponentType<{ className?: string }> }
  interface AppointmentItem { id: string; patient: string; time: string; type: string; status: string | null }
  interface EvolutionItem { patient: string; date: string; note: string }
  interface ActivityDay { day: string; patients: number }
  interface PractitionerBasic { name_given: string[]; name_family: string; specialty?: string | null }

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentItem[]>([]);
  const [recentEvolutions, setRecentEvolutions] = useState<EvolutionItem[]>([]);
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);
  const [practitioner, setPractitioner] = useState<PractitionerBasic | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user/practitioner
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: pract } = await supabase
          .from('practitioners')
          .select('name_given, name_family, specialty')
          .eq('auth_user_id', user.id)
          .single();
        setPractitioner(pract);
      }

      // 1. Fetch Stats

      const { count: patientsToday } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      const { count: pendingAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'booked');

      setStats([
        { label: 'Total Pacientes', value: patientsToday?.toString() || '0', delta: '+5%', deltaType: 'positive', icon: Users },
        { label: 'Citas Pendientes', value: pendingAppointments?.toString() || '0', delta: '0', deltaType: 'positive', icon: CalendarDays },
        { label: 'Recetas Hoy', value: '4', delta: '+2', deltaType: 'positive', icon: Pill },
        { label: 'Tiempo Promedio', value: '15m', delta: '-3m', deltaType: 'positive', icon: Timer },
      ]);

      // 2. Fetch Upcoming Appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, patients(name_given, name_family)')
        .order('start_time', { ascending: true })
        .limit(4);

      if (appointments) {
        setUpcomingAppointments(appointments.map(a => ({
          id: a.id,
          patient: `${(a.patients as { name_given: string[]; name_family: string } | null)?.name_given?.join(' ')} ${(a.patients as { name_given: string[]; name_family: string } | null)?.name_family}`,
          time: new Date(a.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: a.description || 'Consulta',
          status: a.status
        })));
      }

      // 3. Fetch Recent Conditions/Evolutions
      const { data: conditions } = await supabase
        .from('conditions')
        .select('*, patients(name_given, name_family)')
        .order('created_at', { ascending: false })
        .limit(2);

      if (conditions) {
        setRecentEvolutions(conditions.map(c => ({
          patient: `${(c.patients as { name_given: string[]; name_family: string } | null)?.name_given?.join(' ')} ${(c.patients as { name_given: string[]; name_family: string } | null)?.name_family}`,
          date: new Date(c.created_at || '').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
          note: c.code_display
        })));
      }

      // Mock Activity Data
      setActivityData([
        { day: 'Lun', patients: 18 },
        { day: 'Mar', patients: 22 },
        { day: 'Mié', patients: 16 },
        { day: 'Jue', patients: 24 },
        { day: 'Vie', patients: 20 },
        { day: 'Sáb', patients: 8 },
        { day: 'Dom', patients: 0 },
      ]);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="px-6 py-5 space-y-6 max-w-[1400px] mx-auto w-full">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[360px] w-full rounded-lg" />
          <Skeleton className="h-[360px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 max-w-[1400px] mx-auto space-y-6 w-full animate-in fade-in duration-300 overflow-y-auto h-full">
      {/* Page Header */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Hola, <span className="text-primary">{practitioner?.name_given?.[0] || 'Doctor'}</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">

        {/* Stats Row */}
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.label} className="hover:border-primary/20 transition-all duration-300 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <CardAction>
                  <div className="p-2 bg-primary/5 rounded-md">
                    <IconComponent className="w-5 h-5 text-primary/70" />
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex flex-col space-y-1">
                  <span className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</span>
                  <div className="flex items-center text-xs mt-0.5">
                    {stat.deltaType === 'positive' ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-destructive mr-1" />
                    )}
                    <span className={stat.deltaType === 'positive' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-destructive font-medium'}>
                      {stat.delta}
                    </span>
                    <span className="text-muted-foreground ml-1">vs. semana anterior</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Medical History Card (2 columns) */}
        <Card className="col-span-1 lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Historia Clínica Reciente</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" className="h-8 text-primary hover:bg-primary/10" onClick={() => router.push('/history')}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Nota
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 px-6 py-5 space-y-4">
            <div className="flex flex-col gap-3 flex-1">
              {recentEvolutions.length > 0 ? recentEvolutions.map((evo, i) => (
                <div key={i} className="p-4 rounded-xl bg-card border border-border/50 shadow-sm flex flex-col hover:border-primary/30 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors">{evo.patient}</span>
                    <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-md">{evo.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {evo.note}
                  </p>
                </div>
              )) : (
                <div className="flex items-center justify-center p-8 h-full bg-muted/20 rounded-xl border border-dashed border-border/60">
                  <p className="text-muted-foreground text-sm">No hay evoluciones recientes.</p>
                </div>
              )}
            </div>

            {/* AI Summary Section */}
            <div className="mt-auto pt-4 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 shrink-0 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-primary/10 p-1 rounded-md">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary">
                  Resumen IA
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Actividad detectada en el sistema. <span className="font-medium text-foreground">{stats[0]?.value}</span> pacientes registrados y <span className="font-medium text-foreground">{stats[1]?.value}</span> citas pendientes para el día de hoy.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments (2 columns) */}
        <Card className="col-span-1 lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" className="h-8 hover:bg-muted" onClick={() => router.push('/appointments')}>
                <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                Ver Agenda
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 p-0">
            <div className="flex flex-col divide-y divide-border/20">
              {upcomingAppointments.length > 0 ? upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex flex-col items-center justify-center min-w-[3.5rem] bg-muted/40 p-2 rounded-lg border border-border/50 shadow-sm group-hover:bg-card transition-colors">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {apt.time.split(':')[0]}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {apt.time.split(':')[1]} {apt.time.includes('M') ? apt.time.slice(-2) : ''}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{apt.patient}</div>
                      <div className="text-xs text-muted-foreground truncate">{apt.type}</div>
                    </div>

                    <div className="flex-shrink-0 ml-2">
                      <Badge variant={statusBadgeVariant[apt.status ?? ''] ?? 'pill-muted'}>
                        {statusLabels[apt.status ?? ''] || apt.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex items-center justify-center p-8 flex-1">
                  <div className="flex flex-col items-center text-center space-y-2 text-muted-foreground">
                    <CalendarDays className="w-8 h-8 opacity-20" />
                    <span className="text-sm">No hay citas próximas programadas.</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Prescription (2 columns) */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Receta Rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-xs font-medium text-muted-foreground ml-1">
                  Medicamento
                </label>
                <Input
                  type="text"
                  placeholder="Buscar medicamento..."
                  className="bg-card shadow-sm border-border/60 focus-visible:ring-primary/20"
                />
              </div>
              <div className="flex-[0.5] space-y-2 w-full">
                <label className="text-xs font-medium text-muted-foreground ml-1">
                  Dosis
                </label>
                <Input
                  type="text"
                  placeholder="Ej: 500mg"
                  className="bg-card shadow-sm border-border/60 focus-visible:ring-primary/20"
                />
              </div>
              <Button className="w-full sm:w-auto h-10 mt-4 sm:mt-0 shadow-sm">
                <Pill className="w-4 h-4 mr-2" />
                Generar Receta
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Chart (2 columns) */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Actividad Semanal</CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="h-[220px] w-full mt-2">
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}
                    itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="patients"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#primaryGrad)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
