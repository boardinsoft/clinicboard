-- ============================================
-- Clinicboard FHIR Schema — Practitioners
-- ============================================

CREATE TABLE IF NOT EXISTS practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fhir_id TEXT UNIQUE NOT NULL DEFAULT ('pract-' || gen_random_uuid()::text),
  active BOOLEAN DEFAULT true,
  name_given TEXT[] NOT NULL,
  name_family TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  telecom JSONB DEFAULT '[]',
  specialty TEXT,
  license_number TEXT,
  auth_user_id UUID UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Clinicboard FHIR Schema — Patients
-- ============================================

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fhir_id TEXT UNIQUE NOT NULL DEFAULT ('pat-' || gen_random_uuid()::text),
  active BOOLEAN DEFAULT true,
  name_given TEXT[] NOT NULL,
  name_family TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  birth_date DATE,
  telecom JSONB DEFAULT '[]',
  address JSONB DEFAULT '[]',
  identifiers JSONB DEFAULT '[]',
  extensions JSONB DEFAULT '{}',
  encrypted_notes TEXT,
  practitioner_id UUID REFERENCES practitioners(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Clinicboard FHIR Schema — Appointments
-- ============================================

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fhir_id TEXT UNIQUE NOT NULL DEFAULT ('apt-' || gen_random_uuid()::text),
  status TEXT CHECK (status IN (
    'proposed', 'pending', 'booked', 'arrived',
    'fulfilled', 'cancelled', 'noshow'
  )) DEFAULT 'proposed',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES practitioners(id),
  appointment_type TEXT,
  reason_code JSONB DEFAULT '[]',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Clinicboard FHIR Schema — Encounters
-- ============================================

CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fhir_id TEXT UNIQUE NOT NULL DEFAULT ('enc-' || gen_random_uuid()::text),
  status TEXT CHECK (status IN (
    'planned', 'arrived', 'triaged', 'in-progress',
    'onleave', 'finished', 'cancelled'
  )) DEFAULT 'planned',
  encounter_class TEXT DEFAULT 'AMB',
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES practitioners(id),
  appointment_id UUID REFERENCES appointments(id),
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  reason_code JSONB DEFAULT '[]',
  evolution_note TEXT,
  vital_signs JSONB DEFAULT '{}',
  diagnosis JSONB DEFAULT '[]',
  plan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Clinicboard FHIR Schema — Conditions
-- ============================================

CREATE TABLE IF NOT EXISTS conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fhir_id TEXT UNIQUE NOT NULL DEFAULT ('cond-' || gen_random_uuid()::text),
  clinical_status TEXT DEFAULT 'active',
  verification_status TEXT DEFAULT 'confirmed',
  category TEXT DEFAULT 'encounter-diagnosis',
  code TEXT NOT NULL,
  code_display TEXT NOT NULL,
  code_system TEXT DEFAULT 'ICD-10',
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  onset_date DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Clinicboard FHIR Schema — Allergy Intolerance
-- ============================================

CREATE TABLE IF NOT EXISTS allergy_intolerances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fhir_id TEXT UNIQUE NOT NULL DEFAULT ('alg-' || gen_random_uuid()::text),
  clinical_status TEXT DEFAULT 'active',
  allergy_type TEXT CHECK (allergy_type IN ('allergy', 'intolerance')) DEFAULT 'allergy',
  category TEXT[] DEFAULT '{}',
  criticality TEXT CHECK (criticality IN ('low', 'high', 'unable-to-assess')),
  code TEXT NOT NULL,
  code_display TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  reactions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Clinicboard FHIR Schema — Medication Requests
-- ============================================

CREATE TABLE IF NOT EXISTS medication_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fhir_id TEXT UNIQUE NOT NULL DEFAULT ('rx-' || gen_random_uuid()::text),
  status TEXT CHECK (status IN (
    'active', 'on-hold', 'cancelled', 'completed',
    'stopped', 'draft', 'unknown'
  )) DEFAULT 'active',
  intent TEXT CHECK (intent IN (
    'proposal', 'plan', 'order', 'original-order',
    'reflex-order', 'filler-order', 'instance-order'
  )) DEFAULT 'order',
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES encounters(id),
  prescriber_id UUID REFERENCES practitioners(id),
  medication_code TEXT NOT NULL,
  medication_display TEXT NOT NULL,
  dosage_instruction JSONB DEFAULT '[]',
  dispense_request JSONB DEFAULT '{}',
  authored_on TIMESTAMPTZ DEFAULT now(),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_intolerances ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_requests ENABLE ROW LEVEL SECURITY;

-- Practitioners can only see their own data
CREATE POLICY "practitioners_own_data" ON practitioners
  FOR ALL USING (auth_user_id = auth.uid());

-- Practitioners only see their own patients
CREATE POLICY "practitioners_own_patients" ON patients
  FOR ALL USING (practitioner_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- Same for appointments
CREATE POLICY "practitioners_own_appointments" ON appointments
  FOR ALL USING (practitioner_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- Same for encounters
CREATE POLICY "practitioners_own_encounters" ON encounters
  FOR ALL USING (practitioner_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- Conditions follow patient ownership
CREATE POLICY "conditions_via_patient" ON conditions
  FOR ALL USING (patient_id IN (
    SELECT id FROM patients WHERE practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  ));

-- Allergies follow patient ownership
CREATE POLICY "allergies_via_patient" ON allergy_intolerances
  FOR ALL USING (patient_id IN (
    SELECT id FROM patients WHERE practitioner_id IN (
      SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
    )
  ));

-- Prescriptions follow prescriber
CREATE POLICY "prescriptions_own" ON medication_requests
  FOR ALL USING (prescriber_id IN (
    SELECT id FROM practitioners WHERE auth_user_id = auth.uid()
  ));

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_patients_practitioner ON patients(practitioner_id);
CREATE INDEX idx_patients_name ON patients(name_family, name_given);
CREATE INDEX idx_appointments_time ON appointments(start_time, end_time);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_encounters_patient ON encounters(patient_id);
CREATE INDEX idx_medication_requests_patient ON medication_requests(patient_id);

-- ============================================
-- Updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_patients
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_appointments
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_encounters
  BEFORE UPDATE ON encounters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_practitioners
  BEFORE UPDATE ON practitioners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
