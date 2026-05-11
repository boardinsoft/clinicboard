import { z } from 'zod';

export const RESERVED_SLUGS = [
    'admin', 'api', 'www', 'mail', 'ftp', 'test', 'demo',
    'clinicboard', 'clinic', 'doctor', 'patient', 'onboarding',
    'login', 'signup', 'register', 'dashboard', 'settings',
    'profile', 'users', 'staff', 'team', 'help', 'support',
];

export const VENEZUELA_STATES = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas',
    'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital',
    'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda',
    'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira',
    'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia',
] as const;

export const VENEZUELA_CITIES: Record<string, string[]> = {
    'Amazonas': ['Puerto Ayacucho'],
    'Anzoátegui': ['Barcelona', 'Puerto La Cruz', 'Anaco', 'Cumanacoa', 'Onoto'],
    'Apure': ['San Fernando de Apure', 'Achaguas', 'Biruaca'],
    'Aragua': ['Maracay', 'Turmero', 'La Victoria', 'Cagua', 'Ocumare del Tuy'],
    'Barinas': ['Barinas', 'Barinas del Norte', 'Socopó'],
    'Bolívar': ['Ciudad Bolívar', 'Ciudad Guayana', 'Upata', 'El Callao'],
    'Carabobo': ['Valencia', 'Puerto Cabello', 'Naguanagua', 'La Isabelica', 'Los Mangeles'],
    'Cojedes': ['San Carlos', 'Tinaquillo', 'La Rivera'],
    'Delta Amacuro': ['Tucupita', 'Curiapo', 'Capalita'],
    'Distrito Capital': ['Caracas'],
    'Falcón': ['Coro', 'Punto Fijo', 'Churuguara', 'Mendoza'],
    'Guárico': ['San Juan de los Morros', 'Calabocito', 'El Socorro', 'Tucupido'],
    'Lara': ['Barquisimeto', 'Carora', 'Duaca', 'Quibor', 'Sarare'],
    'Mérida': ['Mérida', 'Ejido', 'Lagunillas', 'Tovar', 'La Azulita'],
    'Miranda': ['Los Teques', 'Carrizal', 'Chacao', 'Cúa', 'Guarenas'],
    'Monagas': ['Maturín', 'Punta de Mata', 'Caripito', 'Barrancas'],
    'Nueva Esparta': ['La Asunción', 'Porlamar', 'Juan Griego', 'Pampatar'],
    'Portuguesa': ['Acarigua', 'Guanare', 'Ospino', 'Pampangui'],
    'Sucre': ['Cumaná', 'Cumanacoa', 'Carúpano', 'Río Chico'],
    'Táchira': ['San Cristóbal', 'Táriba', 'La Grita', 'Ureña', 'Rubio'],
    'Trujillo': ['Trujillo', 'Valera', 'Boconó', 'Miranda'],
    'La Guaira': ['La Guaira', 'Catia La Mar', 'Macuto', 'Carayaca'],
    'Yaracuy': ['San Felipe', 'Chivacoa', 'Yaritagua', 'Aroa'],
    'Zulia': ['Maracaibo', 'San Francisco', 'Cabimas', 'Ciudad Ojeda', 'Machiques'],
};

export const profileStepSchema = z.object({
    name_given: z.array(z.string())
        .min(1, 'Ingresa al menos un nombre')
        .max(50, 'Máximo 50 caracteres')
        .refine(
            (val) => val.every((n) => /^[a-zA-ZáéíóúñÑ\s-]+$/.test(n)),
            'Solo letras, espacios y guiones'
        ),
    name_family: z.string()
        .min(1, 'El apellido es requerido')
        .max(50, 'Máximo 50 caracteres')
        .refine((val) => /^[a-zA-ZáéíóúñÑ\s-]+$/.test(val), 'Solo letras, espacios y guiones'),
    specialty: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
    license_number: z.string()
        .max(30, 'La matrícula no puede exceder 30 caracteres')
        .regex(/^\d{1,2}\.\d{2,4}$/, 'Formato inválido. Ej: 25.456 o 25.1234')
        .optional()
        .or(z.literal('').transform(() => undefined)),
});

export const clinicStepSchema = z.object({
    name: z.string()
        .min(3, 'Mínimo 3 caracteres')
        .max(50, 'Máximo 50 caracteres')
        .refine((val) => !/[\u{1F300}-\u{1F9FF}]/u.test(val), 'No emojis')
        .refine((val) => /^[a-zA-ZáéíóúñÑ0-9\s&.,'\-]+$/.test(val), 'Solo letras, números y los símbolos &.,\'-'),
    slug: z.string()
        .min(3, 'Mínimo 3 caracteres')
        .max(30, 'Máximo 30 caracteres')
        .regex(/^[a-z]+(?:-[a-z]+)*$/, 'Solo letras minúsculas y guiones')
        .refine((val) => !val.startsWith('-') && !val.endsWith('-'), 'Sin guiones al inicio o final')
        .refine((val) => !RESERVED_SLUGS.includes(val), 'URL no disponible'),
});

export const locationStepSchema = z.object({
    state: z.string().min(1, 'Selecciona un estado'),
    city: z.string().min(1, 'Selecciona una ciudad'),
    address: z.string().max(200, 'Máximo 200 caracteres').optional(),
    phone: z.string()
        .regex(/^\+58\s?\d{3}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/, 
            'Formato: +58 XXX-XXX-XX-XX (ej: +58 212-555-1234)'),
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
        .replace(/[^a-z\s-]/g, '')
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