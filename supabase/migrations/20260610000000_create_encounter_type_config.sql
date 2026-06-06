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

INSERT INTO encounter_type_config (encounter_class, max_duration_minutes) VALUES
    ('AMB', 45),
    ('EMER', 120),
    ('IMP', 60),
    ('HH', 60);

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