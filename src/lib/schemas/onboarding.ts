import { z } from 'zod';

export const profileStepSchema = z.object({
    name_given: z.array(z.string()).min(1, 'Al menos un nombre es requerido'),
    name_family: z.string().min(1, 'Apellido es requerido'),
    specialty: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
});

export const clinicStepSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(50, 'El nombre no puede exceder 50 caracteres'),
    slug: z.string()
        .min(3, 'El slug debe tener al menos 3 caracteres')
        .max(30, 'El slug no puede exceder 30 caracteres')
        .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
});

export const locationStepSchema = z.object({
    address: z.string().optional(),
    phone: z.string().optional(),
});

export const inviteStepSchema = z.object({
    emails: z.array(z.string().email('Email inválido')).optional(),
    role: z.enum(['doctor', 'receptionist']).optional(),
});

export type ProfileStepData = z.infer<typeof profileStepSchema>;
export type ClinicStepData = z.infer<typeof clinicStepSchema>;
export type LocationStepData = z.infer<typeof locationStepSchema>;
export type InviteStepData = z.infer<typeof inviteStepSchema>;

export interface OnboardingState {
    userId?: string;
    currentStep: 1 | 2 | 3 | 4;
    startedAt?: string;
    profile?: ProfileStepData;
    clinic?: ClinicStepData;
    location?: LocationStepData;
    completedAt?: string;
    clinicId?: string;
    practitionerId?: string;
}

export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30);
}

export function saveOnboardingState(state: OnboardingState): void {
    if (typeof window === 'undefined') return;
    const key = `onboarding_state_${state.userId || 'temp'}`;
    localStorage.setItem(key, JSON.stringify(state));
}

export function loadOnboardingState(userId: string): OnboardingState | null {
    if (typeof window === 'undefined') return null;
    const key = `onboarding_state_${userId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

export function clearOnboardingState(userId: string): void {
    if (typeof window === 'undefined') return;
    const key = `onboarding_state_${userId}`;
    localStorage.removeItem(key);
}