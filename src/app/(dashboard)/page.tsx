'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tile,
  Button,
  Tag,
  Loading,
} from '@carbon/react';
import {
  Events,
  UserMultiple,
  Medication,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Add,
  Chat,
} from '@carbon/icons-react';
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

const statusLabels: Record<string, string> = {
  booked: 'Confirmada',
  pending: 'Pendiente',
  arrived: 'En Consulta',
  fulfilled: 'Completada',
  cancelled: 'Cancelada',
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentEvolutions, setRecentEvolutions] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [practitioner, setPractitioner] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user/practitioner
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: pract } = await supabase
          .from('practitioners')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        setPractitioner(pract);
      }

      // 1. Fetch Stats
      const today = new Date().toISOString().split('T')[0];

      const { count: patientsToday } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      const { count: pendingAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'booked');

      setStats([
        { label: 'Total Pacientes', value: patientsToday?.toString() || '0', delta: '+5%', deltaType: 'positive', icon: UserMultiple },
        { label: 'Citas Pendientes', value: pendingAppointments?.toString() || '0', delta: '0', deltaType: 'positive', icon: Calendar },
        { label: 'Recetas Hoy', value: '4', delta: '+2', deltaType: 'positive', icon: Medication },
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
          patient: `${(a.patients as any)?.name_given?.join(' ')} ${(a.patients as any)?.name_family}`,
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
          patient: `${(c.patients as any)?.name_given?.join(' ')} ${(c.patients as any)?.name_family}`,
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

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '2rem 3rem' }}>
      {/* Page Header / Welcome */}
      <div className="page-header" style={{ marginBottom: '3rem' }}>
        <h1 className="page-header__title" style={{ fontSize: '2.5rem', fontWeight: 300 }}>
          Hola, {practitioner?.name_given?.[0] || 'Doctor'}
        </h1>
        <p className="page-header__subtitle" style={{ fontSize: '1.125rem' }}>
          Bienvenido a su tablero. Resumen de actividad para hoy, {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>


      {/* Bento Grid */}
      <div className="bento-grid bento-grid--dashboard" style={{ margin: 0 }}>
        {/* Stats Row */}
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.label} className="bento-card bento-card--stat">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="bento-card__label">{stat.label}</span>
                <IconComponent size={16} style={{ color: 'var(--cds-text-secondary)' }} />
              </div>
              <span className="bento-card__value">{stat.value}</span>
              <span className={`bento-card__delta bento-card__delta--${stat.deltaType}`}>
                {stat.deltaType === 'positive' ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                {stat.delta} vs. semana anterior
              </span>
            </div>
          );
        })}

        {/* Medical History Card (2x2) */}
        <div className="bento-card bento-card--wide bento-card--tall">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="bento-card__label">Historia Clínica Reciente</span>
            <Button kind="ghost" size="sm" renderIcon={Add}>
              Nueva Nota
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {recentEvolutions.map((evo, i) => (
              <Tile key={i} style={{ background: 'var(--cds-layer-02)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{evo.patient}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{evo.date}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {evo.note}
                </p>
              </Tile>
            ))}
          </div>

          {/* AI Summary Card */}
          <div className="ai-card" style={{ padding: '1rem', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Chat size={16} style={{ color: 'var(--clinicboard-accent)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clinicboard-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Resumen IA
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--cds-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Actividad detectada en el sistema. {stats[0]?.value} pacientes registrados y {stats[1]?.value} citas pendientes para el día de hoy.
            </p>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bento-card bento-card--wide bento-card--tall">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="bento-card__label">Próximas Citas</span>
            <Button kind="ghost" size="sm" renderIcon={Calendar}>
              Ver Agenda
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            {upcomingAppointments.length > 0 ? upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'var(--cds-layer-02)',
                  borderLeft: apt.status === 'arrived' ? '3px solid var(--clinicboard-accent)' : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.8125rem', color: 'var(--cds-text-secondary)', minWidth: '3rem' }}>
                    {apt.time}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{apt.patient}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>{apt.type}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`status-badge status-badge--${apt.status}`}>
                    <span className="status-dot" style={{
                      backgroundColor: apt.status === 'booked' ? 'var(--cds-interactive)' :
                        apt.status === 'arrived' ? 'var(--clinicboard-accent)' :
                          apt.status === 'fulfilled' ? 'var(--cds-support-success)' : 'var(--cds-text-secondary)',
                    }} />
                    {statusLabels[apt.status] || apt.status}
                  </span>
                </div>
              </div>
            )) : <p style={{ padding: '1rem' }}>No hay citas próximas.</p>}
          </div>
        </div>

        {/* Quick Prescription */}
        <div className="bento-card bento-card--wide">
          <span className="bento-card__label">Receta Rápida</span>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Medicamento
              </label>
              <input
                type="text"
                placeholder="Buscar medicamento..."
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  background: 'var(--cds-field-01)',
                  border: '1px solid var(--cds-border-subtle)',
                  color: 'var(--cds-text-primary)',
                  fontFamily: 'IBM Plex Sans',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: 0.5 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Dosis
              </label>
              <input
                type="text"
                placeholder="500mg"
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem',
                  background: 'var(--cds-field-01)',
                  border: '1px solid var(--cds-border-subtle)',
                  color: 'var(--cds-text-primary)',
                  fontFamily: 'IBM Plex Sans',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
            <Button kind="primary" renderIcon={Medication}>
              Generar Receta
            </Button>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bento-card bento-card--wide">
          <span className="bento-card__label">Actividad Semanal</span>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--clinicboard-blue)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--clinicboard-blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'var(--cds-text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--cds-border-subtle)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--cds-text-secondary)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--cds-layer-02)',
                    border: '1px solid var(--cds-border-subtle)',
                    borderRadius: 0,
                    color: 'var(--cds-text-primary)',
                    fontFamily: 'IBM Plex Sans',
                    fontSize: '0.8125rem',
                  }}
                  itemStyle={{ color: 'var(--cds-text-primary)' }}
                />
                <Area
                  type="monotone"
                  dataKey="patients"
                  stroke="var(--clinicboard-blue)"
                  strokeWidth={2}
                  fill="url(#blueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
