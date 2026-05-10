-- ============================================
-- Add clinic_id to clinical_notes and fix RLS policies
-- ============================================
-- This migration is idempotent: checks column existence before ALTER TABLE.
-- 1. Add clinic_id column if missing (idempotent via DO $$ block)
-- 2. Backfill clinic_id from encounters where NULL
-- 3. Fix all RLS policies for clinical_notes, encounters, appointments
--    to use the correct auth pattern via practitioners.auth_user_id join

-- ============================================
-- 1. clinical_notes: add clinic_id column (idempotent)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_notes' AND column_name = 'clinic_id') THEN
    ALTER TABLE clinical_notes ADD COLUMN clinic_id UUID REFERENCES clinics(id);
    ALTER TABLE clinical_notes ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
  ELSE
    RAISE NOTICE 'clinic_id already exists on clinical_notes, skipping ADD COLUMN';
  END IF;
END $$;

-- ============================================
-- 2. Backfill clinic_id from encounters where NULL
-- ============================================

UPDATE clinical_notes
SET clinic_id = e.clinic_id
FROM encounters e
WHERE clinical_notes.encounter_id = e.id
  AND clinical_notes.clinic_id IS NULL;

-- ============================================
-- 3. clinical_notes: replace all 4 RLS policies
-- ============================================

DROP POLICY IF EXISTS "clinical_notes_read" ON clinical_notes;
CREATE POLICY "clinical_notes_read" ON clinical_notes FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);

DROP POLICY IF EXISTS "clinical_notes_insert" ON clinical_notes;
CREATE POLICY "clinical_notes_insert" ON clinical_notes FOR INSERT WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);

DROP POLICY IF EXISTS "clinical_notes_update" ON clinical_notes;
CREATE POLICY "clinical_notes_update" ON clinical_notes FOR UPDATE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);

DROP POLICY IF EXISTS "clinical_notes_delete" ON clinical_notes;
CREATE POLICY "clinical_notes_delete" ON clinical_notes FOR DELETE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);

-- ============================================
-- 4. encounters: replace all 4 clinic-aware policies
-- ============================================

DROP POLICY IF EXISTS "encounters_read" ON encounters;
CREATE POLICY "encounters_read" ON encounters FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);

DROP POLICY IF EXISTS "encounters_insert" ON encounters;
CREATE POLICY "encounters_insert" ON encounters FOR INSERT WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);

DROP POLICY IF EXISTS "encounters_update" ON encounters;
CREATE POLICY "encounters_update" ON encounters FOR UPDATE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);

DROP POLICY IF EXISTS "encounters_delete" ON encounters;
CREATE POLICY "encounters_delete" ON encounters FOR DELETE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);

-- ============================================
-- 5. appointments: replace all 4 clinic-aware policies
-- ============================================

DROP POLICY IF EXISTS "appointments_read" ON appointments;
CREATE POLICY "appointments_read" ON appointments FOR SELECT USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);

DROP POLICY IF EXISTS "appointments_insert" ON appointments;
CREATE POLICY "appointments_insert" ON appointments FOR INSERT WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);

DROP POLICY IF EXISTS "appointments_update" ON appointments;
CREATE POLICY "appointments_update" ON appointments FOR UPDATE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);

DROP POLICY IF EXISTS "appointments_delete" ON appointments;
CREATE POLICY "appointments_delete" ON appointments FOR DELETE USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_practitioners cp
    WHERE cp.practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
    AND cp.active = true
  )
);
