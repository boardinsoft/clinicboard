'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Clinic } from '@/lib/supabase/clinic-utils';

interface ActiveClinicContextValue {
    activeClinic: Clinic | null;
    setActiveClinic: (clinic: Clinic | null) => Promise<void>;
    isLoading: boolean;
    isChangingClinic: boolean;
    clinics: Clinic[];
}

const ActiveClinicContext = createContext<ActiveClinicContextValue>({
    activeClinic: null,
    setActiveClinic: async () => {},
    isLoading: true,
    isChangingClinic: false,
    clinics: [],
});

export function useActiveClinic() {
    const context = useContext(ActiveClinicContext);
    if (!context) {
        throw new Error('useActiveClinic must be used within ActiveClinicProvider');
    }
    return context;
}

interface ActiveClinicProviderProps {
    children: React.ReactNode;
    initialClinic: Clinic | null;
    initialClinics: Clinic[];
}

export function ActiveClinicProvider({ children, initialClinic, initialClinics }: ActiveClinicProviderProps) {
    const [activeClinic, setActiveClinicState] = useState<Clinic | null>(initialClinic);
    const [isLoading, setIsLoading] = useState(true);
    const [isChangingClinic, setIsChangingClinic] = useState(false);
    const [clinics, setClinics] = useState<Clinic[]>(initialClinics);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const handleClinicChanged = (event: CustomEvent<Clinic>) => {
            setActiveClinicState(event.detail);
        };

        window.addEventListener('clinicChanged', handleClinicChanged as EventListener);

        const stored = localStorage.getItem('activeClinic');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setActiveClinicState(parsed);
            } catch {
                // ignore
            }
        }

        return () => {
            window.removeEventListener('clinicChanged', handleClinicChanged as EventListener);
        };
    }, []);

    const setActiveClinic = useCallback(async (clinic: Clinic | null) => {
        if (!clinic) return;

        setIsChangingClinic(true);

        try {
            setActiveClinicState(clinic);
            localStorage.setItem('activeClinic', JSON.stringify(clinic));

            window.dispatchEvent(new CustomEvent('clinicChanged', { detail: clinic }));
        } finally {
            setIsChangingClinic(false);
        }
    }, []);

    return (
        <ActiveClinicContext.Provider value={{
            activeClinic,
            setActiveClinic,
            isLoading,
            isChangingClinic,
            clinics,
        }}>
            {children}
        </ActiveClinicContext.Provider>
    );
}