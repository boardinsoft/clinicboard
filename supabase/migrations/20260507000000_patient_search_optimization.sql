-- Migration: Patient search optimization
-- Adds search_patients_v2 function and indexes for fast name/ID search

-- ============================================================
-- Function: search_patients_v2
-- Searches patients by name (family/given) or identifier
-- Returns up to 20 matching active patients for a practitioner
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_patients_v2(
  search_term text,
  p_id uuid
)
RETURNS TABLE(
  id uuid,
  name_given text[],
  name_family text,
  national_id text,
  active boolean
)
LANGUAGE plpgsql AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name_given,
    p.name_family,
    p.national_id,
    p.active
  FROM patients p
  WHERE p.practitioner_id = p_id
    AND p.active = true
    AND (
      -- Search by family name (partial match)
      p.name_family ILIKE '%' || search_term || '%'
      -- Search by given names (any array element, partial match)
      OR EXISTS (
        SELECT 1 FROM unnest(p.name_given) AS ng
        WHERE ng ILIKE '%' || search_term || '%'
      )
      -- Search by national_id (Cédula)
      OR (p.national_id ILIKE '%' || search_term || '%')
    )
  ORDER BY p.name_family ASC
  LIMIT 20;
END;
$function$;

-- ============================================================
-- Index: Composite index for practitioner + active status
-- Speeds up filtered queries for active patients
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_patients_prac_active
  ON patients(practitioner_id, active)
  WHERE active = true;


