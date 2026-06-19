-- Agrega número secuencial de receta por clínica (formato: Rx-YYYY-NNNNN)
-- Beneficios: trazabilidad, búsqueda fácil, regulación sanitaria

-- Columna para el número de receta
ALTER TABLE medication_requests ADD COLUMN IF NOT EXISTS prescription_number TEXT;

-- Índice único por clínica para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_medication_requests_clinic_number
ON medication_requests(clinic_id, prescription_number)
WHERE prescription_number IS NOT NULL;

-- Función para generar el siguiente número de receta
CREATE OR REPLACE FUNCTION generate_prescription_number(p_clinic_id uuid)
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    year_str TEXT;
    num_str TEXT;
    result TEXT;
BEGIN
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    -- Buscar el máximo número del año actual para esta clínica
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(prescription_number FROM 'Rx-\d{4}-(\d+)$') AS INTEGER)
    ), 0)
    INTO next_num
    FROM medication_requests
    WHERE clinic_id = p_clinic_id
      AND prescription_number ~ ('^Rx-' || year_str || '-\d+$')
      AND prescription_number IS NOT NULL;

    next_num := next_num + 1;
    num_str := LPAD(next_num::TEXT, 5, '0');
    result := 'Rx-' || year_str || '-' || num_str;

    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Backfill: asignar números secuenciales a recetas existentes (por fecha de creación, más antigua primero)
DO $$
DECLARE
    rx RECORD;
    counter INTEGER;
    year_str TEXT;
    clinic_year_maxes UUID;
BEGIN
    -- Para cada clínica, generar números secuenciales por año
    FOR rx IN
        SELECT mr.id, mr.clinic_id, mr.authored_on
        FROM medication_requests mr
        WHERE mr.prescription_number IS NULL
          AND mr.clinic_id IS NOT NULL
        ORDER BY mr.clinic_id, mr.authored_on ASC
    LOOP
        -- Obtener el siguiente número para esta clínica/año
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(prescription_number FROM 'Rx-\d{4}-(\d+)$') AS INTEGER)
        ), 0) + 1
        INTO counter
        FROM medication_requests
        WHERE clinic_id = rx.clinic_id
          AND prescription_number ~ ('^Rx-' || EXTRACT(YEAR FROM rx.authored_on)::TEXT || '-\d+$')
          AND prescription_number IS NOT NULL;

        year_str := EXTRACT(YEAR FROM rx.authored_on)::TEXT;
        UPDATE medication_requests
        SET prescription_number = 'Rx-' || year_str || '-' || LPAD(counter::TEXT, 5, '0')
        WHERE id = rx.id;
    END LOOP;
END $$;
