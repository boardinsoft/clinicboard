-- Migración: Cumplimiento normativo venezolano para recetas médicas (Gaceta Oficial 40.131, Art. 5)
-- Agrega campos obligatorios para la impresión legal de recetas
-- Elimina identifiers JSONB de patients (causa de complejidad y riesgo)

-- ============================================
-- PRACTITIONERS: datos del médico (Art. 5 #1)
-- ============================================
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS mpps_registration_number TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS university TEXT;
CREATE INDEX IF NOT EXISTS idx_practitioners_national_id ON practitioners(national_id);

-- ============================================
-- CLINICS: datos del establecimiento (Art. 5 #2)
-- ============================================
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS rif TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS phone TEXT;
CREATE INDEX IF NOT EXISTS idx_clinics_rif ON clinics(rif);

-- ============================================
-- PATIENTS: cédula del paciente (Art. 5 #3)
-- ============================================
ALTER TABLE patients ADD COLUMN IF NOT EXISTS national_id TEXT;
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);

-- Backfill national_id desde identifiers JSONB (si existe la columna)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'identifiers'
    ) THEN
        UPDATE patients p SET national_id = (
            SELECT value->>'value'
            FROM jsonb_array_elements(
                CASE
                    WHEN jsonb_typeof(p.identifiers) = 'array' THEN p.identifiers
                    ELSE '[]'::jsonb
                END
            ) AS value
            WHERE (value->>'system' ILIKE '%cedula%' OR value->>'type' = 'national_id')
              AND (value->>'value') IS NOT NULL
            LIMIT 1
        )
        WHERE p.national_id IS NULL
          AND p.identifiers IS NOT NULL
          AND jsonb_typeof(p.identifiers) = 'array';
    END IF;
END $$;

-- ============================================
-- ELIMINAR identifiers JSONB (causa deuda técnica)
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'patients' AND column_name = 'identifiers'
    ) THEN
        ALTER TABLE patients DROP COLUMN IF EXISTS identifiers;
    END IF;
END $$;

-- ============================================
-- MEDICATION_REQUESTS: expiración y auditoría de impresión
-- ============================================
ALTER TABLE medication_requests ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE medication_requests ADD COLUMN IF NOT EXISTS printed_count INTEGER DEFAULT 0;
ALTER TABLE medication_requests ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;

-- Calcular valid_until 30 días para recetas existentes
UPDATE medication_requests
SET valid_until = authored_on + INTERVAL '30 days'
WHERE valid_until IS NULL AND authored_on IS NOT NULL;

-- ============================================
-- FUNCIÓN DE BÚSQUEDA DE PACIENTES
-- (debe eliminarse y recrearse para cambiar el tipo de retorno)
-- ============================================
DROP FUNCTION IF EXISTS public.search_patients_v2(text, uuid);

CREATE FUNCTION public.search_patients_v2(
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
      p.name_family ILIKE '%' || search_term || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(p.name_given) AS ng
        WHERE ng ILIKE '%' || search_term || '%'
      )
      OR (p.national_id ILIKE '%' || search_term || '%')
    )
  ORDER BY p.name_family ASC
  LIMIT 20;
END;
$function$;

-- Eliminar índice GIN de identifiers (ya no se usa)
DROP INDEX IF EXISTS idx_patients_identifiers_gin;
