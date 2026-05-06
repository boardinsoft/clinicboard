'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { Plus, RefreshCw, CalendarDays, CheckSquare, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import AppointmentDetailSheet from './AppointmentDetailSheet';
import NewAppointmentDialog from './NewAppointmentDialog';
import NewWalkInDialog from './NewWalkInDialog';
import WalkInQueuePanel from './WalkInQueuePanel';
import { getAppointments, startConsultationFromAppointment } from '@/actions/appointments';
import { toISODate } from '@/lib/date-utils';
import type { Appointment } from '@/lib/fhir/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader, PageContainer } from '@/components/ui/PageLayout';
import { useAppointmentsStore } from '@/store/useAppointmentsStore';
import MonthlyCalendar from './MonthlyCalendar';
import FilterDropdown from './FilterDropdown';
import DayTimeline from './DayTimeline';

interface AppointmentsViewProps {
    initialAppointments: Appointment[];
}

export default function AppointmentsView({ initialAppointments }: AppointmentsViewProps) {
    const [view, setView] = useState<'calendar' | 'day' | 'queue'>('calendar');
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [newDialogOpen, setNewDialogOpen] = useState(false);
    const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
    const [hasCleanedUp, setHasCleanedUp] = useState(false);

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const { selectedDate, setSelectedDate, statusFilter } = useAppointmentsStore();

    const selectedAppointment = appointments.find(a => a.id === selectedAppointmentId) || null;

    const todayCount = useMemo(() => {
        const today = new Date().toDateString();
        return appointments.filter(a => new Date(a.start_time).toDateString() === today).length;
    }, [appointments]);

    const queueCount = useMemo(() => {
        return appointments.filter(a => a.queue_position !== null).length;
    }, [appointments]);

    const navigateMonth = (direction: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setSelectedDate(newDate);
    };

    const navigateDay = (direction: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + direction);
        setSelectedDate(newDate);
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayLabel = `${DAY_NAMES[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`;
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    const refreshData = React.useCallback(() => {
        startTransition(async () => {
            const result = await getAppointments({
                date: toISODate(selectedDate),
                status: statusFilter.length > 0 ? statusFilter : undefined
            });
            if (result.data) {
                setAppointments(result.data as unknown as Appointment[]);
            }
        });
    }, [selectedDate, statusFilter]);

    useEffect(() => {
        if (!hasCleanedUp) {
            const cleanup = async () => {
                try {
                    const { cleanupExpiredAppointments } = await import('@/actions/appointments');
                    const result = await cleanupExpiredAppointments();
                    if (result.count && result.count > 0) {
                        console.log(`[Auto-Cleanup] ${result.count} citas expiradas canceladas.`);
                        refreshData();
                    }
                } catch (error) {
                    console.error("Error during appointment cleanup:", error);
                    toast.error('Error al limpiar citas expiradas.');
                } finally {
                    setHasCleanedUp(true);
                }
            };
            cleanup();
        }
    }, [hasCleanedUp, refreshData]);

    useEffect(() => {
        refreshData();
    }, [selectedDate, statusFilter, refreshData]);

    const handleNewAppointment = () => {
        setNewDialogOpen(true);
    };

    const handleEventClick = (apt: Appointment) => {
        setSelectedAppointmentId(apt.id);
        setDetailOpen(true);
    };

    const hasQueueAppointments = appointments.some(a => a.queue_position !== null);

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <PageHeader
                title="Calendario de Citas"
                breadcrumbs={[{ label: 'Citas' }]}
                className="py-4 border-b-0"
            >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-n-2 border border-n-4 text-xs font-medium">
                        <CalendarDays size={12} strokeWidth={1.8} className="text-n-8" />
                        <span className="text-n-8">Citas hoy:</span>
                        <span className="text-n-12 font-semibold">{todayCount}</span>
                    </div>
                    {queueCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-n-2 border border-n-4 text-xs font-medium">
                            <CheckSquare size={12} strokeWidth={1.8} className="text-n-8" />
                            <span className="text-n-8">En cola:</span>
                            <span className="text-n-12 font-semibold">{queueCount}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
<TooltipProvider>
                        <Tabs
                            value={view}
                            onValueChange={(v) => setView(v as 'calendar' | 'day' | 'queue')}
                            className="w-auto"
                        >
                            <TabsList className="bg-transparent p-0 h-9 gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger
                                            value="calendar"
                                            className="h-9 w-9 p-0 bg-transparent rounded-[6px] border border-transparent data-[state=active]:border-n-5 data-[state=active]:bg-n-3 data-[state=active]:shadow-none text-n-8 data-[state=active]:text-n-12 transition-all duration-100 flex items-center justify-center"
                                        >
                                            <CalendarDays size={18} strokeWidth={1.8} />
                                        </TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-n-12 text-n-1 border-n-12">
                                        Vista Mensual
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger
                                            value="day"
                                            className="h-9 w-9 p-0 bg-transparent rounded-[6px] border border-transparent data-[state=active]:border-n-5 data-[state=active]:bg-n-3 data-[state=active]:shadow-none text-n-8 data-[state=active]:text-n-12 transition-all duration-100 flex items-center justify-center"
                                        >
                                            <Clock size={18} strokeWidth={1.8} />
                                        </TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-n-12 text-n-1 border-n-12">
                                        Vista de Día
                                    </TooltipContent>
                                </Tooltip>
                                {hasQueueAppointments && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <TabsTrigger
                                                value="queue"
                                                className="h-9 w-9 p-0 bg-transparent rounded-[6px] border border-transparent data-[state=active]:border-n-5 data-[state=active]:bg-n-3 data-[state=active]:shadow-none text-n-8 data-[state=active]:text-n-12 transition-all duration-100 flex items-center justify-center"
                                            >
                                                <CheckSquare size={18} strokeWidth={1.8} />
                                            </TabsTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-n-12 text-n-1 border-n-12">
                                            Cola de Espera
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </TabsList>
                        </Tabs>
                        </TooltipProvider>

                        {view === 'calendar' && (
                            <>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-md hover:bg-n-2"
                                        onClick={() => navigateMonth(-1)}
                                    >
                                        <ChevronLeft className="w-4 h-4 text-n-8" />
                                    </Button>
                                    <h2 className="text-sm font-semibold text-n-11 capitalize min-w-[120px] text-center">
                                        {MONTHS[currentMonth]} {currentYear}
                                    </h2>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-md hover:bg-n-2"
                                        onClick={() => navigateMonth(1)}
                                    >
                                        <ChevronRight className="w-4 h-4 text-n-8" />
                                    </Button>
                                </div>

                                <FilterDropdown appointments={appointments} />
                            </>
                        )}

                        {view === 'day' && (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-md hover:bg-n-2"
                                    onClick={() => navigateDay(-1)}
                                >
                                    <ChevronLeft className="w-4 h-4 text-n-8" />
                                </Button>
                                <h2 className="text-sm font-semibold text-n-11 min-w-[220px] text-center">
                                    {dayLabel}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-md hover:bg-n-2"
                                    onClick={() => navigateDay(1)}
                                >
                                    <ChevronRight className="w-4 h-4 text-n-8" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
{view !== 'day' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs font-medium text-n-8 hover:text-n-11 hover:bg-n-2"
                            onClick={goToToday}
                        >
                            Hoy
                        </Button>
                    )}

                        <Button
                            size="sm"
                            className="h-8 px-3 gap-1.5 bg-b-8 hover:bg-b-8/90 text-white"
                            onClick={() => handleNewAppointment()}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Nueva Cita</span>
                        </Button>

                        {isPending && <RefreshCw className="w-3.5 h-3.5 text-b-8 animate-spin" />}
                    </div>
                </div>
            </PageHeader>

            <main className="flex-1 overflow-hidden relative">
                <PageContainer size="full" className="h-full p-0 flex flex-col border-t border-border/40">
                    <div className="flex-1 relative">
                        {view === 'calendar' && (
                            <MonthlyCalendar
                                appointments={appointments}
                                onEventClick={handleEventClick}
                                onNewAppointment={handleNewAppointment}
                            />
                        )}
                        {view === 'day' && (
                            <DayTimeline
                                appointments={appointments}
                                onEventClick={handleEventClick}
                                onRefresh={refreshData}
                            />
                        )}
                        {view === 'queue' && (
                            <WalkInQueuePanel
                                appointments={appointments}
                                onSelect={(id) => {
                                    setSelectedAppointmentId(id);
                                    setDetailOpen(true);
                                }}
                                onRefresh={refreshData}
                                onStartConsultation={async (id) => {
                                    const result = await startConsultationFromAppointment(id);
                                    if (result.error) {
                                        toast.error(typeof result.error === 'string' ? result.error : 'Error al iniciar consulta');
                                    } else if (result.success) {
                                        toast.success('Consulta iniciada');
                                        refreshData();
                                        router.push(`/history?patientId=${result.patientId}&encounterId=${result.encounterId || ''}`);
                                    }
                                }}
                            />
                        )}
                    </div>
                </PageContainer>
            </main>

            <AppointmentDetailSheet
                appointment={selectedAppointment}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onAction={refreshData}
            />

            <NewAppointmentDialog
                open={newDialogOpen}
                onOpenChange={setNewDialogOpen}
                onCreated={refreshData}
            />

            <NewWalkInDialog
                open={walkInDialogOpen}
                onOpenChange={setWalkInDialogOpen}
                onCreated={refreshData}
            />
        </div>
    );
}