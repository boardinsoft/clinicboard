import { z } from 'zod';

export const AppointmentStatusEnum = z.enum(['proposed', 'pending', 'booked', 'arrived', 'fulfilled', 'cancelled', 'noshow']);

const dateStringSchema = z.string()
    .refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" })
    .refine(val => {
        const date = new Date(val);
        const minutes = date.getMinutes();
        return minutes % 15 === 0;
    }, { message: "La hora debe ser en intervalos de 15 minutos (ej: :00, :15, :30, :45)" });

export const appointmentSchema = z.object({
    patient_id: z.string().uuid('Invalid patient ID (UUID required)'),
    practitioner_id: z.string().uuid('Invalid practitioner ID (UUID required)'),
    clinic_id: z.string().uuid('Invalid clinic ID (UUID required)'),
    start_time: dateStringSchema,
    end_time: dateStringSchema,
    status: AppointmentStatusEnum,
    description: z.string().optional(),
    appointment_type: z.string().min(1, 'Appointment type is required'),
});

export type AppointmentSchemaType = z.infer<typeof appointmentSchema>;
