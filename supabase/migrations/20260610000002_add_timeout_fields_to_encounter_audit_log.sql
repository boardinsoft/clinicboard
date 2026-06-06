ALTER TABLE encounter_audit_log
ADD COLUMN IF NOT EXISTS original_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS timeout_action TEXT,
ADD COLUMN IF NOT EXISTS extended_by UUID REFERENCES practitioners(id);

CREATE INDEX IF NOT EXISTS idx_encounter_audit_log_timeout_action ON encounter_audit_log(timeout_action) WHERE timeout_action IS NOT NULL;