-- ============================================
-- Clinicboard — Seed Data for Preview Branches
-- Flujo de trabajo completo: llegada → triaje → consulta → terminado
-- NOTA: Las citas están programadas para MAÑANA para evitar errores de citas en el pasado
-- ============================================

-- Test Practitioner (1 solo médico)
INSERT INTO practitioners (id, name_given, name_family, specialty, license_number, gender, telecom)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  ARRAY['Juan', 'Carlos'],
  'Pérez Medina',
  'Medicina General',
  'CMD-12345',
  'male',
  '[{"system":"phone","value":"+58 412-555-0100","use":"work"},{"system":"email","value":"dr.perez@clinicavida.com"}]'
);

-- Test Patients (6 pacientes para distintos escenarios)
INSERT INTO patients (id, name_given, name_family, gender, birth_date, telecom, address, practitioner_id, national_id)
VALUES
  -- María García: 39 años - Paciente con condiciones crónicas, consulta TERMINADA
  ('00000000-0000-0000-0000-000000000010', ARRAY['María', 'Isabel'], 'García López', 'female', '1985-03-15',
   '[{"system":"phone","value":"+58 412-555-0101","use":"mobile"},{"system":"email","value":"maria.garcia@email.com"}]',
   '[{"line":"Av. Libertador 1234","city":"Caracas","state":"Distrito Capital","postalCode":"1050","country":"Venezuela"}]',
   '00000000-0000-0000-0000-000000000001', 'V-15234896'),

  -- Carlos López: 46 años - En CONSULTA (in-progress) ahora mismo
  ('00000000-0000-0000-0000-000000000011', ARRAY['Carlos', 'Alberto'], 'López Hernández', 'male', '1978-07-22',
   '[{"system":"phone","value":"+58 414-555-0102","use":"mobile"}]',
   '[{"line":"Calle 5 de Julio 567","city":"Valencia","state":"Carabobo","postalCode":"2001","country":"Venezuela"}]',
   '00000000-0000-0000-0000-000000000001', 'V-6834752'),

  -- Ana Rodríguez: 32 años - Acaba de LLEGAR (arrived)
  ('00000000-0000-0000-0000-000000000012', ARRAY['Ana', 'Mercedes'], 'Rodríguez Pérez', 'female', '1992-11-08',
   '[{"system":"phone","value":"+58 416-555-0103","use":"mobile"}]',
   '[{"line":"Urbanización Terrazas del Avila","city":"Caracas","state":"Distrito Capital","postalCode":"1080","country":"Venezuela"}]',
   '00000000-0000-0000-0000-000000000001', 'V-24567891'),

  -- Luis Martínez: 59 años - En TRIAJE (triaged)
  ('00000000-0000-0000-0000-000000000013', ARRAY['Luis', 'Fernando'], 'Martínez Díaz', 'male', '1965-01-30',
   '[{"system":"phone","value":"+58 412-555-0104","use":"mobile"},{"system":"phone","value":"+58 212-555-0104","use":"home"}]',
   '[{"line":"Av. Intercomunal de Petare 890","city":"Petare","state":"Miranda","postalCode":"1073","country":"Venezuela"}]',
   '00000000-0000-0000-0000-000000000001', 'V-4521678'),

  -- Sofía Hernández: 45 años - Nueva paciente, cita PLANIFICADA
  ('00000000-0000-0000-0000-000000000014', ARRAY['Sofía', 'Carolina'], 'Hernández Ruiz', 'female', '1979-05-20',
   '[{"system":"phone","value":"+58 426-555-0144","use":"mobile"},{"system":"email","value":"sofia.hdez@email.com"}]',
   '[{"line":"Av. Francisco de Miranda 2345","city":"Caracas","state":"Distrito Capital","postalCode":"1060","country":"Venezuela"}]',
   '00000000-0000-0000-0000-000000000001', 'V-18934567'),

  -- Roberto Sánchez: 60 años - Consulta CANCELADA
  ('00000000-0000-0000-0000-000000000015', ARRAY['Roberto', 'Antonio'], 'Sánchez Vega', 'male', '1964-09-10',
   '[{"system":"phone","value":"+58 414-555-0155","use":"mobile"}]',
   '[{"line":"Calle Comercio 123","city":"Maracay","state":"Aragua","postalCode":"2101","country":"Venezuela"}]',
   '00000000-0000-0000-0000-000000000001', 'V-31567890');

