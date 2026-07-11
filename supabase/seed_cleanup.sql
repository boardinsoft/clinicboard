-- ============================================
-- Script de LIMPIEZA para seed usando TRUNCATE (ignora triggers)
-- ============================================

TRUNCATE TABLE encounter_addenda, encounter_audit_log, clinical_notes, medication_requests,
       allergy_intolerances, conditions, encounters, appointments, patients, practitioners
RESTART IDENTITY CASCADE;

SELECT 'Limpieza completada con TRUNCATE. Ahora ejecuta seed.sql' as status;
