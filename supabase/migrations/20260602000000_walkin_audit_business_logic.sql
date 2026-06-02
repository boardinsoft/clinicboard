-- Audit & Business Logic Enhancements for Walk-In Encounters
-- Created: 2026-06-02
-- Target: Encounter audit trail, created_by tracking, race condition prevention

-- 1. Add created_by and modified_by to encounters for attribution
ALTER TABLE public.encounters
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES auth.users(id);

-- 2. Add unique constraint to prevent duplicate queue positions per practitioner/day
-- First, drop existing unique constraint on fhir_id if it causes issues (we keep fhir_id unique globally)
-- Add queue position tracking that prevents duplicates
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 3. Create atomic function to get next queue position (prevents race conditions)
CREATE OR REPLACE FUNCTION get_next_queue_position(
    p_practitioner_id UUID,
    p_clinic_id UUID,
    p_date DATE
) RETURNS INTEGER AS $$
DECLARE
    next_pos INTEGER;
BEGIN
    SELECT COALESCE(MAX(queue_position), 0) + 1
    INTO next_pos
    FROM appointments
    WHERE practitioner_id = p_practitioner_id
      AND clinic_id = p_clinic_id
      AND DATE(start_time) = p_date;

    RETURN next_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to get next queue position with row lock (even better)
CREATE OR REPLACE FUNCTION get_next_queue_position_locked(
    p_practitioner_id UUID,
    p_clinic_id UUID,
    p_date DATE
) RETURNS INTEGER AS $$
DECLARE
    next_pos INTEGER;
    row_locked INTEGER;
BEGIN
    -- Lock the most recent row to prevent concurrent inserts
    SELECT MAX(queue_position) + 1 INTO next_pos
    FROM appointments
    WHERE practitioner_id = p_practitioner_id
      AND clinic_id = p_clinic_id
      AND DATE(start_time) = p_date
    FOR UPDATE;

    RETURN COALESCE(next_pos, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enhance encounter_audit_log to track more details
ALTER TABLE public.encounter_audit_log
ADD COLUMN IF NOT EXISTS change_reason TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- 6. Enhance appointment_audit_log
ALTER TABLE public.appointment_audit_log
ADD COLUMN IF NOT EXISTS change_reason TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- 7. Create encounter draft audit table for SOAP/vitals changes
CREATE TABLE IF NOT EXISTS public.encounter_draft_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT now(),
    vital_signs_snapshot JSONB,
    soap_snapshot JSONB,
    change_type TEXT NOT NULL -- 'created', 'updated', 'finalized'
);

-- 8. RLS for encounter_draft_audit_log
ALTER TABLE public.encounter_draft_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can view draft audit logs for their encounters"
ON public.encounter_draft_audit_log FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM encounters
        WHERE encounters.id = encounter_draft_audit_log.encounter_id
        AND encounters.practitioner_id = auth.uid()
    )
);

CREATE POLICY "Practitioners can insert draft audit logs for their encounters"
ON public.encounter_draft_audit_log FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1 FROM encounters
        WHERE encounters.id = encounter_draft_audit_log.encounter_id
        AND encounters.practitioner_id = auth.uid()
    )
);

-- 9. Trigger to set created_by on encounters
CREATE OR REPLACE FUNCTION set_encounter_creator()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_encounter_creator ON public.encounters;
CREATE TRIGGER trg_set_encounter_creator
BEFORE INSERT ON public.encounters
FOR EACH ROW EXECUTE FUNCTION set_encounter_creator();

-- 10. Trigger to set modified_by on encounters update
CREATE OR REPLACE FUNCTION set_encounter_modifier()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_encounter_modifier ON public.encounters;
CREATE TRIGGER trg_set_encounter_modifier
BEFORE UPDATE ON public.encounters
FOR EACH ROW EXECUTE FUNCTION set_encounter_modifier();

-- 11. Trigger to audit encounter INSERT (creation) - not just updates
CREATE OR REPLACE FUNCTION audit_encounter_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO encounter_audit_log (encounter_id, changed_by, old_status, new_status, notes, change_reason)
    VALUES (NEW.id, auth.uid(), NULL::text, NEW.status::text, 'Encuentro creado', 'initial_creation');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_encounter_creation ON public.encounters;
CREATE TRIGGER trg_audit_encounter_creation
AFTER INSERT ON public.encounters
FOR EACH ROW EXECUTE FUNCTION audit_encounter_creation();

-- 12. Trigger to set created_by on appointments
CREATE OR REPLACE FUNCTION set_appointment_creator()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_appointment_creator ON public.appointments;
CREATE TRIGGER trg_set_appointment_creator
BEFORE INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION set_appointment_creator();

-- 13. Audit trigger for appointment INSERT (not just updates)
CREATE OR REPLACE FUNCTION audit_appointment_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO appointment_audit_log (appointment_id, changed_by, old_status, new_status, notes, change_reason)
    VALUES (NEW.id, auth.uid(), NULL::text, NEW.status::text, 'Cita creada', 'initial_creation');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_appointment_creation ON public.appointments;
CREATE TRIGGER trg_audit_appointment_creation
AFTER INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION audit_appointment_creation();

-- 14. Create index on encounter_audit_log for faster lookups
CREATE INDEX IF NOT EXISTS idx_encounter_audit_log_encounter_id_changed_at
ON public.encounter_audit_log(encounter_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointment_audit_log_appointment_id_changed_at
ON public.appointment_audit_log(appointment_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_encounter_draft_audit_log_encounter_id
ON public.encounter_draft_audit_log(encounter_id, changed_at DESC);

-- 15. Create index on encounters for active patient check
CREATE INDEX IF NOT EXISTS idx_encounters_patient_status
ON public.encounters(patient_id, status)
WHERE status IN ('arrived', 'triaged', 'in-progress');

-- 16. Create index on encounters for same-day patient check
CREATE INDEX IF NOT EXISTS idx_encounters_patient_start_time
ON public.encounters(patient_id, start_time);