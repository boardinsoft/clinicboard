-- ============================================================
-- Clinicboard — Historia Clínica: Separación de entidades
-- Created: 2026-04-16
--
-- Objetivos:
--   1. Crear tabla `clinical_notes` para notas SOAP del encuentro
--   2. Migrar campos SOAP de `encounters` → `clinical_notes`
--   3. Eliminar campos SOAP de `encounters` (solo mantiene datos del evento)
--   4. Hacer `appointment_id` NOT NULL en `encounters`
-- ============================================================

-- ─── 1. Crear tabla clinical_notes ───────────────────────────

CREATE TABLE IF NOT EXISTS public.clinical_notes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id     UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
    patient_id       UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    practitioner_id  UUID NOT NULL REFERENCES public.practitioners(id),
    reason_code      JSONB DEFAULT '[]'::jsonb,
    subjective       TEXT,
    objective        TEXT,
    analysis         TEXT,
    plan             TEXT,
    evolution_note   TEXT,
    physical_exam    JSONB DEFAULT '{}'::jsonb,
    diagnosis        JSONB DEFAULT '[]'::jsonb,
    is_finalized     BOOLEAN DEFAULT false,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE(encounter_id)
);

-- Índice GIN para búsqueda fulltext en español sobre notas SOAP
CREATE INDEX IF NOT EXISTS idx_clinical_notes_fts
    ON public.clinical_notes
    USING GIN (
        to_tsvector(
            'spanish',
            COALESCE(subjective, '') || ' ' ||
            COALESCE(objective,  '') || ' ' ||
            COALESCE(analysis,   '') || ' ' ||
            COALESCE(plan,       '')
        )
    );

-- Índice para lookup rápido por encounter
CREATE INDEX IF NOT EXISTS idx_clinical_notes_encounter
    ON public.clinical_notes (encounter_id);

-- Índice para queries con filtro practitioner_id (RLS + listado)
CREATE INDEX IF NOT EXISTS idx_clinical_notes_practitioner
    ON public.clinical_notes (practitioner_id);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER set_updated_at_clinical_notes
    BEFORE UPDATE ON public.clinical_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 2. RLS en clinical_notes ────────────────────────────────

ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "practitioners_select_clinical_notes"
    ON public.clinical_notes FOR SELECT
    TO public
    USING (practitioner_id = auth.uid());

CREATE POLICY "practitioners_insert_clinical_notes"
    ON public.clinical_notes FOR INSERT
    TO public
    WITH CHECK (practitioner_id = auth.uid());

CREATE POLICY "practitioners_update_clinical_notes"
    ON public.clinical_notes FOR UPDATE
    TO public
    USING (practitioner_id = auth.uid())
    WITH CHECK (practitioner_id = auth.uid());

-- ─── 3. Migrar datos SOAP de encounters → clinical_notes ─────
-- Crea una clinical_note por cada encounter existente,
-- copiando los campos SOAP. Para encounters sin appointment_id
-- se genera un appointment placeholder (status='fulfilled').

DO $$
DECLARE
    placeholder_apt_id UUID;
    enc RECORD;
BEGIN
    FOR enc IN
        SELECT id, patient_id, practitioner_id, start_time, end_time,
               subjective, objective, analysis, plan, evolution_note,
               physical_exam, diagnosis, reason_code, status,
               appointment_id
        FROM public.encounters
    LOOP
        -- Si el encounter no tiene appointment_id, crear uno placeholder
        IF enc.appointment_id IS NULL THEN
            -- Desactivar el trigger de validación de negocio temporalmente
            -- (las reglas de no-pasado no aplican a datos históricos de migración)
            INSERT INTO public.appointments (
                id,
                fhir_id,
                status,
                start_time,
                end_time,
                patient_id,
                practitioner_id,
                appointment_type,
                description
            )
            VALUES (
                gen_random_uuid(),
                'migration-' || enc.id::text,
                'fulfilled',
                COALESCE(enc.start_time, now() - interval '1 hour'),
                COALESCE(enc.end_time,   COALESCE(enc.start_time, now() - interval '1 hour') + interval '30 minutes'),
                enc.patient_id,
                enc.practitioner_id,
                'Migración',
                'Cita generada automáticamente durante migración de datos'
            )
            RETURNING id INTO placeholder_apt_id;

            -- Asignar el appointment_id generado al encounter
            UPDATE public.encounters
            SET appointment_id = placeholder_apt_id
            WHERE id = enc.id;
        END IF;

        -- Insertar clinical_note con los campos SOAP
        INSERT INTO public.clinical_notes (
            encounter_id,
            patient_id,
            practitioner_id,
            reason_code,
            subjective,
            objective,
            analysis,
            plan,
            evolution_note,
            physical_exam,
            diagnosis,
            is_finalized
        ) VALUES (
            enc.id,
            enc.patient_id,
            enc.practitioner_id,
            COALESCE(enc.reason_code, '[]'::jsonb),
            enc.subjective,
            enc.objective,
            enc.analysis,
            enc.plan,
            enc.evolution_note,
            COALESCE(enc.physical_exam, '{}'::jsonb),
            COALESCE(enc.diagnosis, '[]'::jsonb),
            (enc.status = 'finished')
        )
        ON CONFLICT (encounter_id) DO NOTHING;
    END LOOP;
END;
$$;

-- ─── 4. Hacer appointment_id NOT NULL en encounters ──────────

ALTER TABLE public.encounters
    ALTER COLUMN appointment_id SET NOT NULL;

-- ─── 5. Eliminar columnas SOAP de encounters ─────────────────
-- Estos datos ya viven en clinical_notes

ALTER TABLE public.encounters
    DROP COLUMN IF EXISTS subjective,
    DROP COLUMN IF EXISTS objective,
    DROP COLUMN IF EXISTS analysis,
    DROP COLUMN IF EXISTS plan,
    DROP COLUMN IF EXISTS evolution_note,
    DROP COLUMN IF EXISTS physical_exam,
    DROP COLUMN IF EXISTS diagnosis,
    DROP COLUMN IF EXISTS reason_code;

-- ─── DOWN (reversión manual si se necesita) ──────────────────
-- Para revertir esta migración:
--
-- ALTER TABLE encounters ADD COLUMN subjective TEXT;
-- ALTER TABLE encounters ADD COLUMN objective TEXT;
-- ALTER TABLE encounters ADD COLUMN analysis TEXT;
-- ALTER TABLE encounters ADD COLUMN plan TEXT;
-- ALTER TABLE encounters ADD COLUMN evolution_note TEXT;
-- ALTER TABLE encounters ADD COLUMN physical_exam JSONB DEFAULT '{}';
-- ALTER TABLE encounters ADD COLUMN diagnosis JSONB DEFAULT '[]';
-- ALTER TABLE encounters ADD COLUMN reason_code JSONB DEFAULT '[]';
--
-- UPDATE encounters e
-- SET subjective     = cn.subjective,
--     objective      = cn.objective,
--     analysis       = cn.analysis,
--     plan           = cn.plan,
--     evolution_note = cn.evolution_note,
--     physical_exam  = cn.physical_exam,
--     diagnosis      = cn.diagnosis,
--     reason_code    = cn.reason_code
-- FROM clinical_notes cn
-- WHERE cn.encounter_id = e.id;
--
-- ALTER TABLE encounters ALTER COLUMN appointment_id DROP NOT NULL;
-- DROP TABLE IF EXISTS clinical_notes;
