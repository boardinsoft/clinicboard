-- Migration: 20260612000000_create_medications_table.sql
-- Desc: Tabla de medicamentos (vademécum) alimentada desde registro sanitario INHRR Venezuela
-- Columns: code, name, generic_name, pharmaceutical_form, concentration

CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    pharmaceutical_form TEXT,
    concentration TEXT,
    country TEXT DEFAULT 'Venezuela' NOT NULL,
    clinic_id UUID REFERENCES clinics(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_medications_code ON medications(code);
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);
CREATE INDEX IF NOT EXISTS idx_medications_generic_name ON medications(generic_name);
CREATE INDEX IF NOT EXISTS idx_medications_clinic_id ON medications(clinic_id);

-- RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medications_read" ON medications FOR SELECT USING (
    auth.role() = 'authenticated'
);

CREATE POLICY "medications_insert" ON medications FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

CREATE POLICY "medications_update" ON medications FOR UPDATE USING (
    auth.role() = 'authenticated'
);

CREATE POLICY "medications_delete" ON medications FOR DELETE USING (
    auth.role() = 'authenticated'
);

COMMENT ON TABLE medications IS 'Vademécum de medicamentos. Fuente inicial: registro sanitario INHRR Venezuela.';
COMMENT ON COLUMN medications.code IS 'Código de registro sanitario (ej: E.F.44.622)';
COMMENT ON COLUMN medications.name IS 'Nombre comercial completo (ej: QUETIVAL 300 mg TABLETAS RECUBIERTAS)';
COMMENT ON COLUMN medications.generic_name IS 'Denominación Común Internacional / principio activo (ej: FUMARATO DE QUETIAPINA)';
COMMENT ON COLUMN medications.pharmaceutical_form IS 'Forma farmaceútica (ej: TABLETAS RECUBIERTAS, COMPRIMIDOS, JARABE)';
COMMENT ON COLUMN medications.concentration IS 'Concentración del principio activo (ej: 300 mg, 20 mg/2mL)';