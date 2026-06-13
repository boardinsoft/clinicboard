-- ============================================
-- Clinicboard — Seed Data for Preview Branches
-- ============================================

-- Test Practitioner
INSERT INTO practitioners (id, name_given, name_family, specialty, license_number)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  ARRAY['Juan', 'Carlos'],
  'Pérez Medina',
  'Medicina Interna',
  'CMD-12345'
);

-- Test Patients
INSERT INTO patients (id, name_given, name_family, gender, birth_date, telecom, practitioner_id)
VALUES
  ('00000000-0000-0000-0000-000000000010', ARRAY['María'], 'García López', 'female', '1985-03-15', '[{"system":"phone","value":"+1 809-555-0101","use":"mobile"}]', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000011', ARRAY['Carlos'], 'López Hernández', 'male', '1978-07-22', '[{"system":"phone","value":"+1 809-555-0102","use":"mobile"}]', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000012', ARRAY['Ana'], 'Rodríguez Pérez', 'female', '1992-11-08', '[{"system":"phone","value":"+1 809-555-0103","use":"mobile"}]', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000013', ARRAY['Luis'], 'Martínez Díaz', 'male', '1965-01-30', '[{"system":"phone","value":"+1 809-555-0104","use":"mobile"}]', '00000000-0000-0000-0000-000000000001');

-- Test Conditions
INSERT INTO conditions (code, code_display, patient_id, onset_date)
VALUES
  ('I10', 'Hipertensión Arterial', '00000000-0000-0000-0000-000000000010', '2020-06-01'),
  ('E11', 'Diabetes Mellitus Tipo 2', '00000000-0000-0000-0000-000000000010', '2022-01-15');

-- Test Allergies
INSERT INTO allergy_intolerances (code, code_display, category, criticality, patient_id)
VALUES
  ('penicillin', 'Penicilina', ARRAY['medication'], 'high', '00000000-0000-0000-0000-000000000010');

-- Test Appointments (today)
INSERT INTO appointments (status, start_time, end_time, patient_id, practitioner_id, appointment_type)
VALUES
  ('fulfilled', now()::date + interval '8 hours 30 minutes', now()::date + interval '9 hours', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Control'),
  ('booked', now()::date + interval '9 hours', now()::date + interval '9 hours 30 minutes', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Consulta General'),
  ('booked', now()::date + interval '10 hours', now()::date + interval '10 hours 45 minutes', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Primera Vez'),
  ('proposed', now()::date + interval '11 hours', now()::date + interval '11 hours 30 minutes', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Seguimiento');
