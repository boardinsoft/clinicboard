import { create } from 'zustand';
import type { AppointmentStatus } from '@/lib/fhir/types';

interface AppointmentsState {
    selectedDate: Date;
    statusFilter: AppointmentStatus[];
    patientSearch: string;

    setSelectedDate: (date: Date) => void;
    toggleStatusFilter: (status: AppointmentStatus) => void;
    setPatientSearch: (search: string) => void;
    clearAllFilters: () => void;
}

export const useAppointmentsStore = create<AppointmentsState>((set) => ({
    selectedDate: new Date(),
    statusFilter: [],
    patientSearch: '',

    setSelectedDate: (date) => set({ selectedDate: date }),
    toggleStatusFilter: (status) => set((state) => {
        if (state.statusFilter.includes(status)) {
            return { statusFilter: state.statusFilter.filter(s => s !== status) };
        }
        return { statusFilter: [...state.statusFilter, status] };
    }),
    setPatientSearch: (search) => set({ patientSearch: search }),
    clearAllFilters: () => set({ statusFilter: [], patientSearch: '' }),
}));

export const selectHasActiveFilters = (state: AppointmentsState) =>
    state.statusFilter.length > 0 || state.patientSearch.length > 0;

export const selectFilteredCount = (state: AppointmentsState) =>
    state.statusFilter.length;