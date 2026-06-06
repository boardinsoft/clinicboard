ALTER TABLE encounters
ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS extended_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS timeout_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_encounters_notified_at ON encounters(notified_at) WHERE notified_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_encounters_timeout_reason ON encounters(timeout_reason) WHERE timeout_reason IS NOT NULL;