import { z } from 'zod';

export const MedicationStatusEnum = z.enum(['draft', 'active', 'on-hold', 'cancelled', 'completed', 'stopped', 'unknown']);

export const prescriptionSchema = z.object({
    patient_id: z.string().uuid('Invalid patient ID (UUID required)'),
    prescriber_id: z.string().uuid('Invalid prescriber ID (UUID required)'),
    clinic_id: z.string().uuid('Invalid clinic ID (UUID required)'),
    medication_code: z.string().min(1, 'Medication code (ATC/RXNorm) is required'),
    medication_display: z.string().min(1, 'Medication name is required'),
    status: MedicationStatusEnum.optional().default('active'),
    dosage_instruction: z.array(z.string()).min(1, 'At least one dosage instruction is required'),
    note: z.string().optional(),
});

export type PrescriptionSchemaType = z.infer<typeof prescriptionSchema>;

export const ROUTES = [
    { value: 'Oral', label: 'Oral' },
    { value: 'IV', label: 'Intravenosa (IV)' },
    { value: 'IM', label: 'Intramuscular (IM)' },
    { value: 'SC', label: 'Subcutánea (SC)' },
    { value: 'Topica', label: 'Tópica' },
    { value: 'Inhalada', label: 'Inhalada' },
    { value: 'Rectal', label: 'Rectal' },
    { value: 'Sublingual', label: 'Sublingual' },
    { value: 'Oftálmica', label: 'Oftálmica' },
    { value: 'Otológica', label: 'Otológica' },
] as const;

export const FREQUENCIES = [
    { value: 'q8h', label: 'Cada 8 horas (q8h)' },
    { value: 'q12h', label: 'Cada 12 horas (q12h)' },
    { value: 'q24h', label: 'Cada 24 horas (q24h / diaria)' },
    { value: 'q48h', label: 'Cada 48 horas' },
    { value: 'q72h', label: 'Cada 72 horas' },
    { value: 'bid', label: '2 veces al día (BID)' },
    { value: 'tid', label: '3 veces al día (TID)' },
    { value: 'qid', label: '4 veces al día (QID)' },
    { value: 'prn', label: 'Según necesidad (PRN)' },
    { value: 'qh', label: 'Cada hora (qh)' },
    { value: 'q2h', label: 'Cada 2 horas (q2h)' },
    { value: 'q4h', label: 'Cada 4 horas (q4h)' },
    { value: 'q6h', label: 'Cada 6 horas (q6h)' },
    { value: 'ac', label: 'Antes de comidas (AC)' },
    { value: 'pc', label: 'Después de comidas (PC)' },
    { value: 'hs', label: 'Al acostarse (HS)' },
] as const;

export const DURATION_UNITS = [
    { value: 'dias', label: 'Días' },
    { value: 'semanas', label: 'Semanas' },
    { value: 'meses', label: 'Meses' },
] as const;

export interface MedicationItemInput {
    id: string;
    medication_code: string;
    medication_display: string;
    dose: string;
    frequency: string;
    route: string;
    duration_value: string;
    duration_unit: string;
    indications: string;
}

export const medicationItemSchema = z.object({
    medication_code: z.string().min(1, 'Código de medicamento requerido'),
    medication_display: z.string().min(1, 'Nombre del medicamento requerido'),
    dose: z.string().min(1, 'Dosis requerida'),
    frequency: z.string().min(1, 'Frecuencia requerida'),
    route: z.string().min(1, 'Vía de administración requerida'),
    duration_value: z.string().min(1, 'Duración requerida'),
    duration_unit: z.string().min(1, 'Unidad de duración requerida'),
    indications: z.string().optional(),
});

export const createPrescriptionFormSchema = z.object({
    encounter_id: z.string().uuid('Invalid encounter ID'),
    patient_id: z.string().uuid('Invalid patient ID'),
    clinic_id: z.string().uuid('Invalid clinic ID'),
    items: z.array(medicationItemSchema).min(1, 'Agrega al menos un medicamento'),
    notes: z.string().optional(),
    intent: z.string().optional().default('order'),
});

export type CreatePrescriptionFormValues = z.infer<typeof createPrescriptionFormSchema>;
export type MedicationItemSchemaType = z.infer<typeof medicationItemSchema>;