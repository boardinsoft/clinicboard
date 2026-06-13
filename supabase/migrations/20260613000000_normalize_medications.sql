-- Migration: 20260613000000_normalize_medications.sql
-- Desc: Normalize medications names — remove brand names, fix encoding, standardize forms/concentrations
-- Run in Supabase SQL Editor (project 2) or via: supabase db push
-- Safe to re-run (idempotent — uses UPDATE with WHERE conditions)

BEGIN;

-- No mojibake replacement needed — data is already clean or uses proper Unicode escapes

-- ============================================================
-- STEP 3 — Canonicalize pharmaceutical_form
-- ============================================================
UPDATE medications
SET pharmaceutical_form = CASE
    WHEN UPPER(pharmaceutical_form) = 'TABLETAS'              THEN 'TABLETA'
    WHEN UPPER(pharmaceutical_form) = 'TABLETAS RECUBIERTAS'  THEN 'TABLETA RECUBIERTA'
    WHEN UPPER(pharmaceutical_form) = 'COMPRIMIDOS'           THEN 'COMPRIMIDO'
    WHEN UPPER(pharmaceutical_form) = 'CAPSULAS'              THEN 'CÁPSULA'
    WHEN UPPER(pharmaceutical_form) = 'CAPSULAS BLANDAS'      THEN 'CÁPSULA BLANDA'
    WHEN UPPER(pharmaceutical_form) = 'SOLUCION INYECTABLE'   THEN 'SOLUCIÓN INYECTABLE'
    WHEN UPPER(pharmaceutical_form) = 'SOLUCION ORAL'         THEN 'SOLUCIÓN ORAL'
    WHEN UPPER(pharmaceutical_form) = 'SUSPENSION'            THEN 'SUSPENSIÓN'
    WHEN UPPER(pharmaceutical_form) = 'JARABE'                THEN 'JARABE'
    WHEN UPPER(pharmaceutical_form) = 'CREMA'                 THEN 'CREMA'
    WHEN UPPER(pharmaceutical_form) = 'TABLETAS MASTICABLES'  THEN 'TABLETA MASTICABLE'
    WHEN UPPER(pharmaceutical_form) = 'UNGUENTO'              THEN 'UNGUENTO'
    WHEN UPPER(pharmaceutical_form) = 'GOTAS OFTALMICAS'      THEN 'GOTAS OFTÁLMICAS'
    WHEN UPPER(pharmaceutical_form) = 'GRANULADO'             THEN 'GRANULADO'
    WHEN UPPER(pharmaceutical_form) = 'POLVO'                 THEN 'POLVO'
    WHEN UPPER(pharmaceutical_form) = 'SOLUCION'              THEN 'SOLUCIÓN'
    WHEN UPPER(pharmaceutical_form) = 'SOLUCION TOPICA'       THEN 'SOLUCIÓN TÓPICA'
    WHEN UPPER(pharmaceutical_form) = 'SOLUCION TOPICA BUCAL' THEN 'SOLUCIÓN TÓPICA BUCAL'
    WHEN UPPER(pharmaceutical_form) = 'SOLUCION NASAL'        THEN 'SOLUCIÓN NASAL'
    WHEN UPPER(pharmaceutical_form) = 'SOLUCION PARA INFUSION' THEN 'SOLUCIÓN PARA INFUSIÓN'
    WHEN UPPER(pharmaceutical_form) = 'SOLUCION ELECTROLITICA USO ORAL' THEN 'SOLUCIÓN ELECTROLÍTICA ORAL'
    WHEN UPPER(pharmaceutical_form) = 'SOLUCION INHALADORA'   THEN 'SOLUCIÓN INHALADORA'
    WHEN UPPER(pharmaceutical_form) = 'OVULOS VAGINALES'      THEN 'ÓVULO VAGINAL'
    WHEN UPPER(pharmaceutical_form) = 'SUPOSITORIOS'          THEN 'SUPOSITORIO'
    WHEN UPPER(pharmaceutical_form) = 'POLVO LIOFILIZADO PARA' THEN 'POLVO LIOFILIZADO'
    WHEN UPPER(pharmaceutical_form) = 'POLVO PARA'            THEN 'POLVO'
    WHEN UPPER(pharmaceutical_form) = 'GRANULADO PARA'        THEN 'GRANULADO'
    ELSE pharmaceutical_form
END
WHERE pharmaceutical_form IS NOT NULL AND pharmaceutical_form != '';

-- ============================================================
-- STEP 4 — Normalize concentration
--    Goals:
--      - Single space around / for ratios: "500 mg / 5 mL"
--      - Single space around - for multi-component: "50 mg - 500 mg"
--      - Lowercase "mg", "ml", "ui"; uppercase "g", "M", "%"
--      - No leading/trailing spaces
-- ============================================================

