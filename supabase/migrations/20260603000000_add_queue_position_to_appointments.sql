-- ============================================
-- Add queue_position column to appointments
-- Fix for walk-in queue management
-- ============================================

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS queue_position INTEGER;

CREATE INDEX IF NOT EXISTS idx_appointments_queue_position
ON public.appointments(practitioner_id, clinic_id, queue_position)
WHERE queue_position IS NOT NULL;