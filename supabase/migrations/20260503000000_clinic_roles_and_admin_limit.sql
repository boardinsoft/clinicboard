-- ============================================
-- Clinic Roles & Admin Constraints
-- ============================================

-- 1. Agregar role y is_owner a clinic_practitioners
ALTER TABLE clinic_practitioners
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'doctor', 'receptionist', 'member')),
ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- 2. Actualizar registros existentes con rol por defecto
UPDATE clinic_practitioners SET role = 'doctor' WHERE role IS NULL;

-- 3. Un usuario solo puede ser admin de UNA clínica (solo un is_owner por practitioner)
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_admin_per_user
ON clinic_practitioners(practitioner_id)
WHERE role = 'admin' AND is_owner = true;

-- 4. Slug de clínica único globalmente
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinics_slug_unique
ON clinics(slug)
WHERE slug IS NOT NULL;

-- 5. Agregar campo para tracking de onboarding
ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ;

-- 6. Agregar tracking a clínicas
ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS owner_practitioner_id UUID REFERENCES practitioners(id);

-- 7. Actualizar practitioner existente del seed como owner de su clínica (si existe)
-- Este se ejecutará manualmente después de la migración
-- UPDATE clinics SET owner_practitioner_id = '00000000-0000-0000-0000-000000000001' WHERE name = 'Clínica San Rafael';

-- 8. Función helper para verificar si un practitioner puede crear clínica
CREATE OR REPLACE FUNCTION can_create_clinic(p_practitioner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que no sea admin de otra clínica
  IF EXISTS (
    SELECT 1 FROM clinic_practitioners
    WHERE practitioner_id = p_practitioner_id AND role = 'admin'
  ) THEN
    RETURN false;
  END IF;

  -- Verificar que no tenga clínica propia (es owner)
  IF EXISTS (
    SELECT 1 FROM clinics c
    WHERE c.owner_practitioner_id = p_practitioner_id
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Agregar constraint a appointments y encounters para clinic_id
-- (Esta migración ya existe en 20260502000000, pero verificamos que exista)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'clinic_id') THEN
    ALTER TABLE appointments ADD COLUMN clinic_id UUID REFERENCES clinics(id);
    CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'clinic_id') THEN
    ALTER TABLE encounters ADD COLUMN clinic_id UUID REFERENCES clinics(id);
    CREATE INDEX IF NOT EXISTS idx_encounters_clinic_id ON encounters(clinic_id);
  END IF;
END $$;