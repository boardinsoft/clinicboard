import { z } from 'zod';

export const GenderEnum = z.enum(['male', 'female', 'other', 'unknown']);

export const patientSchema = z.object({
    name_family: z.string().min(2, 'Last name must be at least 2 characters'),
    name_given: z.array(z.string()).min(1, 'At least one given name is required'),
    gender: GenderEnum,
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid ISO date format (YYYY-MM-DD)').optional().or(z.literal('')),
    documentId: z.string().min(1, 'Document ID is required'),
    phone: z.string().optional(),
    email: z.string().email('Invalid email address'),
    address: z.string().optional(),
});

export type PatientSchemaType = z.infer<typeof patientSchema>;
