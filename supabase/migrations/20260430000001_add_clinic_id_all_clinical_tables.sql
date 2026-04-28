-- Add clinic_id to remaining clinical data tables for complete multitenant isolation
-- This ensures complete isolation between clinics for doctors working at multiple clinics

-- conditions table
ALTER TABLE conditions ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);
CREATE INDEX IF NOT EXISTS idx_conditions_clinic_id ON conditions(clinic_id);

-- Backfill from patients
UPDATE conditions
SET clinic_id = p.clinic_id
FROM patients p
WHERE conditions.patient_id = p.id
  AND conditions.clinic_id IS NULL;

-- allergy_intolerances table
ALTER TABLE allergy_intolerances ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);
CREATE INDEX IF NOT EXISTS idx_allergy_intolerances_clinic_id ON allergy_intolerances(clinic_id);

-- Backfill from patients
UPDATE allergy_intolerances
SET clinic_id = p.clinic_id
FROM patients p
WHERE allergy_intolerances.patient_id = p.id
  AND allergy_intolerances.clinic_id IS NULL;

-- medication_requests table
ALTER TABLE medication_requests ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);
CREATE INDEX IF NOT EXISTS idx_medication_requests_clinic_id ON medication_requests(clinic_id);

-- Backfill from patients
UPDATE medication_requests
SET clinic_id = p.clinic_id
FROM patients p
WHERE medication_requests.patient_id = p.id
  AND medication_requests.clinic_id IS NULL;

-- patients table (ensure clinic_id exists)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);

-- Update RLS for conditions
DROP POLICY IF EXISTS "conditions_read" ON conditions;
CREATE POLICY "conditions_read" ON conditions FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "conditions_insert" ON conditions;
CREATE POLICY "conditions_insert" ON conditions FOR INSERT WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "conditions_update" ON conditions;
CREATE POLICY "conditions_update" ON conditions FOR UPDATE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "conditions_delete" ON conditions;
CREATE POLICY "conditions_delete" ON conditions FOR DELETE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

-- Update RLS for allergy_intolerances
DROP POLICY IF EXISTS "allergy_intolerances_read" ON allergy_intolerances;
CREATE POLICY "allergy_intolerances_read" ON allergy_intolerances FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "allergy_intolerances_insert" ON allergy_intolerances;
CREATE POLICY "allergy_intolerances_insert" ON allergy_intolerances FOR INSERT WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "allergy_intolerances_update" ON allergy_intolerances;
CREATE POLICY "allergy_intolerances_update" ON allergy_intolerances FOR UPDATE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "allergy_intolerances_delete" ON allergy_intolerances;
CREATE POLICY "allergy_intolerances_delete" ON allergy_intolerances FOR DELETE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

-- Update RLS for medication_requests
DROP POLICY IF EXISTS "medication_requests_read" ON medication_requests;
CREATE POLICY "medication_requests_read" ON medication_requests FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "medication_requests_insert" ON medication_requests;
CREATE POLICY "medication_requests_insert" ON medication_requests FOR INSERT WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "medication_requests_update" ON medication_requests;
CREATE POLICY "medication_requests_update" ON medication_requests FOR UPDATE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "medication_requests_delete" ON medication_requests;
CREATE POLICY "medication_requests_delete" ON medication_requests FOR DELETE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

-- Update RLS for patients to include clinic_id
DROP POLICY IF EXISTS "patients_read" ON patients;
CREATE POLICY "patients_read" ON patients FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "patients_insert" ON patients;
CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "patients_update" ON patients;
CREATE POLICY "patients_update" ON patients FOR UPDATE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "patients_delete" ON patients;
CREATE POLICY "patients_delete" ON patients FOR DELETE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);
