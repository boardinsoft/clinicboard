'use client';

import React, { createContext, useContext, useState } from 'react';
import { Clinic } from '@/lib/supabase/clinic-utils';

interface ActiveClinicContextValue {
    activeClinic: Clinic | null;
    setActiveClinic: (clinic: Clinic | null) => Promise<void>;
    isLoading: boolean;
    isChangingClinic: boolean;
    clinics: Clinic[];
    needsOnboarding: boolean;
    practitionerId: string | null;
}

const ActiveClinicContext = createContext<ActiveClinicContextValue>({
    activeClinic: null,
    setActiveClinic: async () => {},
    isLoading: true,
    isChangingClinic: false,
    clinics: [],
    needsOnboarding: false,
    practitionerId: null,
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
    needsOnboarding?: boolean;
    practitionerId?: string | null;
}

export function ActiveClinicProvider({ children, initialClinic, initialClinics, needsOnboarding = false, practitionerId = null }: ActiveClinicProviderProps) {
    const [activeClinic, setActiveClinicState] = useState<Clinic | null>(initialClinic);
    const [clinics] = useState<Clinic[]>(initialClinics);

    const setActiveClinic = async (clinic: Clinic | null) => {
        if (!clinic) return;
        setActiveClinicState(clinic);
        localStorage.setItem('activeClinic', JSON.stringify(clinic));
        window.dispatchEvent(new CustomEvent('clinicChanged', { detail: clinic }));
    };

    return (
        <ActiveClinicContext.Provider value={{
            activeClinic,
            setActiveClinic,
            isLoading: false,
            isChangingClinic: false,
            clinics,
            needsOnboarding,
            practitionerId,
        }}>
            {children}
        </ActiveClinicContext.Provider>
    );
}