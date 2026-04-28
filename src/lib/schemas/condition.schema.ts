import { z } from 'zod';

export const ClinicalStatusEnum = z.enum(['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved']);

export const conditionSchema = z.object({
    patient_id: z.string().uuid('Invalid patient ID (UUID required)'),
    clinic_id: z.string().uuid('Invalid clinic ID (UUID required)'),
    code: z.string().min(1, 'ICD-10/SNOMED code is required'),
    code_display: z.string().min(1, 'Condition name is required'),
    clinical_status: ClinicalStatusEnum,
    verification_status: z.enum(['unconfirmed', 'provisional', 'differential', 'confirmed', 'refuted', 'entered-in-error']).optional(),
    onset_date: z.string().datetime({ message: 'Invalid ISO datetime' }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid ISO date')).optional(),
    note: z.string().optional(),
});

export type ConditionSchemaType = z.infer<typeof conditionSchema>;