-- 4a: Normalize spaces around slashes (ratio concentrations)
UPDATE medications
SET concentration = REGEXP_REPLACE(
    REGEXP_REPLACE(concentration, E'\\s*/\\s*', ' / ', 'g'),
    E'^\\s+|\\s+$', '', 'g')
WHERE concentration IS NOT NULL AND concentration != ''
  AND concentration ~ E'\\s*/\\s*';

-- 4b: Normalize spaces around dashes (multi-component)
UPDATE medications
SET concentration = REGEXP_REPLACE(
    REGEXP_REPLACE(concentration, E'\\s*-\\s*', ' - ', 'g'),
    E'^\\s+|\\s+$', '', 'g')
WHERE concentration IS NOT NULL AND concentration != ''
  AND concentration ~ E'[^\\-]*\\-[^\\-]*'
  AND concentration !~ E'\\s*/\\s*';

-- 4c: Uppercase "ML" → "mL" (volume units)
UPDATE medications
SET concentration = REPLACE(concentration, 'ML', 'mL')
WHERE concentration IS NOT NULL AND concentration LIKE '%ML%';

-- 4d: Uppercase "MG" → "mg" (mass units)
UPDATE medications
SET concentration = REPLACE(concentration, 'MG', 'mg')
WHERE concentration IS NOT NULL AND concentration LIKE '%MG%';

-- 4e: Fix "mg /ml" patterns (no space before mL after slash)
UPDATE medications
SET concentration = REGEXP_REPLACE(concentration, E'mL', ' mL', 'g')
WHERE concentration IS NOT NULL AND concentration ~ E'mL[^\\s]';

-- 4f: Fix "mg/ ml" patterns (space before mL before slash)
UPDATE medications
SET concentration = REGEXP_REPLACE(concentration, E'\\s*/\\s*mL', ' / mL', 'g')
WHERE concentration IS NOT NULL AND concentration ~ E'\\s*/\\s*mL';

-- 4g: Collapse multiple spaces
UPDATE medications
SET concentration = REGEXP_REPLACE(concentration, E'\\s+', ' ', 'g')
WHERE concentration IS NOT NULL AND concentration ~ E'\\s{2,}';

-- 4h: Trim leading/trailing spaces
UPDATE medications
SET concentration = REGEXP_REPLACE(concentration, E'^\\s+|\\s+$', '', 'g')
WHERE concentration IS NOT NULL;

-- ============================================================
-- STEP 5 — Remove form suffixes embedded in `name`
--    Patterns: "NAME SOLUCIÓN INYECTABLE", "NAME / mL ...",
--              "NAME - 0,5 g POLVO PARA", "NAME POLVO LIOFILIZADO PARA"
-- ============================================================

-- Remove "SOLUCIÓN INYECTABLE", "SOLUCION INYECTABLE" suffix
UPDATE medications
SET name = REGEXP_REPLACE(
    name, E'\\s+SOLU[CcIÓN]+[\\s]+INYECTABLE\\s*$', '', 'i')
WHERE name ~* E'solucion\\s+inyectable';

-- Remove " / mL ..." suffix (e.g. "FILINAR / mL")
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s*/\\s*mL.*$', '', 'i')
WHERE name ~ E'\\s*/\\s*mL';

-- Remove " - X.X g POLVO PARA" suffix (e.g. "AMPITOTAL - 0,5 g POLVO PARA")
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+-\\s*[0-9]+[.,]?[0-9]*\\s*g\\s+POLVO\\s+PARA.*$', '', 'i')
WHERE name ~ E'POLVO\\s+PARA';

-- Remove "POLVO LIOFILIZADO PARA" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+POLVO\\s+LIOFILIZADO\\s+PARA.*$', '', 'i')
WHERE name ~* E'polvo\\s+liol';

-- Remove "POLVO PARA" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+POLVO\\s+PARA.*$', '', 'i')
WHERE name ~* E'polvo\\s+para';

-- Remove " - X mg" embedded concentration from name (e.g. "AMOXICILINA - ACIDO CLAVULANICO 125 mg")
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+-\\s*[0-9]+[.,]?[0-9]*\\s*mg\\s*$', '', 'i')
WHERE name ~ E'[0-9]+\\s*mg\\s*$';

-- Remove "SOLUCIÓN ORAL" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+SOLU[CcIÓN]+\\s+ORAL.*$', '', 'i')
WHERE name ~* E'solucion\\s+oral';

-- Remove "SOLUCIÓN PARA INFUSIÓN" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+SOLU[CcIÓN]+\\s+PARA\\s+INFUSIÓN.*$', '', 'i')
WHERE name ~* E'solucion\\s+para\\s+infusion';

