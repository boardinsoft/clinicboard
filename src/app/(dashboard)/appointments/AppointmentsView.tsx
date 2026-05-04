'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface AppointmentsViewProps {
    initialAppointments: Appointment[];
}

export default function AppointmentsView({ initialAppointments }: AppointmentsViewProps) {
    const [view, setView] = useState<'calendar' | 'queue'>('calendar');
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [newDialogOpen, setNewDialogOpen] = useState(false);
    const [newDialogDate, setNewDialogDate] = useState<Date | undefined>(undefined);
    const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
    const [hasCleanedUp, setHasCleanedUp] = useState(false);

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const { selectedDate, statusFilter } = useAppointmentsStore();

    const selectedAppointment = appointments.find(a => a.id === selectedAppointmentId) || null;

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

    const handleNewAppointment = (date?: Date) => {
        setNewDialogDate(date);
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
                title="Agenda de Citas"
                description="Gestiona tus citas y agenda"
                breadcrumbs={[{ label: 'Citas' }]}
                className="py-4 border-b-0"
            >
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4">
                        <Tabs
                            value={view}
                            onValueChange={(v) => setView(v as 'calendar' | 'queue')}
                            className="w-auto"
                        >
                            <TabsList className="bg-transparent p-0 h-9 gap-4">
                                <TabsTrigger
                                    value="calendar"
                                    className="h-9 px-0 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-b-8 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] font-bold text-n-8 data-[state=active]:text-n-11 transition-all duration-100 gap-1.5"
                                >
                                    Mes
                                </TabsTrigger>
                                {hasQueueAppointments && (
                                    <TabsTrigger
                                        value="queue"
                                        className="h-9 px-0 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-b-8 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] font-bold text-n-8 data-[state=active]:text-n-11 transition-all duration-100 gap-1.5"
                                    >
                                        Cola de Espera
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </Tabs>

                        <FilterDropdown />
                    </div>

                    <div className="flex items-center gap-2">
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
                defaultDate={newDialogDate}
            />

            <NewWalkInDialog
                open={walkInDialogOpen}
                onOpenChange={setWalkInDialogOpen}
                onCreated={refreshData}
            />
        </div>
    );
}