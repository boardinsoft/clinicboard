import { isAfter, isBefore, addMinutes, subMinutes, differenceInMinutes } from 'date-fns';
import { Appointment } from '@/lib/fhir/types';

// Business Rule Constants
export const CHECK_IN_WINDOW_MINUTES = 60;     // ±60 minutes from start time
export const NO_SHOW_GRACE_PERIOD_MINUTES = 15; // 15 minutes after start time

export interface TemporalState {
    allowed: boolean;
    reason?: string;
    minutesUntilOpen?: number;
}

/**
 * Checks if the patient is within the check-in window (±CHECK_IN_WINDOW_MINUTES).
 * If endTime is provided, the window closes exactly when the appointment ends.
 */
export function isWithinCheckinWindow(startTime: string | Date, endTime?: string | Date): TemporalState {
    const start = new Date(startTime);
    const now = new Date();
    
    const openingTime = subMinutes(start, CHECK_IN_WINDOW_MINUTES);
    const closingTime = endTime ? new Date(endTime) : addMinutes(start, CHECK_IN_WINDOW_MINUTES);

    if (isBefore(now, openingTime)) {
        return { 
            allowed: false, 
            reason: 'early',
            minutesUntilOpen: differenceInMinutes(openingTime, now)
        };
    }

    if (isAfter(now, closingTime)) {
        return { 
            allowed: false, 
            reason: 'expired' 
        };
    }

    return { allowed: true };
}

/**
 * Checks if an appointment is eligible to be marked as No-Show.
 * A patient can be marked as No-Show if:
 * 1. The appointment's end time has passed.
 */
export function isEligibleForNoShow(endTime: string | Date): boolean {
    const end = new Date(endTime);
    const now = new Date();
    
    // Can mark as noshow once the appointment is over
    return isAfter(now, end);
}

/**
 * Checks if a "Proposed" or "Pending" appointment has expired (more than 24h old).
 */
export function isExpiredProposal(startTime: string | Date): boolean {
    const start = new Date(startTime);
    const now = new Date();
    const expirationThreshold = subMinutes(now, 1440); // 24 hours
    
    return isBefore(start, expirationThreshold);
}

/**
 * Descriptive temporal helper for UI badges.
 */
export function getAppointmentTemporalLabel(appointment: Appointment): string | null {
    if (['fulfilled', 'cancelled', 'noshow'].includes(appointment.status)) return null;

    const start = new Date(appointment.start_time);
    const now = new Date();
    const graceTime = addMinutes(start, NO_SHOW_GRACE_PERIOD_MINUTES);

    if (isAfter(now, graceTime)) {
        return 'VENCIDA';
    }

    const window = isWithinCheckinWindow(start);
    if (window.allowed) {
        return 'EN VENTANA';
    }

    if (window.reason === 'early' && (window.minutesUntilOpen || 0) <= 30) {
        return 'INMINENTE';
    }

    return null;
}

/**
 * Checks if an appointment has a start time in the past (with 15 min grace buffer).
 * Used to prevent starting consultations for expired appointments.
 */
export function isPastAppointment(startTime: string | Date): boolean {
    const start = new Date(startTime);
    const now = new Date();
    const graceBuffer = subMinutes(now, 15); // 15-minute grace period

    return isBefore(start, graceBuffer);
}

/**
 * Checks if an appointment is eligible for automatic No-Show marking.
 * Returns true if more than 24 hours have passed since the appointment end time.
 */
export function isEligibleForAutoNoShow(endTime: string | Date): boolean {
    const end = new Date(endTime);
    const now = new Date();
    const autoNoShowThreshold = subMinutes(now, 24 * 60); // 24 hours ago

    return isBefore(end, autoNoShowThreshold);
}
