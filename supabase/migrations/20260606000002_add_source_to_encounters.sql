-- ============================================
-- Add source column to encounters for traceability
-- Identifies where the encounter was initiated from
-- ============================================

ALTER TABLE public.encounters
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'unknown'
CHECK (source IN ('walk-in-dialog', 'appointments-module', 'api', 'unknown'));

COMMENT ON COLUMN public.encounters.source IS 'Origin source of the encounter: walk-in-dialog, appointments-module, api, or unknown';

CREATE INDEX IF NOT EXISTS idx_encounters_source
ON public.encounters(source);