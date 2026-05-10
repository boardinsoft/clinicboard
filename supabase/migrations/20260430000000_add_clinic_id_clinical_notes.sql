-- Add clinic_id to clinical_notes table for direct multitenant filtering

ALTER TABLE clinical_notes ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_clinic_id ON clinical_notes(clinic_id);

-- Backfill clinic_id from encounters (1:1 relationship via encounter_id)
UPDATE clinical_notes
SET clinic_id = e.clinic_id
FROM encounters e
WHERE clinical_notes.encounter_id = e.id
  AND clinical_notes.clinic_id IS NULL;

-- Update RLS policy for clinical_notes to include clinic_id
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinical_notes_read" ON clinical_notes;
CREATE POLICY "clinical_notes_read" ON clinical_notes FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "clinical_notes_insert" ON clinical_notes;
CREATE POLICY "clinical_notes_insert" ON clinical_notes FOR INSERT WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "clinical_notes_update" ON clinical_notes;
CREATE POLICY "clinical_notes_update" ON clinical_notes FOR UPDATE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);

DROP POLICY IF EXISTS "clinical_notes_delete" ON clinical_notes;
CREATE POLICY "clinical_notes_delete" ON clinical_notes FOR DELETE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners
    WHERE practitioner_id = auth.uid() AND active = true
  )
);
