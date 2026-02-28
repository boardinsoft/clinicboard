import { z } from 'zod';

export const AppointmentStatusEnum = z.enum(['proposed', 'pending', 'booked', 'arrived', 'fulfilled', 'cancelled', 'noshow']);

export const appointmentSchema = z.object({
    patient_id: z.string().uuid('Invalid patient ID (UUID required)'),
    practitioner_id: z.string().uuid('Invalid practitioner ID (UUID required)'),
    start_time: z.string().datetime({ message: 'Invalid ISO datetime' }),
    end_time: z.string().datetime({ message: 'Invalid ISO datetime' }),
    status: AppointmentStatusEnum.optional().default('proposed'),
    description: z.string().optional(),
    appointment_type: z.string().min(1, 'Appointment type is required'),
}).refine((data) => {
    const start = new Date(data.start_time).getTime();
    const end = new Date(data.end_time).getTime();
    return end > start;
}, {
    message: "End time must be after start time",
    path: ["end_time"],
});

export type AppointmentSchemaType = z.infer<typeof appointmentSchema>;
