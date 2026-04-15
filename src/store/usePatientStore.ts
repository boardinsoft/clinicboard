import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PatientTab {
    id: string; // patientId o "new"
    name: string;
    url: string;
    isDirty?: boolean;
    lastActive?: number;
}

export interface ClinicalState {
    reason?: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    vitals?: Record<string, string | number>;
    diagnoses?: { code: string; display?: string }[];
    [key: string]: unknown;
}

interface PatientStore {
    // Pestañas de pacientes
    tabs: PatientTab[];
    activePatientId: string | null; // ID del paciente activo o "new"
    
    // Métodos de pestañas
    openPatientTab: (patient: { id: string; name: string }) => void;
    closePatientTab: (id: string) => void;
    setActivePatient: (id: string | null) => void;
    
    // Estado clínico persistente (indexado por patientId)
    clinicalStates: Record<string, ClinicalState>;
    updateClinicalState: (patientId: string, updates: Partial<ClinicalState>) => void;
    clearClinicalState: (patientId: string) => void;
    
    // UI State por paciente (ej: qué sub-tab está abierta en su ficha)
    viewStates: Record<string, { activeSubTab: string }>;
    setPatientView: (patientId: string, subTab: string) => void;
}

export const usePatientStore = create<PatientStore>()(
    persist(
        (set, get) => ({
            tabs: [],
            activePatientId: null,
            clinicalStates: {},
            viewStates: {},

            openPatientTab: (patient) => {
                const { tabs } = get();
                const exists = tabs.find(t => t.id === patient.id);
                
                if (!exists) {
                    const newTab: PatientTab = {
                        id: patient.id,
                        name: patient.name,
                        url: `/patients/${patient.id}`,
                        lastActive: Date.now()
                    };
                    set({ 
                        tabs: [...tabs, newTab].slice(-8), // Limitar a 8 pacientes concurrentes
                        activePatientId: patient.id 
                    });
                } else {
                    set({ 
                        activePatientId: patient.id,
                        tabs: tabs.map(t => t.id === patient.id ? { ...t, lastActive: Date.now() } : t)
                    });
                }
            },

            closePatientTab: (id) => {
                const { tabs, activePatientId } = get();
                const newTabs = tabs.filter(t => t.id !== id);
                
                let nextActive = activePatientId;
                if (activePatientId === id) {
                    nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
                }
                
                set({ tabs: newTabs, activePatientId: nextActive });
            },

            setActivePatient: (id) => set({ activePatientId: id }),

            updateClinicalState: (patientId, updates) => {
                set((state) => ({
                    clinicalStates: {
                        ...state.clinicalStates,
                        [patientId]: {
                            ...(state.clinicalStates[patientId] || {}),
                            ...updates
                        }
                    },
                    // Al actualizar estado clínico, marcamos la pestaña como dirty
                    tabs: state.tabs.map(t => t.id === patientId ? { ...t, isDirty: true } : t)
                }));
            },

            clearClinicalState: (patientId) => {
                set((state) => {
                    const newStates = { ...state.clinicalStates };
                    delete newStates[patientId];
                    return { 
                        clinicalStates: newStates,
                        tabs: state.tabs.map(t => t.id === patientId ? { ...t, isDirty: false } : t)
                    };
                });
            },

            setPatientView: (patientId, subTab) => {
                set((state) => ({
                    viewStates: {
                        ...state.viewStates,
                        [patientId]: { activeSubTab: subTab }
                    }
                }));
            }
        }),
        {
            name: 'clinicboard:patient-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                tabs: state.tabs,
                clinicalStates: state.clinicalStates,
                viewStates: state.viewStates
            })
        }
    )
);