-- Test Appointments para MAÑANA (evitar validación de citas en el pasado)
INSERT INTO appointments (id, status, start_time, end_time, patient_id, practitioner_id, appointment_type, reason_code, queue_position)
VALUES
  -- María García: 8:30 - TERMINADA
  ('00000000-0000-0000-0000-000000000020', 'fulfilled',
   (now()::date + interval '1 day' + interval '8 hours 30 minutes')::timestamptz,
   (now()::date + interval '1 day' + interval '9 hours')::timestamptz,
   '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   'Control', '[{"code":"I10","display":"Hipertensión Arterial"}]', 1),

  -- Carlos López: 9:00 - ACTIVO (in-progress)
  ('00000000-0000-0000-0000-000000000021', 'arrived',
   (now()::date + interval '1 day' + interval '9 hours')::timestamptz,
   (now()::date + interval '1 day' + interval '9 hours 45 minutes')::timestamptz,
   '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
   'Consulta General', '[{"code":"R05","display":"Tos"}]', 2),

  -- Ana Rodríguez: 10:00 - LLEGÓ (arrived)
  ('00000000-0000-0000-0000-000000000022', 'arrived',
   (now()::date + interval '1 day' + interval '10 hours')::timestamptz,
   (now()::date + interval '1 day' + interval '10 hours 30 minutes')::timestamptz,
   '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001',
   'Primera Vez', '[{"code":"J06","display":"Infección respiratoria aguda"}]', 3),

  -- Luis Martínez: 10:30 - EN TRIAJE
  ('00000000-0000-0000-0000-000000000023', 'arrived',
   (now()::date + interval '1 day' + interval '10 hours 30 minutes')::timestamptz,
   (now()::date + interval '1 day' + interval '11 hours')::timestamptz,
   '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001',
   'Seguimiento', '[{"code":"E11","display":"Diabetes Mellitus"}]', 4),

  -- Sofía Hernández: 11:00 - PLANIFICADA (próxima)
  ('00000000-0000-0000-0000-000000000024', 'booked',
   (now()::date + interval '1 day' + interval '11 hours')::timestamptz,
   (now()::date + interval '1 day' + interval '11 hours 30 minutes')::timestamptz,
   '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001',
   'Primera Vez', '[{"code":"Z00","display":"Examen médico general"}]', 5),

  -- Roberto Sánchez: 11:30 - CANCELADA
  ('00000000-0000-0000-0000-000000000025', 'cancelled',
   (now()::date + interval '1 day' + interval '11 hours 30 minutes')::timestamptz,
   (now()::date + interval '1 day' + interval '12 hours')::timestamptz,
   '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001',
   'Seguimiento', '[{"code":"M54","display":"Dolor de espalda"}]', 6),

  -- María García otra vez: 14:00 - EN PAUSA (onleave) para la tarde
  ('00000000-0000-0000-0000-000000000026', 'booked',
   (now()::date + interval '1 day' + interval '14 hours')::timestamptz,
   (now()::date + interval '1 day' + interval '14 hours 30 minutes')::timestamptz,
   '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   'Control', '[{"code":"E11","display":"Control Diabetes"}]', 7);

-- Test Encounters (7 encuentros en diferentes estados)
INSERT INTO encounters (id, status, patient_id, practitioner_id, appointment_id, start_time, end_time,
                        encounter_class, vital_signs, encounter_category)
VALUES
  -- María García: TERMINADA (finished) - 8:30 a 9:00
  ('00000000-0000-0000-0000-000000000030', 'finished',
   '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000020',
   (now()::date + interval '1 day' + interval '8 hours 30 minutes')::timestamptz,
   (now()::date + interval '1 day' + interval '9 hours')::timestamptz,
   'AMB', '{"bloodPressure":"130/85","heartRate":76,"temperature":36.8,"weight":72,"height":165}',
   'consulta'),

  -- Carlos López: EN CONSULTA (in-progress) - 9:00 ahora
  ('00000000-0000-0000-0000-000000000031', 'in-progress',
   '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000021',
   (now()::date + interval '1 day' + interval '9 hours')::timestamptz,
   NULL,
   'AMB', '{"bloodPressure":"120/78","heartRate":72,"temperature":36.5}',
   'consulta'),

  -- Ana Rodríguez: LLEGÓ (arrived) - esperando en sala
  ('00000000-0000-0000-0000-000000000032', 'arrived',
   '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000022',
   (now()::date + interval '1 day' + interval '10 hours')::timestamptz,
   NULL,
   'AMB', '{}',
   'primera_vez'),

  -- Luis Martínez: EN TRIAJE (triaged)
  ('00000000-0000-0000-0000-000000000033', 'triaged',
   '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000023',
   (now()::date + interval '1 day' + interval '10 hours 30 minutes')::timestamptz,
   NULL,
   'AMB', '{"bloodPressure":"145/92","heartRate":84,"temperature":37.2,"weight":88,"height":170}',
   'seguimiento'),

  -- Sofía Hernández: PLANIFICADA (planned) - próxima cita
  ('00000000-0000-0000-0000-000000000034', 'planned',
   '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000024',
   (now()::date + interval '1 day' + interval '11 hours')::timestamptz,
   NULL,
   'AMB', '{}',
   'primera_vez'),

  -- Roberto Sánchez: CANCELADA
  ('00000000-0000-0000-0000-000000000035', 'cancelled',
   '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000025',
   (now()::date + interval '1 day' + interval '11 hours 30 minutes')::timestamptz,
   NULL,
   'AMB', '{}',
   'seguimiento'),

  -- María García: EN PAUSA (onleave) - cita de la tarde
  ('00000000-0000-0000-0000-000000000036', 'onleave',
   '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000026',
   (now()::date + interval '1 day' + interval '14 hours')::timestamptz,
   NULL,
   'AMB', '{}',
   'control');

-- Clinical Notes (SOAP) para encuentros terminados y en progreso
INSERT INTO clinical_notes (id, encounter_id, patient_id, practitioner_id, subjective, objective, analysis, plan, diagnosis, is_finalized)
VALUES
  -- Nota de María García (finished) - Control de hipertensión y diabetes
  ('00000000-0000-0000-0000-000000000040',
   '00000000-0000-0000-0000-000000000030',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
   'Paciente refiere sentirse bien. Adhiere a tratamiento farmacológico. No refiere cefalea ni mareos. Ha controlado dieta baja en sal. Niega poliuria, polidipsia o visión borrosa.',
   'PA: 130/85 mmHg, FC: 76 lpm, T°: 36.8°C, Peso: 72 kg. Paciente consciente, orientada, mucosas húmedas. Cardiorrespiratorio sin ruidos patológicos. Abdomen blando, depresible, sin dolor. Miembros inferiores sin edema.',
   'Hipertensión arterial en tratamiento, controlada. Diabetes Mellitus tipo 2 en control. Se observa buena adherencia al tratamiento. Se mantiene tratamiento actual.',
   '1. Continuar Losartan 50mg c/12h\n2. Continuar Metformina 850mg c/12h\n3. Dieta hiposódica, hipoglúcida\n4. Ejercicio aeróbico 30 min/día\n5. Próximo control en 3 meses con laboratorios',
   '[{"code":"I10","display":"Hipertensión Arterial Esencial","system":"ICD-10"},{"code":"E11.9","display":"Diabetes Mellitus tipo 2 sin complicaciones","system":"ICD-10"}]',
   true),

  -- Nota de Carlos López (in-progress) - Consulta en curso
  ('00000000-0000-0000-0000-000000000041',
   '00000000-0000-0000-0000-000000000031',
   '00000000-0000-0000-0000-000000000011',
   '00000000-0000-0000-0000-000000000001',
   'Paciente refiere tos productiva con flema blanca hace 5 días. Asociado a congestión nasal y dolor de garganta. Fiebre no cuantificada. Niega disnea o dolor torácico.',
   'PA: 120/78 mmHg, FC: 72 lpm, T°: 36.5°C. ORL: Mucosa oral hidratada, orofaringe eritematosa, amígdalas sin exudado. Pulmones: murmullo vesicular conservado, sin ruidos agregados.',
   'Cuadro respiratorio agudo viral compatible con resfriado común. Se descarta signos de alarma.',
   '1. Acetaminofén 500mg c/6h si dolor o fiebre\n2. Hidratación abundante\n3. Reposo relativo 3-5 días\n4. Jarabe para la tos expectorante\n5. Señales de alarma: disnea, fiebre > 39°C, expectoración purulenta',
   '[{"code":"J06.9","display":"Infección respiratoria aguda superior no especificada","system":"ICD-10"}]',
   false);

-- Test Conditions (Diagnósticos/Condiciones crónicas y activas)
INSERT INTO conditions (code, code_display, patient_id, onset_date, clinical_status, verification_status)
VALUES
  -- María García: Hipertensión y Diabetes
  ('I10', 'Hipertensión Arterial Esencial (Primaria)', '00000000-0000-0000-0000-000000000010', '2020-06-01', 'active', 'confirmed'),
  ('E11.9', 'Diabetes Mellitus Tipo 2 sin complicaciones', '00000000-0000-0000-0000-000000000010', '2022-01-15', 'active', 'confirmed'),

  -- Luis Martínez: Diabetes
  ('E11.9', 'Diabetes Mellitus Tipo 2 sin complicaciones', '00000000-0000-0000-0000-000000000013', '2019-03-20', 'active', 'confirmed'),

  -- Sofía Hernández: Resfriado común (condición aguda)
  ('J06.9', 'Infección respiratoria aguda superior', '00000000-0000-0000-0000-000000000014', '2026-06-25', 'active', 'confirmed'),

  -- Roberto Sánchez: Dolor de espalda crónico
  ('M54.5', 'Dolor lumbar (Lumbago)', '00000000-0000-0000-0000-000000000015', '2025-11-10', 'active', 'confirmed');

-- Test Allergies
INSERT INTO allergy_intolerances (code, code_display, category, criticality, patient_id, clinical_status)
VALUES
  -- María García: Alergia a penicilina
  ('penicillin', 'Penicilina', ARRAY['medication'], 'high', '00000000-0000-0000-0000-000000000010', 'active'),

  -- Luis Martínez: Alergia a sulfa
  ('sulfa', 'Sulfonamidas', ARRAY['medication'], 'low', '00000000-0000-0000-0000-000000000013', 'active'),

  -- Ana Rodríguez: Alergia a ibuprofeno
  ('ibuprofen', 'Ibuprofeno', ARRAY['medication'], 'high', '00000000-0000-0000-0000-000000000012', 'active');

-- Medication Requests (Prescripciones activas)
INSERT INTO medication_requests (medication_code, medication_display, patient_id, prescriber_id, encounter_id, status, dosage_instruction, dispense_request, authored_on)
VALUES
  -- María García:处方 de Losartan
  ('LOSARTAN50', 'Losartán 50mg',
   '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000030', 'active',
   '[{"timing":"c/12h","route":"oral","dose":"50mg","text":"50mg cada 12 horas orally"}]',
   '[{"quantity":30,"refills":3,"expectedSupplyDuration":"P30D"}]',
   now()::date - interval '30 days'),

  -- María García:处方 de Metformina
  ('METFORMINA850', 'Metformina 850mg',
   '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000030', 'active',
   '[{"timing":"c/12h","route":"oral","dose":"850mg","text":"850mg cada 12 horas orally"}]',
   '[{"quantity":60,"refills":3,"expectedSupplyDuration":"P30D"}]',
   now()::date - interval '30 days'),

  -- Luis Martínez:处方 de Metformina
  ('METFORMINA850', 'Metformina 850mg',
   '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000033', 'active',
   '[{"timing":"c/12h","route":"oral","dose":"850mg","text":"850mg cada 12 horas orally"}]',
   '[{"quantity":60,"refills":2,"expectedSupplyDuration":"P30D"}]',
   now()::date - interval '60 days');
