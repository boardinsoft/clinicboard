'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { Button } from '@/components/ui/button';
import { 
    CalendarDays, 
    LayoutGrid, 
    Plus, 
    RefreshCw,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppointmentsSidebar from './AppointmentsSidebar';
import AppointmentsTimeline from './AppointmentsTimeline';
import AppointmentsKanban from './AppointmentsKanban';
import AppointmentDetailSheet from './AppointmentDetailSheet';
import NewAppointmentDialog from './NewAppointmentDialog';
import { getAppointments } from '@/actions/appointments';
import { nowInVE, toISODate } from '@/lib/date-utils';
import type { Appointment, AppointmentStatus } from '@/lib/fhir/types';
import { toast } from 'sonner';

interface AppointmentsViewProps {
    initialAppointments: Appointment[];
}

export default function AppointmentsView({ initialAppointments }: AppointmentsViewProps) {
    const [view, setView] = useState<'timeline' | 'kanban'>('timeline');
    const [selectedDate, setSelectedDate] = useState<Date>(nowInVE());
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus[]>([]);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [newDialogOpen, setNewDialogOpen] = useState(false);
    const [hasCleanedUp, setHasCleanedUp] = useState(false);

    const [isPending, startTransition] = useTransition();

    const { setSecondaryPanel } = useLayoutStore();

    const selectedAppointment = appointments.find(a => a.id === selectedAppointmentId) || null;

    // Refresh data when criteria change
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

    // Auto-cleanup expired appointments on mount
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
    }, [refreshData]);

    // Handle Sidebar Mounting
    useEffect(() => {
        setSecondaryPanel(
            <AppointmentsSidebar
                appointments={appointments}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedId={selectedAppointmentId}
                onSelect={(id) => {
                    setSelectedAppointmentId(id);
                    setDetailOpen(true);
                }}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onNew={() => setNewDialogOpen(true)}
            />,
            'Agenda'
        );
    }, [appointments, selectedDate, selectedAppointmentId, statusFilter, setSecondaryPanel]);

    const handleNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    const handlePrevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Header Content Area */}
            <header className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between border-b gap-4 bg-background">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Citas Médicas</h1>
                        {isPending && <RefreshCw className="w-4 h-4 text-primary animate-spin" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        Gestión de agenda y flujo de pacientes — <span className="text-primary/70">FHIR R4</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Switcher */}
                    <Tabs 
                        value={view} 
                        onValueChange={(v) => setView(v as 'timeline' | 'kanban')}
                        className="w-auto"
                    >
                        <TabsList className="bg-muted/50 p-1 h-9">
                            <TabsTrigger 
                                value="timeline" 
                                className="px-3 py-1.5 text-xs gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Día</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="kanban" 
                                className="px-3 py-1.5 text-xs gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Flujo</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block" />

                    <div className="flex items-center bg-muted/30 rounded-lg p-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 hover:bg-background shadow-xs transition-hover"
                            onClick={handlePrevDay}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs font-semibold gap-1.5 hover:bg-background shadow-xs transition-hover"
                            onClick={() => setSelectedDate(nowInVE())}
                        >
                            <CalendarIcon className="w-3 h-3 text-primary" />
                            Hoy
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 hover:bg-background shadow-xs transition-hover"
                            onClick={handleNextDay}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button 
                        size="sm" 
                        className="h-9 gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                        onClick={() => setNewDialogOpen(true)}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nueva Cita</span>
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0">
                    {view === 'timeline' ? (
                        <AppointmentsTimeline 
                            appointments={appointments}
                            onSelect={(id) => {
                                setSelectedAppointmentId(id);
                                setDetailOpen(true);
                            }}
                            selectedId={selectedAppointmentId}
                            selectedDate={selectedDate}
                        />
                    ) : (
                        <AppointmentsKanban 
                            appointments={appointments}
                            onSelect={(id) => {
                                setSelectedAppointmentId(id);
                                setDetailOpen(true);
                            }}
                            selectedId={selectedAppointmentId}
                        />
                    )}
                </div>

                {/* Dialogs and Sheets */}
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
            </main>
        </div>
    );
}
