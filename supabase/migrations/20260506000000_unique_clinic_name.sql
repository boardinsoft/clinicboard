-- ============================================
-- Unique constraint on clinic name (case-insensitive)
-- ============================================

-- Create unique index on LOWER(name) to enforce case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinics_name_unique_case_insensitive
ON clinics(LOWER(name))
WHERE name IS NOT NULL;