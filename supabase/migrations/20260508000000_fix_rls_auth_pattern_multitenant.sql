-- ============================================
-- Fix RLS Policy Auth Pattern for Multitenant Tables
-- ============================================
-- PROBLEM: All clinic-aware RLS policies use the broken pattern:
--   WHERE practitioner_id = auth.uid()
-- This compares clinic_practitioners.practitioner_id (practitioners.id, a domain UUID)
-- directly to auth.uid() (auth.users.id, a different UUID space) — always FALSE.
--
-- FIX: Use the correct pattern that exists in the original working policies:
--   WHERE practitioner_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())
-- This translates auth.uid() → practitioners.id via the auth_user_id link.
--
-- TABLES AFFECTED: clinical_notes, encounters, appointments
-- All share the same broken pattern; all must be fixed together.
-- If clinic_id column does not exist on clinical_notes (migration not applied),
-- only the clinical_notes policies are skipped; encounters and appointments are fixed.

-- ============================================
-- 1. clinical_notes — replace all 4 policies
-- (only if clinic_id column exists, otherwise skip — falls back to original RLS)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_notes' AND column_name = 'clinic_id') THEN

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

  ELSE
    RAISE NOTICE 'clinic_id column not found on clinical_notes; skipping clinical_notes policy updates';
  END IF;
END $$;

-- ============================================
-- 2. encounters — replace all 4 new policies
--     (practitioners_own_encounters from 001_initial_schema.sql remains active as fallback)
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
-- 3. appointments — replace all 4 new policies
--     (practitioners_own_appointments from 001_initial_schema.sql remains active as fallback)
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