-- Remove "SOLUCIÓN" standalone suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+SOLU[CcIÓN]+$', '', 'i')
WHERE name ~* E'solucion\\s*$';

-- Remove "GRANULADO PARA" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+GRANULADO\\s+PARA.*$', '', 'i')
WHERE name ~* E'granulado\\s+para';

-- Remove "OVULOS VAGINALES" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+[ÓO]VULOS?\\s+VAGINALES.*$', '', 'i')
WHERE name ~* E'ovulo';

-- Remove "SUPOSITORIOS" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+SUPOSITORIOS?.*$', '', 'i')
WHERE name ~* E'supositorio';

-- Remove "SOLUCION TOPICA BUCAL" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+SOLU[CcIÓN]+\\s+T[OÓ]PICA\\s+BUCAL.*$', '', 'i')
WHERE name ~* E'solucion\\s+topica';

-- Remove "SOLUCION NASAL" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+SOLU[CcIÓN]+\\s+NASAL.*$', '', 'i')
WHERE name ~* E'solucion\\s+nasal';

-- Remove "TABLETA RECUBIERTA" embedded (e.g. "GLUSTAR TABLETA RECUBIERTA")
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+TABLETA\\s+RECUBIERTA.*$', '', 'i')
WHERE name ~* E'tableta\\s+recubierta';

-- Remove "CAPSULAS" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+CAPSULAS?.*$', '', 'i')
WHERE name ~* E'capsula';

-- Remove "COMPRIMIDOS" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+COMPRIMIDOS?.*$', '', 'i')
WHERE name ~* E'comprimido';

-- Remove "JARABE" suffix
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+JARABE.*$', '', 'i')
WHERE name ~* E'jarabe';

-- Remove " /L ..." suffix (large volume)
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s*/[LmLtT].*$', '', 'i')
WHERE name ~ E'\\s*/[Ll]';

-- Remove " - X mcg - Y mcg / DOSIS" suffix (inhalers)
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+-\\s*[0-9]+\\s*mcg.*$', '', 'i')
WHERE name ~ E'mcg';

-- Remove " - X % - Y %" suffix (creams with %)
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+-\\s*[0-9]+[.,]?[0-9]*\\s*%.*$', '', 'i')
WHERE name ~ E'%';

-- Remove " - X mg - Y mg" trailing (combo meds with doses in name)
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+-\\s*[0-9]+[.,]?[0-9]*\\s*mg\\s*$', '', 'i')
WHERE name ~ E'mg\\s*$';

-- Remove " - X mg" trailing
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+-\\s*[0-9]+[.,]?[0-9]*\\s*mg\\s*$', '', 'i')
WHERE name ~ E'mg\\s*$';

-- Remove " - X mg - Y mg" anywhere (multi-dose in middle)
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+-\\s*[0-9]+[.,]?[0-9]*\\s*mg.*$', '', 'i')
WHERE name ~ E'[0-9]+mg.*$';

-- Collapse multiple spaces
UPDATE medications
SET name = REGEXP_REPLACE(name, E'\\s+', ' ', 'g');

-- Trim
UPDATE medications
SET name = REGEXP_REPLACE(name, E'^\\s+|\\s+$', '', 'g');

-- ============================================================
-- STEP 6 — Remove brand names from `name`, use `generic_name`
--    When generic_name is non-empty and name differs from it,
--    set name = generic_name (brand stripped)
-- ============================================================
UPDATE medications
SET name = generic_name
WHERE generic_name IS NOT NULL
  AND generic_name != ''
  AND name != generic_name;

-- ============================================================
-- STEP 7 — Populate generic_name from name when empty
-- ============================================================
UPDATE medications
SET generic_name = name
WHERE (generic_name IS NULL OR generic_name = '')
  AND name IS NOT NULL AND name != '';

-- ============================================================
-- STEP 8 — Uppercase all text fields (name, generic_name)
-- ============================================================
UPDATE medications SET name = UPPER(TRIM(name))              WHERE name IS NOT NULL;
UPDATE medications SET generic_name = UPPER(TRIM(generic_name)) WHERE generic_name IS NOT NULL;

-- ============================================================
-- STEP 9 — Final concentration cleanup
-- ============================================================
UPDATE medications
SET concentration = TRIM(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(concentration,
        'MG', 'mg'), 'ML', 'mL'), '  ', ' '), ' / ', ' / '), ' - ', ' - '))
WHERE concentration IS NOT NULL AND concentration != '';

-- ============================================================
-- DONE
-- ============================================================
RAISE NOTICE 'Medications normalization complete.';
COMMIT;