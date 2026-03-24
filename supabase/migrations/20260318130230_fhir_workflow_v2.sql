-- Medical Workflow & FHIR R4 Enhancements
-- Created: 2026-03-18
-- Target: Appointment & Encounter logic, Audit Logs and Addenda

-- 1. Extend Encounters with SOAP and Clinical Fields
ALTER TABLE public.encounters 
ADD COLUMN IF NOT EXISTS subjective TEXT,
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS analysis TEXT,
ADD COLUMN IF NOT EXISTS physical_exam JSONB DEFAULT '{}'::jsonb;

-- 2. Audit Logs for Appointments
CREATE TABLE IF NOT EXISTS public.appointment_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id),
    old_status appointment_status,
    new_status appointment_status,
    changed_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

-- 3. Audit Logs for Encounters
CREATE TABLE IF NOT EXISTS public.encounter_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id),
    old_status TEXT, -- Store transition text
    new_status TEXT,
    changed_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

-- 4. Clinical Addenda for Finalized Encounters
CREATE TABLE IF NOT EXISTS public.encounter_addenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS Policies
ALTER TABLE public.appointment_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounter_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounter_addenda ENABLE ROW LEVEL SECURITY;

-- Policies for Audit Logs
CREATE POLICY "Practitioners can view audit logs for their appointments" 
ON public.appointment_audit_log FOR SELECT 
TO public 
USING (
    EXISTS (
        SELECT 1 FROM appointments 
        WHERE appointments.id = appointment_audit_log.appointment_id 
        AND appointments.practitioner_id = auth.uid()
    )
);

CREATE POLICY "Practitioners can view audit logs for their encounters" 
ON public.encounter_audit_log FOR SELECT 
TO public 
USING (
    EXISTS (
        SELECT 1 FROM encounters 
        WHERE encounters.id = encounter_audit_log.encounter_id 
        AND encounters.practitioner_id = auth.uid()
    )
);

-- Policies for Addenda
CREATE POLICY "Practitioners can view addenda for their encounters" 
ON public.encounter_addenda FOR SELECT 
TO public 
USING (
    EXISTS (
        SELECT 1 FROM encounters 
        WHERE encounters.id = encounter_addenda.encounter_id 
        AND encounters.practitioner_id = auth.uid()
    )
);

CREATE POLICY "Practitioners can add addenda to their finished encounters" 
ON public.encounter_addenda FOR INSERT 
TO public 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM encounters 
        WHERE encounters.id = encounter_addenda.encounter_id 
        AND encounters.practitioner_id = auth.uid()
        AND encounters.status = 'finished'
    )
);

-- 6. Functions & Triggers

-- Audit Trigger: Appointments
CREATE OR REPLACE FUNCTION audit_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO appointment_audit_log (appointment_id, changed_by, old_status, new_status, notes)
        VALUES (NEW.id, auth.uid(), OLD.status, NEW.status, 'Cambio de estado automatizado o por usuario');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_audit_appointment_status
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION audit_appointment_status_change();

-- Audit Trigger: Encounters
CREATE OR REPLACE FUNCTION audit_encounter_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO encounter_audit_log (encounter_id, changed_by, old_status, new_status, notes)
        VALUES (NEW.id, auth.uid(), OLD.status::text, NEW.status::text, 'Cambio de estado del encuentro');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_audit_encounter_status
AFTER UPDATE ON public.encounters
FOR EACH ROW EXECUTE FUNCTION audit_encounter_status_change();

-- Appointment Validation Business Logic
CREATE OR REPLACE FUNCTION validate_appointment_logic()
RETURNS TRIGGER AS $$
DECLARE
    has_overlap BOOLEAN;
BEGIN
    -- Only validate on INSERT or if times CHANGE
    IF (TG_OP = 'INSERT' OR (OLD.start_time IS DISTINCT FROM NEW.start_time OR OLD.end_time IS DISTINCT FROM NEW.end_time)) THEN
        
        -- 1. No Future Only (FHIR Rule: can be past if it was recorded after, but for scheduling we enforce future)
        IF (NEW.start_time < (now() - interval '5 minutes')) THEN
            RAISE EXCEPTION 'No se pueden agendar o mover citas al pasado.';
        END IF;

        -- 2. Chronological
        IF (NEW.end_time <= NEW.start_time) THEN
            RAISE EXCEPTION 'La hora de fin debe ser posterior a la de inicio.';
        END IF;

        -- 3. 15min Increments
        IF (EXTRACT(MINUTE FROM NEW.start_time)::integer % 15 != 0 OR EXTRACT(MINUTE FROM NEW.end_time)::integer % 15 != 0) THEN
            RAISE EXCEPTION 'Las citas deben estar en intervalos de 15 minutos.';
        END IF;

        -- 4. Overlap Check
        SELECT EXISTS (
            SELECT 1 FROM appointments
            WHERE practitioner_id = NEW.practitioner_id
            AND status NOT IN ('cancelled', 'noshow')
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
            AND (
                (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
                (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
                (NEW.start_time <= start_time AND NEW.end_time >= end_time)
            )
        ) INTO has_overlap;

        IF has_overlap THEN
            RAISE EXCEPTION 'El médico ya tiene una cita agendada en este horario.';
        END IF;
    END IF;

    -- Prevent modifying terminal states
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IN ('fulfilled', 'cancelled', 'noshow') AND NEW.status != OLD.status) THEN
            RAISE EXCEPTION 'No se puede cambiar el estado de una cita finalizada o cancelada.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_appointments_business_rules
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION validate_appointment_logic();

-- Transition Validation for FHIR R4 (Appointments)
CREATE OR REPLACE FUNCTION validate_appointment_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status = NEW.status) THEN
        RETURN NEW;
    END IF;

    CASE OLD.status
        WHEN 'proposed' THEN
            IF NEW.status NOT IN ('pending', 'booked', 'cancelled') THEN
                RAISE EXCEPTION 'Transición inválida desde proposed a %', NEW.status;
            END IF;
        WHEN 'pending' THEN
            IF NEW.status NOT IN ('booked', 'cancelled') THEN
                RAISE EXCEPTION 'Transición inválida desde pending a %', NEW.status;
            END IF;
        WHEN 'booked' THEN
            IF NEW.status NOT IN ('arrived', 'cancelled', 'noshow') THEN
                RAISE EXCEPTION 'Transición inválida desde booked a %', NEW.status;
            END IF;
        WHEN 'arrived' THEN
            IF NEW.status NOT IN ('fulfilled', 'cancelled', 'noshow') THEN
                RAISE EXCEPTION 'Transición inválida desde arrived a %', NEW.status;
            END IF;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_validate_appointment_transition
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION validate_appointment_transition();

-- Soft Delete Prevention
CREATE OR REPLACE FUNCTION prevent_appointment_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'No se permite borrar citas físicamente. Cambie el estado a "cancelled".';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_prevent_hard_delete_appointments
BEFORE DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION prevent_appointment_delete();
