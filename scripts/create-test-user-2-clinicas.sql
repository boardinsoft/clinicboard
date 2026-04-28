-- ============================================
-- Create Test User with 2 Clinics
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- Create test clinics
INSERT INTO clinics (id, name, slug, active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Clínica San Rafael', 'san-rafael', true),
  ('22222222-2222-2222-2222-222222222222', 'Hospital Central', 'hospital-central', true)
ON CONFLICT (id) DO NOTHING;

-- Create practitioner linked to auth user (auth_user_id must be a valid UUID from auth.users)
-- NOTE: First create the auth user in Supabase Dashboard > Authentication > Add User
-- Then use that user's ID as auth_user_id
INSERT INTO practitioners (id, name_given, name_family, specialty, license_number, auth_user_id, active) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', ARRAY['Juan', 'Carlos'], 'Pérez Medina', 'Medicina Interna', 'CMD-12345', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- Link practitioner to 2 clinics
INSERT INTO clinic_practitioners (clinic_id, practitioner_id, active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true)
ON CONFLICT DO NOTHING;

-- Create test patients for the practitioner
INSERT INTO patients (id, name_given, name_family, gender, birth_date, telecom, practitioner_id, clinic_id) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', ARRAY['María'], 'García López', 'female', '1985-03-15', '[{"system":"phone","value":"+1 809-555-0101","use":"mobile"}]', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;