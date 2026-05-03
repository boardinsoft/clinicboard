import { create } from 'zustand';
import type { AppointmentStatus } from '@/lib/fhir/types';

interface AppointmentsState {
    selectedDate: Date;
    statusFilter: AppointmentStatus[];

    openCalendar: boolean;
    openFilters: boolean;
    openStats: boolean;

    setSelectedDate: (date: Date) => void;
    setStatusFilter: (statuses: AppointmentStatus[]) => void;
    toggleStatusFilter: (status: AppointmentStatus) => void;
    setOpenCalendar: (open: boolean) => void;
    setOpenFilters: (open: boolean) => void;
    setOpenStats: (open: boolean) => void;
}

export const useAppointmentsStore = create<AppointmentsState>((set) => ({
    selectedDate: new Date(),
    statusFilter: [],

    openCalendar: true,
    openFilters: true,
    openStats: false,

    setSelectedDate: (date) => set({ selectedDate: date }),
    setStatusFilter: (statuses) => set({ statusFilter: statuses }),
    toggleStatusFilter: (status) => set((state) => {
        if (state.statusFilter.includes(status)) {
            return { statusFilter: state.statusFilter.filter(s => s !== status) };
        }
        return { statusFilter: [...state.statusFilter, status] };
    }),
    setOpenCalendar: (open) => set({ openCalendar: open }),
    setOpenFilters: (open) => set({ openFilters: open }),
    setOpenStats: (open) => set({ openStats: open }),
}));