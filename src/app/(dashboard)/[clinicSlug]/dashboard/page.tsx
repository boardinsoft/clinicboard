'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  FileText,
  Timer,
  CalendarDays,
  Plus,
  Clock,
  Stethoscope,
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
import { WelcomeHeader } from '@/components/ui/WelcomeHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { Chart } from '@/components/ui/ChartIndex';
import { ChartCard } from '@/components/ui/ChartCard';
import { ChartHeader } from '@/components/ui/ChartHeader';
import { ChartMetric } from '@/components/ui/ChartMetric';
import { ChartContent } from '@/components/ui/ChartContent';
import { OnboardingResumeModal } from '@/components/onboarding/OnboardingResumeModal';
import { useActiveClinic } from '@/providers/ActiveClinicContext';

const statusLabels: Record<string, string> = {
  booked: 'Confirmada',
  pending: 'Pendiente',
  arrived: 'En Consulta',
  fulfilled: 'Completada',
  cancelled: 'Cancelada',
  noshow: 'No asistió',
};

const statusBadgeVariant: Record<string, string> = {
  booked:    'pill-info',
  pending:   'pill-warning',
  arrived:   'pill-info',
  fulfilled: 'pill-success',
  cancelled: 'pill-danger',
  noshow:    'pill-neutral',
};

