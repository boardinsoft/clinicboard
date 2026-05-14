import { z } from 'zod';

export const AppointmentStatusEnum = z.enum(['proposed', 'pending', 'booked', 'arrived', 'fulfilled', 'cancelled', 'noshow']);

const dateStringSchema = z.string()
    .refine(val => !isNaN(Date.parse(val)), { message: "Formato de fecha inválido" })
    .refine(val => {
        const date = new Date(val);
        const minutes = date.getMinutes();
        return minutes % 15 === 0;
    }, { message: "La hora debe ser en intervalos de 15 minutos (ej: :00, :15, :30, :45)" });

export const appointmentSchema = z.object({
    patient_id: z.string().uuid('ID de paciente inválido'),
    practitioner_id: z.string().uuid('ID de profesional inválido'),
    clinic_id: z.string().uuid('ID de consultorio inválido').optional(),
    start_time: dateStringSchema,
    end_time: dateStringSchema,
    status: AppointmentStatusEnum,
    description: z.string().optional(),
    appointment_type: z.string().min(1, 'El tipo de atención es requerido'),
});

export type AppointmentSchemaType = z.infer<typeof appointmentSchema>;
