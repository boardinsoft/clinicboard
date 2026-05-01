-- ============================================
-- Mark existing practitioners as onboarding_completed
-- Practitioners who already have a clinic association are considered to have completed onboarding
-- ============================================

-- Mark as completed all practitioners who:
-- 1. Have an auth_user_id (they signed up)
-- 2. Are linked to at least one clinic as admin or have a license_number (indicating they went through setup)
UPDATE practitioners
SET onboarding_completed = true
WHERE auth_user_id IS NOT NULL
AND (
    EXISTS (
        SELECT 1 FROM clinic_practitioners cp
        WHERE cp.practitioner_id = practitioners.id
        LIMIT 1
    )
    OR license_number IS NOT NULL
);