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
