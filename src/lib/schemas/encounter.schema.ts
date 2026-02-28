import { z } from 'zod';

export const EncounterStatusEnum = z.enum(['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled']);

export const encounterSchema = z.object({
    patient_id: z.string().uuid('Invalid patient ID (UUID required)'),
    practitioner_id: z.string().uuid('Invalid practitioner ID (UUID required)'),
    encounter_class: z.enum(['AMB', 'IMP', 'EMER', 'HH'], { errorMap: () => ({ message: 'Class must be AMB, IMP, EMER, or HH' }) }),
    status: EncounterStatusEnum.optional().default('planned'),
    start_time: z.string().datetime({ message: 'Invalid ISO datetime' }),
    vital_signs: z.object({
        temperature: z.number().optional(),
        blood_pressure_systolic: z.number().optional(),
        blood_pressure_diastolic: z.number().optional(),
        heart_rate: z.number().optional(),
        oxygen_saturation: z.number().optional(),
        weight: z.number().optional(),
        height: z.number().optional(),
    }).optional(),
    evolution_note: z.string().optional(),
});

export type EncounterSchemaType = z.infer<typeof encounterSchema>;