interface StatItem {
  label: string;
  value: string;
  delta: string;
  deltaType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; size?: number }>;
}
interface AppointmentItem {
  id: string;
  patient: string;
  time: string;
  type: string;
  status: string | null;
}
interface EvolutionItem {
  patient: string;
  date: string;
  note: string;
}
interface ActivityDay {
  day: string;
  patients: number;
}
interface PractitionerBasic {
  name_given: string[];
  name_family: string;
  specialty?: string | null;
  gender?: 'male' | 'female' | 'other' | 'unknown' | null;
}

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const { needsOnboarding, practitionerId } = useActiveClinic();

  const [loading, setLoading] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentItem[]>([]);
  const [recentEvolutions, setRecentEvolutions] = useState<EvolutionItem[]>([]);
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);
  const [practitioner, setPractitioner] = useState<PractitionerBasic | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: pract } = await supabase
          .from('practitioners')
          .select('name_given, name_family, specialty, gender')
          .eq('auth_user_id', user.id)
          .single();
        setPractitioner(pract);
      }

      const { count: patientsToday } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      const { count: pendingAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'booked');

      setStats([
        { label: 'Total Pacientes', value: patientsToday?.toString() || '0', delta: '+5%', deltaType: 'positive', icon: Users },
        { label: 'Citas Pendientes', value: pendingAppointments?.toString() || '0', delta: '0', deltaType: 'neutral', icon: CalendarDays },
        { label: 'Recetas Hoy', value: '4', delta: '+2', deltaType: 'positive', icon: FileText },
        { label: 'Tiempo Promedio', value: '15m', delta: '-3m', deltaType: 'positive', icon: Timer },
      ]);

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

  useEffect(() => {
    if (needsOnboarding) {
      setShowOnboardingModal(true);
    }
  }, [needsOnboarding]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
        <WelcomeHeader className="py-6" />
        <div className="px-6 space-y-6 pb-12">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-300 overflow-y-auto">
      <WelcomeHeader
        practitionerName={practitioner?.name_given?.[0] || 'Doctor'}
        specialty={practitioner?.specialty || 'Cardiología'}
        gender={practitioner?.gender || 'male'}
        quickStats={[
          { label: 'citas hoy', value: upcomingAppointments.length.toString(), icon: CalendarDays },
          { label: 'pacientes', value: stats[0]?.value || '0', icon: Users },
        ]}
      />

      <div className="px-6 pb-12 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <MetricCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                delta={stat.delta}
                deltaType={stat.deltaType}
                icon={IconComponent}
              />
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Activity Chart - 8 columns */}
          <div className="lg:col-span-8">
            <ChartCard>
              <ChartHeader>
                <CardTitle>Actividad Semanal</CardTitle>
                <ChartMetric
                  label="Total"
                  value={activityData.reduce((acc, d) => acc + d.patients, 0)}
                  status="default"
                  align="end"
                />
              </ChartHeader>
              <ChartContent>
                <div className="h-[220px] w-full">
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
                          padding: '8px 12px',
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
              </ChartContent>
            </ChartCard>
          </div>

          {/* Right Sidebar - 4 columns */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Estado del Día</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-b-1 border border-b-2/20">
                  <div className="p-2 bg-b-8/10 rounded-md">
                    <Stethoscope size={16} strokeWidth={1.8} className="text-b-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-n-8">Consulta activa</p>
                    <p className="text-sm font-semibold text-n-12">En sala 302</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-n-2 border border-n-4">
                  <div className="p-2 bg-n-3 rounded-md">
                    <Clock size={16} strokeWidth={1.8} className="text-n-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-n-8">Próxima cita</p>
                    <p className="text-sm font-semibold text-n-12">14:30 - María García</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-n-2 border border-n-4">
                  <div className="p-2 bg-n-3 rounded-md">
                    <FileText size={16} strokeWidth={1.8} className="text-n-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-n-8">Pendientes</p>
                    <p className="text-sm font-semibold text-n-12">3 recetas por firmar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent History */}
          <Card>
            <CardHeader>
              <CardTitle>Historia Clínica Reciente</CardTitle>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-b-8 hover:bg-b-8/10"
                  onClick={() => router.push('/history')}
                >
                  <Plus className="w-4 h-4 mr-2" strokeWidth={1.8} />
                  Nueva Nota
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEvolutions.length > 0 ? recentEvolutions.map((evo, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-n-2 border border-n-4 flex flex-col hover:border-b-8/30 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-n-12 group-hover:text-b-8 transition-colors">
                      {evo.patient}
                    </span>
                    <span className="text-xs font-medium text-n-8 bg-n-3 px-2 py-1 rounded-md">
                      {evo.date}
                    </span>
                  </div>
                  <p className="text-sm text-n-8 line-clamp-2 leading-relaxed">
                    {evo.note}
                  </p>
                </div>
              )) : (
                <div className="flex items-center justify-center p-8 bg-n-2 rounded-lg border border-dashed border-n-5">
                  <p className="text-sm text-n-8">No hay evoluciones registradas.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Próximas Citas</CardTitle>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 hover:bg-n-2"
                  onClick={() => router.push('/appointments')}
                >
                  <CalendarDays className="w-4 h-4 mr-2 text-n-8" strokeWidth={1.8} />
                  Ver Agenda
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col divide-y divide-n-4">
                {upcomingAppointments.length > 0 ? upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 hover:bg-n-2 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="flex flex-col items-center justify-center min-w-[3.5rem] bg-n-2 p-2 rounded-lg border border-n-4 group-hover:bg-n-3 transition-colors">
                        <span className="font-mono text-xs font-semibold text-n-12">
                          {apt.time.split(':')[0]}
                        </span>
                        <span className="font-mono text-[10px] text-n-8">
                          {apt.time.split(':')[1]}
                        </span>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate text-n-12 group-hover:text-b-8 transition-colors">
                          {apt.patient}
                        </div>
                        <div className="text-xs text-n-8 truncate">{apt.type}</div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <Badge variant={(statusBadgeVariant[apt.status ?? ''] ?? 'pill-neutral') as 'pill-neutral'}>
                          {statusLabels[apt.status ?? ''] ?? 'Desconocido'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex flex-col items-center text-center space-y-2 text-n-8">
                      <CalendarDays className="w-8 h-8 opacity-20" strokeWidth={1.8} />
                      <span className="text-sm">No hay citas programadas.</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Prescription */}
        <Card>
          <CardHeader>
            <CardTitle>Receta Rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-xs font-medium text-n-8 ml-1">
                  Medicamento
                </label>
                <Input
                  type="text"
                  placeholder="Buscar medicamento..."
                  className="bg-card border-border/60 focus-visible:ring-b-8/20"
                />
              </div>
              <div className="flex-[0.5] space-y-2 w-full">
                <label className="text-xs font-medium text-n-8 ml-1">
                  Dosis
                </label>
                <Input
                  type="text"
                  placeholder="Ej: 500mg"
                  className="bg-card border-border/60 focus-visible:ring-b-8/20"
                />
              </div>
              <Button className="w-full sm:w-auto h-10">
                <FileText className="w-4 h-4 mr-2" strokeWidth={1.8} />
                Generar Receta
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      <OnboardingResumeModal
        open={showOnboardingModal}
        onOpenChange={setShowOnboardingModal}
        practitionerId={practitionerId}
      />
    </div>
  );
}