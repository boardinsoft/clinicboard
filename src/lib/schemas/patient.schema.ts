import { z } from 'zod';

export const GenderEnum = z.enum(['male', 'female', 'other', 'unknown']);

export const patientSchema = z.object({
    name_family: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    name_given: z.array(z.string()).min(1, 'Se requiere al menos un nombre'),
    gender: GenderEnum,
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional().or(z.literal('')),
    documentId: z.string().min(1, 'El número de identificación es requerido'),
    phone: z.string().optional(),
    email: z.string().email('Correo electrónico inválido'),
    address: z.string().optional(),
});

export type PatientSchemaType = z.infer<typeof patientSchema>;
