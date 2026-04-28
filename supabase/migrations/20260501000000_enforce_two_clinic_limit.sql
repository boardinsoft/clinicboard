-- Enforce 2-clinic limit per practitioner
-- Prevents inserting/updating a clinic_practitioner record when the practitioner already has 2 active clinics

-- Function to check clinic count
CREATE OR REPLACE FUNCTION check_clinic_limit(p_practitioner_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM clinic_practitioners
  WHERE practitioner_id = p_practitioner_id AND active = true;

  RETURN active_count < 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to enforce limit
CREATE OR REPLACE FUNCTION prevent_clinic_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.active = true AND NEW.active = true THEN
    RETURN NEW;
  END IF;

  IF NEW.active = true AND NOT check_clinic_limit(NEW.practitioner_id) THEN
    RAISE EXCEPTION 'No puedes pertenecer a más de 2 clínicas activas.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS enforce_clinic_limit ON clinic_practitioners;

-- Create trigger
CREATE TRIGGER enforce_clinic_limit
  BEFORE INSERT OR UPDATE ON clinic_practitioners
  FOR EACH ROW EXECUTE FUNCTION prevent_clinic_limit();

-- Add comment
COMMENT ON FUNCTION prevent_clinic_limit() IS 'Prevents practitioners from having more than 2 active clinic memberships';