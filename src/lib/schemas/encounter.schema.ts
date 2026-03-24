import { z } from 'zod';

export const EncounterStatusEnum = z.enum(['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled']);

export const encounterSchema = z.object({
    patient_id: z.string().uuid('Invalid patient ID (UUID required)'),
    practitioner_id: z.string().uuid('Invalid practitioner ID (UUID required)'),
    encounter_class: z.enum(['AMB', 'IMP', 'EMER', 'HH'], { error: () => 'Class must be AMB, IMP, EMER, or HH' }),
    status: EncounterStatusEnum.optional().default('planned'),
    start_time: z.string().datetime({ message: 'Invalid ISO datetime' }),
    end_time: z.string().datetime().optional().nullable(),
    appointment_id: z.string().uuid().optional().nullable(),
    vital_signs: z.object({
        temperature: z.number().optional(),
        blood_pressure_systolic: z.number().optional(),
        blood_pressure_diastolic: z.number().optional(),
        heart_rate: z.number().optional(),
        oxygen_saturation: z.number().optional(),
        weight: z.number().optional(),
        height: z.number().optional(),
    }).optional(),
    physical_exam: z.any().optional(),
    subjective: z.string().optional().nullable(),
    objective: z.string().optional().nullable(),
    analysis: z.string().optional().nullable(),
    plan: z.string().optional().nullable(),
    evolution_note: z.string().optional().nullable(),
    diagnosis: z.any().optional(),
    reason_code: z.any().optional(),
    encounter_category: z.string().optional().nullable(),
    encounter_subcategory: z.string().optional().nullable(),
});

export type EncounterSchemaType = z.infer<typeof encounterSchema>;
