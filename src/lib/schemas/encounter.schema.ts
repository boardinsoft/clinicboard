import { z } from 'zod';

export const EncounterStatusEnum = z.enum(['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled']);

/** Schema del evento clínico (tabla encounters) */
export const encounterSchema = z.object({
    patient_id: z.string().uuid('ID de paciente inválido (se requiere UUID)'),
    practitioner_id: z.string().uuid('ID de profesional inválido (se requiere UUID)'),
    appointment_id: z.string().uuid('Se requiere una cita válida para crear un encuentro'),
    encounter_class: z.enum(['AMB', 'IMP', 'EMER', 'HH'], {
        error: () => 'Clase debe ser AMB, IMP, EMER o HH',
    }),
    encounter_category: z.string().optional().nullable(),
    encounter_subcategory: z.string().optional().nullable(),
    status: EncounterStatusEnum.optional().default('planned'),
    start_time: z.string().datetime({ message: 'Fecha/hora inválida (se requiere ISO 8601)' }),
    end_time: z.string().datetime().optional().nullable(),
    vital_signs: z.object({
        temperature: z.number().optional(),
        blood_pressure_systolic: z.number().optional(),
        blood_pressure_diastolic: z.number().optional(),
        heart_rate: z.number().optional(),
        oxygen_saturation: z.number().optional(),
        weight: z.number().optional(),
        height: z.number().optional(),
    }).optional(),
});

/** Schema de la nota clínica SOAP (tabla clinical_notes) */
export const clinicalNoteSchema = z.object({
    subjective: z.string().optional().nullable(),
    objective: z.string().optional().nullable(),
    analysis: z.string().optional().nullable(),
    plan: z.string().optional().nullable(),
    evolution_note: z.string().optional().nullable(),
    physical_exam: z.any().optional(),
    diagnosis: z.any().optional(),
    reason_code: z.any().optional(),
    is_finalized: z.boolean().optional().default(false),
});

export type EncounterSchemaType = z.infer<typeof encounterSchema>;
export type ClinicalNoteSchemaType = z.infer<typeof clinicalNoteSchema>;
