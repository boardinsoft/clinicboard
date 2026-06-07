-- ============================================================
-- ENCOUNTER TIMEOUT SYSTEM
-- Migración completa para production
-- ============================================================

-- ============================================================
-- PASO 1: Tabla de configuración de tipos de encounter
-- ============================================================
CREATE TABLE encounter_type_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_class TEXT NOT NULL UNIQUE,
    max_duration_minutes INTEGER NOT NULL DEFAULT 45,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE encounter_type_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view encounter_type_config"
    ON encounter_type_config FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage encounter_type_config"
    ON encounter_type_config FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Seed data: duraciones por tipo de encounter (en minutos)
INSERT INTO encounter_type_config (encounter_class, max_duration_minutes) VALUES
    ('AMB', 45),   -- Ambulatorio
    ('EMER', 120), -- Emergencia
    ('IMP', 60),   -- Internación
    ('HH', 60);    -- Home Health

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_encounter_type_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_encounter_type_config_timestamp
    BEFORE UPDATE ON encounter_type_config
    FOR EACH ROW
    EXECUTE FUNCTION update_encounter_type_config_timestamp();

-- ============================================================
-- PASO 2: Campos de timeout en encounters
-- ============================================================
ALTER TABLE encounters
ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS extended_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS timeout_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_encounters_notified_at
    ON encounters(notified_at) WHERE notified_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_encounters_timeout_reason
    ON encounters(timeout_reason) WHERE timeout_reason IS NOT NULL;

-- ============================================================
-- PASO 3: Campos de auditoría en encounter_audit_log
-- ============================================================
ALTER TABLE encounter_audit_log
ADD COLUMN IF NOT EXISTS original_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS timeout_action TEXT,
ADD COLUMN IF NOT EXISTS extended_by UUID REFERENCES practitioners(id);

CREATE INDEX IF NOT EXISTS idx_encounter_audit_log_timeout_action
    ON encounter_audit_log(timeout_action) WHERE timeout_action IS NOT NULL;

-- ============================================================
-- PASO 4: Función de cleanup de encounters expirados
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_encounters()
RETURNS void AS $$
DECLARE
    expired_encounter RECORD;
    max_duration INTEGER;
    grace_period_minutes INTEGER := 15;
    max_extensions INTEGER := 3;
BEGIN
    FOR expired_encounter IN
        SELECT e.id, e.notified_at, e.extended_count, e.encounter_class, e.start_time
        FROM encounters e
        WHERE e.status = 'in-progress'
          AND e.notified_at IS NOT NULL
    LOOP
        SELECT etc.max_duration_minutes INTO max_duration
        FROM encounter_type_config etc
        WHERE etc.encounter_class = expired_encounter.encounter_class;

        IF max_duration IS NULL THEN
            max_duration := 45;
        END IF;

        IF expired_encounter.extended_count >= max_extensions THEN
            UPDATE encounters
            SET status = 'cancelled',
                timeout_reason = 'timeout',
                end_time = now(),
                updated_at = now()
            WHERE id = expired_encounter.id;

            INSERT INTO encounter_audit_log (
                encounter_id, action, old_status, new_status, changed_by, changed_at,
                timeout_action, actual_duration_minutes, original_duration_minutes
            ) VALUES (
                expired_encounter.id, 'timeout_auto_cancelled', 'in-progress', 'cancelled',
                null, now(), 'auto_cancelled',
                EXTRACT(EPOCH FROM (now() - expired_encounter.start_time)) / 60,
                max_duration
            );

        ELSIF expired_encounter.notified_at + (grace_period_minutes || ' minutes')::interval < now() THEN
            UPDATE encounters
            SET status = 'cancelled',
                timeout_reason = 'timeout',
                end_time = now(),
                updated_at = now()
            WHERE id = expired_encounter.id;

            INSERT INTO encounter_audit_log (
                encounter_id, action, old_status, new_status, changed_by, changed_at,
                timeout_action, actual_duration_minutes, original_duration_minutes
            ) VALUES (
                expired_encounter.id, 'timeout_auto_cancelled', 'in-progress', 'cancelled',
                null, now(), 'auto_cancelled',
                EXTRACT(EPOCH FROM (now() - expired_encounter.start_time)) / 60,
                max_duration
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PASO 5: Habilitar pg_cron y programar el job
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA extensions TO postgres, service_role;

SELECT cron.schedule(
    'cleanup-expired-encounters',
    '*/5 * * * *',
    'SELECT cleanup_expired_encounters()'
);

-- ============================================================
-- VERIFICACIÓN (opcional)
-- ============================================================
-- Ver jobs programados:
-- SELECT * FROM cron.job;

-- Ver encounters en timeout:
-- SELECT id, status, start_time, notified_at, extended_count, encounter_class
-- FROM encounters WHERE status = 'in-progress' AND notified_at IS NOT NULL;