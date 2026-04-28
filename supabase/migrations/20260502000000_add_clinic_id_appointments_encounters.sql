-- Add clinic_id to appointments and encounters tables for complete multitenancy
-- This enables doctors working at multiple clinics to associate appointments
-- and encounters with the correct clinic

-- appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);

-- Backfill from patients (get clinic_id from the patient assigned to the appointment)
UPDATE appointments
SET clinic_id = p.clinic_id
FROM patients p
WHERE appointments.patient_id = p.id
  AND appointments.clinic_id IS NULL;

-- encounters table
ALTER TABLE encounters ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);
CREATE INDEX IF NOT EXISTS idx_encounters_clinic_id ON encounters(clinic_id);

-- Backfill from appointments (encounters have appointment_id which has clinic_id)
UPDATE encounters
SET clinic_id = a.clinic_id
FROM appointments a
WHERE encounters.appointment_id = a.id
  AND encounters.clinic_id IS NULL;

-- Update RLS for appointments
DROP POLICY IF EXISTS "appointments_read" ON appointments;
CREATE POLICY "appointments_read" ON appointments FOR SELECT USING (
    clinic_id IN (
        SELECT clinic_id FROM clinic_practitioners
        WHERE practitioner_id = auth.uid() AND active = true
    )
);

DROP POLICY IF EXISTS "appointments_insert" ON appointments;
CREATE POLICY "appointments_insert" ON appointments FOR INSERT WITH CHECK (
    clinic_id IN (
        SELECT clinic_id FROM clinic_practitioners
        WHERE practitioner_id = auth.uid() AND active = true
    )
);

DROP POLICY IF EXISTS "appointments_update" ON appointments;
CREATE POLICY "appointments_update" ON appointments FOR UPDATE USING (
    clinic_id IN (
        SELECT clinic_id FROM clinic_practitioners
        WHERE practitioner_id = auth.uid() AND active = true
    )
);

DROP POLICY IF EXISTS "appointments_delete" ON appointments;
CREATE POLICY "appointments_delete" ON appointments FOR DELETE USING (
    clinic_id IN (
        SELECT clinic_id FROM clinic_practitioners
        WHERE practitioner_id = auth.uid() AND active = true
    )
);

-- Update RLS for encounters
DROP POLICY IF EXISTS "encounters_read" ON encounters;
CREATE POLICY "encounters_read" ON encounters FOR SELECT USING (
    clinic_id IN (
        SELECT clinic_id FROM clinic_practitioners
        WHERE practitioner_id = auth.uid() AND active = true
    )
);

DROP POLICY IF EXISTS "encounters_insert" ON encounters;
CREATE POLICY "encounters_insert" ON encounters FOR INSERT WITH CHECK (
    clinic_id IN (
        SELECT clinic_id FROM clinic_practitioners
        WHERE practitioner_id = auth.uid() AND active = true
    )
);

DROP POLICY IF EXISTS "encounters_update" ON encounters;
CREATE POLICY "encounters_update" ON encounters FOR UPDATE USING (
    clinic_id IN (
        SELECT clinic_id FROM clinic_practitioners
        WHERE practitioner_id = auth.uid() AND active = true
    )
);

DROP POLICY IF EXISTS "encounters_delete" ON encounters;
CREATE POLICY "encounters_delete" ON encounters FOR DELETE USING (
    clinic_id IN (
        SELECT clinic_id FROM clinic_practitioners
        WHERE practitioner_id = auth.uid() AND active = true
    )
);