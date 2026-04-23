'use client';

import * as React from 'react';
import { Stethoscope, Activity, Clock, Users, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; size?: number }>;
}

interface WelcomeHeaderProps {
  practitionerName?: string;
  specialty?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  consultationRoom?: string;
  isConsultationActive?: boolean;
  activePatientName?: string;
  lastActivityTime?: string;
  quickStats?: QuickStat[];
  className?: string;
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function getPrefix(gender?: 'male' | 'female' | 'other' | 'unknown'): string {
  if (gender === 'female') return 'Dra.';
  if (gender === 'male') return 'Dr.';
  return 'Dr.';
}

export function WelcomeHeader({
  practitionerName,
  specialty,
  gender,
  consultationRoom,
  isConsultationActive = false,
  activePatientName,
  lastActivityTime,
  quickStats = [],
  className,
}: WelcomeHeaderProps) {
  const [mounted, setMounted] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const hour = mounted ? new Date().getHours() : 12;
  const greeting = getGreeting(hour);
  const prefix = getPrefix(gender);

  const displayName = practitionerName || 'Doctor';
  const subtitle = [specialty, consultationRoom].filter(Boolean).join(' · ');

  const defaultStats: QuickStat[] = quickStats.length > 0 ? quickStats : [
    { label: 'Consulta activa', value: activePatientName || 'En sala 302', icon: Activity },
    { label: 'citas hoy', value: '3', icon: CalendarDays },
    { label: 'pacientes', value: '12', icon: Users },
  ];

  return (
    <div
      className={cn(
        'flex flex-col gap-4 px-6 py-6 animate-in fade-in duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-b-1 border border-b-2/30">
            <Stethoscope
              size={20}
              strokeWidth={1.8}
              className="text-b-8"
            />
            {isConsultationActive && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-b-8 rounded-full border-2 border-n-1 animate-pulse" />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-semibold tracking-tight text-n-12 dark:text-n-12">
              {greeting}, {prefix} {displayName}
            </h1>
            {subtitle && (
              <p className="text-sm text-n-8 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {lastActivityTime && (
          <div className="flex items-center gap-1.5 text-xs text-n-8">
            <Clock size={12} strokeWidth={1.8} />
            <span>Última actividad: {lastActivityTime}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {defaultStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-n-2 border border-n-4 text-xs font-medium"
              >
                <IconComponent size={12} strokeWidth={1.8} className="text-n-8" />
                <span className="text-n-8">{stat.label}:</span>
                <span className="text-n-12 font-semibold">{stat.value}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-medium border-n-5 text-n-8 hover:bg-n-3 hover:text-n-12"
            onClick={() => router.push('/patients/new')}
          >
            <Users size={12} strokeWidth={1.8} className="mr-1.5" />
            Nuevo Paciente
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-medium border-n-5 text-n-8 hover:bg-n-3 hover:text-n-12"
            onClick={() => router.push('/appointments')}
          >
            <CalendarDays size={12} strokeWidth={1.8} className="mr-1.5" />
            Nueva Cita
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeHeader;