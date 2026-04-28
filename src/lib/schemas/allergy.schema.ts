import { z } from 'zod';

export const CriticalityEnum = z.enum(['low', 'high', 'unable-to-assess']);
export const CategoryEnum = z.enum(['food', 'medication', 'environment', 'biologic']);
export const AllergyTypeEnum = z.enum(['allergy', 'intolerance']);

export const allergySchema = z.object({
    patient_id: z.string().uuid('Invalid patient ID (UUID required)'),
    clinic_id: z.string().uuid('Invalid clinic ID (UUID required)'),
    code: z.string().min(1, 'Allergen code is required'),
    code_display: z.string().min(1, 'Allergen name is required'),
    allergy_type: AllergyTypeEnum.optional().default('allergy'),
    category: z.array(CategoryEnum).min(1, 'At least one category is required'),
    criticality: CriticalityEnum.optional().default('low'),
    clinical_status: z.enum(['active', 'inactive', 'resolved']).optional().default('active'),
    note: z.string().optional(),
});

export type AllergySchemaType = z.infer<typeof allergySchema>;
