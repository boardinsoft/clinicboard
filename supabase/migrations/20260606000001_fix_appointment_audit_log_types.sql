-- ============================================
-- Fix appointment_audit_log column types
-- old_status and new_status should be TEXT to accept any string value
-- ============================================

ALTER TABLE public.appointment_audit_log
ALTER COLUMN old_status TYPE TEXT,
ALTER COLUMN new_status TYPE TEXT;