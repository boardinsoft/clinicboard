'use client';

import React from 'react';
import {
    Clock, Stethoscope, Activity, Shield, Users, User, Search,
    AlertTriangle, Settings2, ClipboardList, Microscope, Utensils,
    Dumbbell, MessageCircle, HeartPulse, Zap, RefreshCw
} from 'lucide-react';

export type WizardProfileKey =
    | 'first_visit'
    | 'followup_general'
    | 'followup_postop'
    | 'followup_exams'
    | 'followup_psych_meds'
    | 'followup_wound_care'
    | 'followup_peds_neonatal'
    | 'followup_rehab_therapy'
    | 'followup_prenatal_high_risk'
    | 'emergency'
    | 'preventive'
    | 'procedure'
    | 'nutrition'
    | 'nutrition_weight'
    | 'nutrition_clinical'
    | 'nutrition_sports'
    | 'nutrition_pediatric_maternal'
    | 'nutrition_behavioral'
    | 'psychotherapy'
    | 'psych_mood_anxiety'
    | 'psych_relationships'
    | 'pediatric'
    | 'pediatric_growth'
    | 'pediatric_infectious'
    | 'pediatric_neurobehavioral'
    | 'womens_health'
    | 'womens_routine'
    | 'womens_prenatal'
    | 'womens_pathology'
    | 'sports'
    | 'sports_clearance'
    | 'sports_injury'
    | 'telemedicine'
    | 'acute_respiratory'
    | 'acute_gastrointestinal'
    | 'acute_osteomuscular'
    | 'acute_neuro'
    | 'chronic_cardiometabolic'
    | 'chronic_respiratory'
    | 'chronic_rheumatological'
    | 'chronic_neuro'
    | 'preventive_specialized'
    | 'occupational_health'
    | 'procedure_nursing'
    | 'therapy_infusional'
    | 'therapy_rehab'
    | 'emergency_trauma'
    | 'emergency_cardio_resp'
    | 'emergency_minor'
    | 'interconsultation_general'
    | 'interconsultation_cardiology'
    | 'interconsultation_neurology'
    | 'interconsultation_pulmonology'
    | 'interconsultation_gastroenterology'
    | 'interconsultation_nephrology'
    | 'interconsultation_endocrinology'
    | 'interconsultation_hematology'
    | 'interconsultation_infectious_diseases'
    | 'interconsultation_rheumatology'
    | 'interconsultation_oncology'
    | 'interconsultation_dermatology'
    | 'interconsultation_ophthalmology'
    | 'interconsultation_otolaryngology'
    | 'interconsultation_urology'
    | 'interconsultation_orthopedics'
    | 'interconsultation_psychiatry'
    | 'interconsultation_geriatrics'
    | 'interconsultation_gynecology'
    | 'interconsultation_surgery'
    | 'interconsultation_allergy'
    | 'second_opinion_oncology'
    | 'second_opinion_neurology'
    | 'second_opinion_surgery'
    | 'second_opinion_cardiology'
    | 'second_opinion_rare_disease'
    | 'second_opinion_pain'
    | 'second_opinion_fertility'
    | 'second_opinion_ortho'
    | 'second_opinion_general'
    | 'clinical_observation';

export const WIZARD_PROFILE_MAP: Record<string, WizardProfileKey> = {
    'Consulta de Primera Vez': 'first_visit',
    'Interconsulta': 'interconsultation_general',
    'Segunda Opinión Médica': 'second_opinion_general',
    'Confirmación de diagnóstico oncológico': 'second_opinion_oncology',
    'Alternativas de tratamiento quirúrgico': 'second_opinion_surgery',
    'Segunda opinión en cirugía de columna': 'second_opinion_surgery',
    'Re-evaluación de enfermedad autoinmune': 'second_opinion_general',
    'Dudas sobre manejo crónico': 'second_opinion_general',
    'Opinión sobre enfermedad rara': 'second_opinion_rare_disease',
    'Evaluación de dolor refractario': 'second_opinion_pain',
    'Segunda opinión en neurología / epilepsia': 'second_opinion_neurology',
    'Manejo alternativo de cardiopatía': 'second_opinion_cardiology',
    'Revaloración de lesión deportiva': 'second_opinion_ortho',
    'Opciones de fertilidad / reproducción': 'second_opinion_fertility',
    'Evaluación de intolerancias alimentarias': 'second_opinion_general',
    'Dudas sobre necesidad de prótesis': 'second_opinion_ortho',
    'Opinión sobre terapias biológicas': 'second_opinion_general',
    'Manejo de nódulo tiroideo': 'second_opinion_general',
    'Revisión de polifarmacia': 'second_opinion_general',
    'Perspectiva sobre patología psiquiátrica': 'second_opinion_general',
    'Alternativas en cirugía estética': 'second_opinion_surgery',
    'Opinión pediátrica compleja': 'second_opinion_general',
    'Consejería por mal pronóstico': 'second_opinion_oncology',
    'Consulta de Seguimiento / Control': 'followup_general',
    'Control Postoperatorio Temprano': 'followup_postop',
    'Control Postoperatorio Tardío': 'followup_postop',
    'Revisión de Exámenes': 'followup_exams',
    'Seguimiento de medicación psiquiátrica': 'followup_psych_meds',
    'Control de curación de heridas': 'followup_wound_care',
    'Seguimiento pediátrico/neonatal': 'followup_peds_neonatal',
    'Seguimiento de terapia de rehabilitación': 'followup_rehab_therapy',
    'Control prenatal de alto riesgo': 'followup_prenatal_high_risk',
    'Urgencia Menor': 'emergency_minor',
    'Urgencia Mayor': 'emergency_trauma',
    'Emergencia Vital': 'emergency_cardio_resp',
    'Observación Clínica': 'clinical_observation',
    'Chequeo Preventivo Integral': 'preventive',
    'Evaluación Laboral / Pre-empleo': 'preventive',
    'Procedimiento Médico Mayor Ambulatorio': 'procedure',
    'Procedimiento de Enfermería': 'procedure_nursing',
    'Terapia Infusional': 'therapy_infusional',
    'Terapia de Rehabilitación': 'therapy_rehab',
    'Control de peso (Pérdida/Aumento)': 'nutrition_weight',
    'Evaluación de composición corporal por impedancia': 'nutrition_weight',
    'Asesoramiento para cirugía bariátrica': 'nutrition_weight',
    'Plan alimentario para Diabetes Mellitus': 'nutrition_clinical',
    'Nutrición en Hipertensión Arterial': 'nutrition_clinical',
    'Manejo de Dislipidemia': 'nutrition_clinical',
    'Dietoterapia para Intestino Irritable / SIBO': 'nutrition_clinical',
    'Soporte nutricional oncológico': 'nutrition_clinical',
    'Alergias o intolerancias alimentarias (Ej. Celíacos)': 'nutrition_clinical',
    'Manejo del paciente renal crónico': 'nutrition_clinical',
    'Soporte nutricional post-quirúrgico': 'nutrition_clinical',
    'Nutrición preventiva para osteoporosis': 'nutrition_clinical',
    'Asesoría nutricional deportiva': 'nutrition_sports',
    'Plan de recarga pre-competencia deportiva': 'nutrition_sports',
    'Nutrición durante el embarazo y lactancia': 'nutrition_pediatric_maternal',
    'Nutrición pediátrica / ablactación': 'nutrition_pediatric_maternal',
    'Asesoría para transición vegetariana/vegana': 'nutrition_behavioral',
    'Reeducación de hábitos familiares': 'nutrition_behavioral',
    'Abordaje nutricional de TCA': 'nutrition_behavioral',
    'Asesoría en lectura de etiquetas e ingredientes': 'nutrition_behavioral',
    'Asesoría Nutricional': 'nutrition',
    'Sesión de Psicoterapia': 'psychotherapy',
    'Crisis de ansiedad / Pánico': 'psych_mood_anxiety',
    'Episodio depresivo mayor': 'psych_mood_anxiety',
    'Trastorno obsesivo-compulsivo (TOC)': 'psych_mood_anxiety',
    'Terapia de pareja / Conflictos': 'psych_relationships',
    'Conflictos familiares / Sistémicos': 'psych_relationships',
    'Manejo del duelo y pérdida': 'psych_relationships',
    'Control de Niño Sano / Inmunización': 'pediatric',
    'Control de crecimiento y desarrollo': 'pediatric_growth',
    'Evaluación de hitos del desarrollo': 'pediatric_growth',
    'Inicio de alimentación complementaria': 'pediatric_growth',
    'Control nutricional pediátrico': 'pediatric_growth',
    'Control de infecciones a repetición': 'pediatric_infectious',
    'Cólico del lactante': 'pediatric_infectious',
    'Dermatitis del pañal / Cuidados de la piel': 'pediatric_infectious',
    'Trastornos del sueño infantil': 'pediatric_neurobehavioral',
    'Sospecha de TEA o TDAH': 'pediatric_neurobehavioral',
    'Comportamiento infantil (Rabietas)': 'pediatric_neurobehavioral',
    'Planificación Familiar y Salud Femenina': 'womens_health',
    'Control ginecológico anual': 'womens_routine',
    'Papanicolaou (PAP) / Citología': 'womens_routine',
    'Inicio de método anticonceptivo': 'womens_routine',
    'Control de método anticonceptivo': 'womens_routine',
    'Control prenatal de rutina': 'womens_prenatal',
    'Consejería preconcepcional': 'womens_prenatal',
    'Control de puerperio (Postparto)': 'womens_prenatal',
    'Síndrome de ovario poliquístico (SOP)': 'womens_pathology',
    'Endometriosis': 'womens_pathology',
    'Menopausia y Climaterio': 'womens_pathology',
    'Sangrado uterino anormal': 'womens_pathology',
    'Aptitud Deportiva': 'sports',
    'Prueba de esfuerzo (Ergometría)': 'sports_clearance',
    'Despistaje de riesgo de muerte súbita': 'sports_clearance',
    'Certificado médico inicio de gimnasio': 'sports_clearance',
    'Revisión de lesiones musculares previas': 'sports_injury',
    'Prevención de lesiones osteoarticulares': 'sports_injury',
    'Retorno al juego (Return to play)': 'sports_injury',
    'Tos seca o productiva': 'acute_respiratory',
    'Dificultad sintomática para respirar (Disnea)': 'acute_respiratory',
    'Dolor de garganta / Odinofagia': 'acute_respiratory',
    'Congestión nasal o coriza': 'acute_respiratory',
    'Dolor abdominal inespecífico': 'acute_gastrointestinal',
    'Diarrea o alteraciones del tránsito': 'acute_gastrointestinal',
    'Vómitos o náuseas persistentes': 'acute_gastrointestinal',
    'Dolor de espalda bajo (Lumbalgia)': 'acute_osteomuscular',
    'Dolor general articular / Mialgia': 'acute_osteomuscular',
    'Dolor de cabeza (Cefalea)': 'acute_neuro',
    'Mareos o episodios de Vértigo': 'acute_neuro',
    'Diabetes Mellitus tipo 2': 'chronic_cardiometabolic',
    'Hipertensión Arterial (HTA)': 'chronic_cardiometabolic',
    'Asma Bronquial': 'chronic_respiratory',
    'Enfermedad Pulmonar Obstructiva Crónica (EPOC)': 'chronic_respiratory',
    'Artritis Reumatoide': 'chronic_rheumatological',
    'Osteoartritis / Artrosis': 'chronic_rheumatological',
    'Epilepsia / Síndrome convulsivo': 'chronic_neuro',
    'Migraña crónica': 'chronic_neuro',
    'Chequeo general / Preventivo': 'preventive_specialized',
    'Examen de aptitud física / laboral': 'occupational_health',
    'Evaluación preoperatoria': 'preventive_specialized',
    'Examen médico ocupacional': 'occupational_health',
    'Teleconsulta': 'telemedicine',
    'Asesoramiento / Renovación de Receta': 'telemedicine',
    'Valoración por Cardiología': 'interconsultation_cardiology',
    'Valoración por Neurología': 'interconsultation_neurology',
    'Valoración por Neumología': 'interconsultation_pulmonology',
    'Valoración por Gastroenterología': 'interconsultation_gastroenterology',
    'Valoración por Nefrología': 'interconsultation_nephrology',
    'Valoración por Endocrinología': 'interconsultation_endocrinology',
    'Valoración por Hematología': 'interconsultation_hematology',
    'Valoración por Infectología': 'interconsultation_infectious_diseases',
    'Valoración por Reumatología': 'interconsultation_rheumatology',
    'Valoración por Oncología': 'interconsultation_oncology',
    'Valoración por Dermatología': 'interconsultation_dermatology',
    'Valoración por Oftalmología': 'interconsultation_ophthalmology',
    'Valoración por Otorrinolaringología': 'interconsultation_otolaryngology',
    'Valoración por Urología': 'interconsultation_urology',
    'Valoración por Traumatología y Ortopedia': 'interconsultation_orthopedics',
    'Valoración por Psiquiatría': 'interconsultation_psychiatry',
    'Valoración por Geriatría': 'interconsultation_geriatrics',
    'Valoración por Ginecología': 'interconsultation_gynecology',
    'Valoración por Cirugía General': 'interconsultation_surgery',
    'Valoración por Alergología e Inmunología': 'interconsultation_allergy',
};

type WizardStep = { icon: React.ReactNode; label: string; key: string };

export const WIZARD_PROFILES: Record<WizardProfileKey, { title: string; description: string; steps: WizardStep[] }> = {
    first_visit: {
        title: 'Asistente: Primera Consulta (Completa)',
        description: 'Recopile la anamnesis completa del paciente. Proceso estandarizado para ingreso.',
        steps: [
            { icon: <Clock className="w-5 h-5" />, label: 'Enfermedad Actual', key: 'illness' },
            { icon: <Stethoscope className="w-5 h-5" />, label: 'A. Personales', key: 'personal' },
            { icon: <Activity className="w-5 h-5" />, label: 'A. Quirúrgicos', key: 'surgical' },
            { icon: <Shield className="w-5 h-5" />, label: 'Meds & Alergias', key: 'meds_allergies' },
            { icon: <Users className="w-5 h-5" />, label: 'Fam. / Herencia', key: 'family' },
            { icon: <User className="w-5 h-5" />, label: 'Hábitos', key: 'habits' },
            { icon: <Search className="w-5 h-5" />, label: 'R. por Sistemas', key: 'review_systems' },
        ],
    },
    followup_general: {
        title: 'Asistente: Seguimiento Clínico',
        description: 'Actualice el estado actual, evolución de síntomas y adherencia al tratamiento.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Estructura ACD', key: 'followup_status' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Ajuste / Notas', key: 'followup_changes' },
        ],
    },
    followup_postop: {
        title: 'Asistente: Control Postoperatorio',
        description: 'Evalúe la evolución del dolor, herida quirúrgica y estado funcional.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Estado General', key: 'postop_status' },
            { icon: <Search className="w-5 h-5" />, label: 'Herida y Drenaje', key: 'postop_wound' },
        ],
    },
    followup_exams: {
        title: 'Asistente: Revisión de Exámenes',
        description: 'Correlacione los hallazgos de laboratorio/imagen con el cuadro clínico.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Exámenes', key: 'exam_results' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Conducta Médica', key: 'exam_conduct' },
        ],
    },
    followup_psych_meds: {
        title: 'Asistente: Seguimiento Psiquiátrico',
        description: 'Evalúe la tolerancia a medicación y ajuste el esquema psicofarmacológico.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Evolución Mental', key: 'psych_status' },
            { icon: <Shield className="w-5 h-5" />, label: 'Tolerancia', key: 'meds_tolerance' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Ajuste / Plan', key: 'psych_adjustments' },
        ],
    },
    followup_wound_care: {
        title: 'Asistente: Clínica de Heridas',
        description: 'Deje constancia de la evolución, limpieza y nueva curación de la herida.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Examen Herida', key: 'wound_evolution' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Plan de Curación', key: 'wound_treatment' },
        ],
    },
    followup_peds_neonatal: {
        title: 'Asistente: Seguimiento Pediátrico',
        description: 'Vigile el crecimiento, desarrollo e incorpore medidas preventivas.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Alimentación', key: 'peds_history' },
            { icon: <Stethoscope className="w-5 h-5" />, label: 'Examen Físico', key: 'peds_exam' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Indicaciones', key: 'peds_plan' },
        ],
    },
    followup_rehab_therapy: {
        title: 'Asistente: Seguimiento Rehabilitación',
        description: 'Registre el progreso funcional, rangos de movimiento y dolor.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Progreso Motor', key: 'rehab_progress' },
            { icon: <Search className="w-5 h-5" />, label: 'Examen Físico', key: 'rehab_exam' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Plan Terapéutico', key: 'rehab_plan' },
        ],
    },
    followup_prenatal_high_risk: {
        title: 'Asistente: Seguimiento Prenatal',
        description: 'Monitorice signos vitales maternos, peso y bienestar fetal.',
        steps: [
            { icon: <HeartPulse className="w-5 h-5" />, label: 'Estado Materno', key: 'maternal_exam' },
            { icon: <Search className="w-5 h-5" />, label: 'Bienestar Fetal', key: 'fetal_monitoring' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Plan Obstétrico', key: 'prenatal_plan' },
        ],
    },
    emergency: {
        title: 'Asistente: Emergencia / Urgencia',
        description: 'Registre rápidamente la información crítica del paciente.',
        steps: [
            { icon: <Zap className="w-5 h-5" />, label: 'Motivo Urgente', key: 'emergency_reason' },
            { icon: <AlertTriangle className="w-5 h-5" />, label: 'Alergias', key: 'meds_allergies' },
        ],
    },
    clinical_observation: {
        title: 'Asistente: Observación Clínica',
        description: 'Vigilancia continua, control de signos, balance y estado basal.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Estado Basal / SV', key: 'obs_vitals' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Evolución', key: 'obs_evolution' },
        ],
    },
    preventive: {
        title: 'Asistente: Medicina Preventiva',
        description: 'Evalúe el riesgo y estilo de vida del paciente.',
        steps: [
            { icon: <Shield className="w-5 h-5" />, label: 'Estado General', key: 'preventive_state' },
            { icon: <Users className="w-5 h-5" />, label: 'Antecedentes Fam.', key: 'family' },
            { icon: <User className="w-5 h-5" />, label: 'Hábitos', key: 'habits' },
        ],
    },
    procedure: {
        title: 'Asistente: Procedimiento / Terapia',
        description: 'Documente el procedimiento realizado y cualquier incidencia.',
        steps: [
            { icon: <Settings2 className="w-5 h-5" />, label: 'Procedimiento', key: 'proc_description' },
            { icon: <AlertTriangle className="w-5 h-5" />, label: 'Incidencias', key: 'proc_incidents' },
        ],
    },
    nutrition: {
        title: 'Asistente: Asesoría Nutricional General',
        description: 'Evalúe hábitos alimenticios, antropometría y estilo de vida.',
        steps: [
            { icon: <User className="w-5 h-5" />, label: 'A. Antropometría', key: 'nutrition_anthropometry' },
            { icon: <Search className="w-5 h-5" />, label: 'D. Hábitos/Dieta', key: 'habits' },
        ],
    },
    nutrition_weight: {
        title: 'Nutrición: Control de Peso',
        description: 'Enfoque en composición corporal, impedancia y R24H.',
        steps: [
            { icon: <User className="w-5 h-5" />, label: 'A. Antropometría', key: 'nutrition_anthropometry' },
            { icon: <Activity className="w-5 h-5" />, label: 'D. Dieta y R24H', key: 'nutrition_diet' },
            { icon: <RefreshCw className="w-5 h-5" />, label: 'C. Clínico / Sueño', key: 'nutrition_clinical_signs' },
        ],
    },
    nutrition_clinical: {
        title: 'Nutrición: Plan Clínico',
        description: 'Enfoque en laboratorios, signos clínicos y patologías.',
        steps: [
            { icon: <Microscope className="w-5 h-5" />, label: 'B. Bioquímicos', key: 'nutrition_biochemical' },
            { icon: <Stethoscope className="w-5 h-5" />, label: 'C. Signos Clínicos', key: 'nutrition_clinical_signs' },
            { icon: <User className="w-5 h-5" />, label: 'A. Antropometría', key: 'nutrition_anthropometry' },
            { icon: <Utensils className="w-5 h-5" />, label: 'D. Hábitos/Dieta', key: 'habits' },
        ],
    },
    nutrition_sports: {
        title: 'Nutrición: Deportiva',
        description: 'Enfoque en gasto calórico, hidratación y suplementación.',
        steps: [
            { icon: <Dumbbell className="w-5 h-5" />, label: 'A. Antropo / Gasto', key: 'nutrition_anthropometry' },
            { icon: <Activity className="w-5 h-5" />, label: 'C. Rendimiento', key: 'nutrition_sports_clinical' },
            { icon: <Utensils className="w-5 h-5" />, label: 'D. Dieta/Suple', key: 'nutrition_diet' },
        ],
    },
    nutrition_pediatric_maternal: {
        title: 'Nutrición: Materno-Infantil',
        description: 'Enfoque en requerimientos, alergias y curvas de crecimiento.',
        steps: [
            { icon: <User className="w-5 h-5" />, label: 'A. Crecimiento', key: 'nutrition_anthropometry' },
            { icon: <Stethoscope className="w-5 h-5" />, label: 'C. Clínico / Alergias', key: 'nutrition_clinical_signs' },
            { icon: <Utensils className="w-5 h-5" />, label: 'D. Ingesta / R24H', key: 'nutrition_diet' },
        ],
    },
    nutrition_behavioral: {
        title: 'Nutrición: Comportamiento',
        description: 'Enfoque en educación, barreras y aversiones.',
        steps: [
            { icon: <MessageCircle className="w-5 h-5" />, label: 'C. Psicológico/Barreras', key: 'nutrition_behavioral_clinical' },
            { icon: <Utensils className="w-5 h-5" />, label: 'D. Hábitos/Aversiones', key: 'habits' },
        ],
    },
    psychotherapy: {
        title: 'Psicoterapia: General',
        description: 'Evaluación general psicológica.',
        steps: [
            { icon: <Clock className="w-5 h-5" />, label: 'Motivo / Emoción', key: 'psycho_reason' },
            { icon: <Search className="w-5 h-5" />, label: 'Eventos / Sueño', key: 'psycho_events' },
        ],
    },
    psych_mood_anxiety: {
        title: 'Psicoterapia: Ánimo y Ansiedad',
        description: 'Enfoque en detonantes, severidad, sueño y apetito.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Síntomas / Detonantes', key: 'psych_symptoms' },
            { icon: <User className="w-5 h-5" />, label: 'Biológico (Sueño/Dieta)', key: 'psych_biological' },
        ],
    },
    psych_relationships: {
        title: 'Psicoterapia: Relacional',
        description: 'Enfoque en dinámica familiar, pareja y estrés.',
        steps: [
            { icon: <Users className="w-5 h-5" />, label: 'Dinámica Interpersonal', key: 'psych_interpersonal' },
            { icon: <MessageCircle className="w-5 h-5" />, label: 'Estrés / Comunicación', key: 'psych_stress' },
        ],
    },
    pediatric: {
        title: 'Pediatría: Control Genérico',
        description: 'Evaluación asincrónica básica del paciente pediátrico.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Desarrollo / Hitos', key: 'peds_development' },
            { icon: <Shield className="w-5 h-5" />, label: 'Inmunización / Dieta', key: 'peds_diet_vaccines' },
        ],
    },
    pediatric_growth: {
        title: 'Pediatría: Crecimiento',
        description: 'Enfoque en percentiles y desarrollo físico.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Percentiles / Medidas', key: 'peds_growth' },
            { icon: <Utensils className="w-5 h-5" />, label: 'Alimentación', key: 'peds_diet' },
        ],
    },
    pediatric_infectious: {
        title: 'Pediatría: Infeccioso',
        description: 'Enfoque en síntomas agudos y sospecha infecciosa.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Fiebre / Hidratación', key: 'peds_infectious' },
            { icon: <Search className="w-5 h-5" />, label: 'Examen Físico Dir.', key: 'peds_exam_directed' },
        ],
    },
    pediatric_neurobehavioral: {
        title: 'Pediatría: Neuroconductual',
        description: 'Enfoque en desarrollo cognitivo, sueño y comportamiento.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Conducta / Entorno', key: 'peds_behavior' },
            { icon: <Clock className="w-5 h-5" />, label: 'Hábitos / Sueño', key: 'peds_sleep_habits' },
        ],
    },
    womens_health: {
        title: 'Salud Femenina: General',
        description: 'Asistencia para la consulta de salud femenina.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Ciclo / Prevención', key: 'wh_cycle' },
        ],
    },
    womens_routine: {
        title: 'Salud Femenina: Preventiva',
        description: 'Enfoque en PAP, Mamografía y anticoncepción.',
        steps: [
            { icon: <Shield className="w-5 h-5" />, label: 'Prevención (PAP/Mamo)', key: 'wh_preventive' },
            { icon: <Activity className="w-5 h-5" />, label: 'Anticoncepción', key: 'wh_contraception' },
        ],
    },
    womens_prenatal: {
        title: 'Salud Femenina: Prenatal',
        description: 'Enfoque en SDG, ecos, y suplementación.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Gestación / Obstétrico', key: 'wh_prenatal' },
            { icon: <Stethoscope className="w-5 h-5" />, label: 'Evaluación Materna', key: 'wh_maternal_eval' },
        ],
    },
    womens_pathology: {
        title: 'Salud Femenina: Patología',
        description: 'Enfoque en trastornos menstruales y endocrinos.',
        steps: [
            { icon: <AlertTriangle className="w-5 h-5" />, label: 'Patrón Sangrado / Dolor', key: 'wh_bleeding_pain' },
            { icon: <Microscope className="w-5 h-5" />, label: 'Endocrino / Exámenes', key: 'wh_endocrinology' },
        ],
    },
    sports: {
        title: 'Medicina Deportiva: General',
        description: 'Documente rendimiento y metas físicas.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Rendimiento / Metas', key: 'sports_performance' },
            { icon: <AlertTriangle className="w-5 h-5" />, label: 'Historial Lesiones', key: 'sports_injuries' },
        ],
    },
    sports_clearance: {
        title: 'Deportiva: Aptitud / Chequeo',
        description: 'Enfoque en riesgo cardiovascular y aptitud física.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Riesgo / Constantes', key: 'sports_cardio_risk' },
            { icon: <Stethoscope className="w-5 h-5" />, label: 'Aptitud Física', key: 'sports_aptitude' },
        ],
    },
    sports_injury: {
        title: 'Deportiva: Lesiones',
        description: 'Enfoque en mecanismo de lesión y limitación funcional.',
        steps: [
            { icon: <AlertTriangle className="w-5 h-5" />, label: 'Lesión / Mecanismo', key: 'sports_injury_mech' },
            { icon: <Activity className="w-5 h-5" />, label: 'Funcionalidad', key: 'sports_functional' },
        ],
    },
    acute_respiratory: {
        title: 'Atención Primaria: Respiratorio',
        description: 'Enfoque en síntomas respiratorios agudos y signos de alarma.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Vía Aérea / Respiración', key: 'acute_resp_symptoms' },
            { icon: <Search className="w-5 h-5" />, label: 'Examen Dirigido', key: 'acute_resp_exam' },
        ],
    },
    acute_gastrointestinal: {
        title: 'Atención Primaria: Gastrointestinal',
        description: 'Enfoque en hidratación y síntomas digestivos agudos.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Digestivo / Hidratación', key: 'acute_gi_symptoms' },
            { icon: <Search className="w-5 h-5" />, label: 'Examen Abdominal', key: 'acute_gi_exam' },
        ],
    },
    acute_osteomuscular: {
        title: 'Atención Primaria: Osteomuscular',
        description: 'Enfoque en dolor, limitación y semiología musculoesquelética.',
        steps: [
            { icon: <AlertTriangle className="w-5 h-5" />, label: 'Semiología del Dolor', key: 'acute_osteo_symptoms' },
            { icon: <Search className="w-5 h-5" />, label: 'Examen Funcional', key: 'acute_osteo_exam' },
        ],
    },
    acute_neuro: {
        title: 'Atención Primaria: Neurológico',
        description: 'Enfoque en cefalea, mareos y banderas rojas neurológicas.',
        steps: [
            { icon: <Zap className="w-5 h-5" />, label: 'Síntoma Neurológico', key: 'acute_neuro_symptoms' },
            { icon: <Search className="w-5 h-5" />, label: 'Examen Neurológico', key: 'acute_neuro_exam' },
        ],
    },
    chronic_cardiometabolic: {
        title: 'Crónico: Cardiometabólico',
        description: 'Control de niveles, adherencia y prevención secundaria.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Control / Adherencia', key: 'chronic_cardio_control' },
            { icon: <Microscope className="w-5 h-5" />, label: 'Metas / Laboratorios', key: 'chronic_cardio_labs' },
        ],
    },
    chronic_respiratory: {
        title: 'Crónico: Respiratorio',
        description: 'Control de síntomas, uso de inhaladores y exacerbaciones.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Síntomas / Exacerbaciones', key: 'chronic_resp_control' },
            { icon: <Stethoscope className="w-5 h-5" />, label: 'Examen / Espirometría', key: 'chronic_resp_exam' },
        ],
    },
    chronic_rheumatological: {
        title: 'Crónico: Reumatológico',
        description: 'Control de dolor crónico, rigidez y funcionalidad articular.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Actividad / Dolor', key: 'chronic_rheuma_control' },
            { icon: <Search className="w-5 h-5" />, label: 'Examen Articular', key: 'chronic_rheuma_exam' },
        ],
    },
    chronic_neuro: {
        title: 'Crónico: Neurológico',
        description: 'Seguimiento de crisis, adherencia y tolerancia a fármacos.',
        steps: [
            { icon: <Zap className="w-5 h-5" />, label: 'Control de Crisis', key: 'chronic_neuro_control' },
            { icon: <Search className="w-5 h-5" />, label: 'Examen Neurológico', key: 'chronic_neuro_exam' },
        ],
    },
    preventive_specialized: {
        title: 'Preventivo: Especializado',
        description: 'Exámenes de tamizaje, evaluación de riesgo cardiovascular y vacunas.',
        steps: [
            { icon: <Shield className="w-5 h-5" />, label: 'Riesgo / Tamizaje', key: 'prev_screening' },
            { icon: <Activity className="w-5 h-5" />, label: 'Vacunas / Plan', key: 'prev_vaccines' },
        ],
    },
    occupational_health: {
        title: 'Preventivo: Salud Ocupacional',
        description: 'Aptitud laboral, riesgos biomecánicos y exposición ocupacional.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Aptitud Laboral', key: 'occ_aptitude' },
            { icon: <AlertTriangle className="w-5 h-5" />, label: 'Riesgos / Exposición', key: 'occ_risks' },
        ],
    },
    procedure_nursing: {
        title: 'Asistente: Enfermería',
        description: 'Constantes vitales, curaciones y administración de medicación.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Constantes / Signos', key: 'nursing_vitals' },
            { icon: <Settings2 className="w-5 h-5" />, label: 'Curación / Adm.', key: 'nursing_procedure' },
        ],
    },
    therapy_infusional: {
        title: 'Terapia: Infusional',
        description: 'Vía de acceso, infusiones y monitorización de reacciones.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Monitorización', key: 'infusion_monitoring' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Detalles Infusión', key: 'infusion_details' },
        ],
    },
    therapy_rehab: {
        title: 'Terapia: Rehabilitación',
        description: 'Evaluación funcional, dolor y ejercicios realizados.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Evolución Funcional', key: 'rehab_evolution' },
            { icon: <Settings2 className="w-5 h-5" />, label: 'Terapia Aplicada', key: 'rehab_therapy' },
        ],
    },
    emergency_minor: {
        title: 'Urgencia: Menor',
        description: 'Manejo rápido de heridas, suturas o dolor agudo no vital.',
        steps: [
            { icon: <Zap className="w-5 h-5" />, label: 'Motivo Urgente', key: 'emergency_reason' },
            { icon: <Settings2 className="w-5 h-5" />, label: 'Manejo Inicial', key: 'emergency_minor_management' },
        ],
    },
    emergency_trauma: {
        title: 'Urgencia: Trauma',
        description: 'Manejo de traumatismos, fracturas y lesiones agudas.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Mecanismo Trauma', key: 'trauma_mechanism' },
            { icon: <Settings2 className="w-5 h-5" />, label: 'Lesiones / Examen', key: 'trauma_exam' },
        ],
    },
    emergency_cardio_resp: {
        title: 'Emergencia: Cardio-Respiratoria',
        description: 'Reanimación, ABCD y monitorización continua.',
        steps: [
            { icon: <AlertTriangle className="w-5 h-5" />, label: 'ABCD Inicial', key: 'cardio_abcd' },
            { icon: <Activity className="w-5 h-5" />, label: 'Intervención Vital', key: 'cardio_intervention' },
        ],
    },
    interconsultation_general: {
        title: 'Asistente: Interconsulta',
        description: 'Respuesta formal a interconsulta y recomendaciones al servicio tratante.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Motivo de IC', key: 'ic_reason' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Opinión y Sugerencias', key: 'ic_opinion' },
        ],
    },
    interconsultation_cardiology: {
        title: 'Cardiología: Interconsulta',
        description: 'Evaluación de riesgo cardiovascular, revisión de EKG y conducta hemodinámica.',
        steps: [
            { icon: <HeartPulse className="w-5 h-5" />, label: 'Evaluación Cardio', key: 'cardio_assessment' },
            { icon: <Activity className="w-5 h-5" />, label: 'EKG / Pruebas', key: 'cardio_tests' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Concepto IC', key: 'cardio_opinion' },
        ],
    },
    interconsultation_neurology: {
        title: 'Neurología: Interconsulta',
        description: 'Evaluación del estado neurológico, pares craneales, reflejos y escala de Glasgow.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Examen Neurológico', key: 'neuro_exam' },
            { icon: <Search className="w-5 h-5" />, label: 'Evaluación Específica', key: 'neuro_specific' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Concepto IC', key: 'neuro_opinion' },
        ],
    },
    interconsultation_pulmonology: {
        title: 'Neumología: Interconsulta',
        description: 'Revisión de imágenes pulmonares, mecánica ventilatoria y oxigenación.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Estado Respiratorio', key: 'pulm_status' },
            { icon: <Microscope className="w-5 h-5" />, label: 'Imágenes e Interpretación', key: 'pulm_images' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Concepto IC', key: 'pulm_opinion' },
        ],
    },
    interconsultation_gastroenterology: {
        title: 'Gastroenterología: Interconsulta',
        description: 'Evaluación hepato-biliar y estado del tracto digestivo.',
        steps: [
            { icon: <Utensils className="w-5 h-5" />, label: 'Evaluación Digestiva', key: 'gastro_exam' },
            { icon: <Search className="w-5 h-5" />, label: 'Hallazgos Específicos', key: 'gastro_specific' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Concepto IC', key: 'gastro_opinion' },
        ],
    },
    interconsultation_nephrology: {
        title: 'Nefrología: Interconsulta',
        description: 'Tasa de filtrado glomerular, control de electrolitos y volumen.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Estado Renal y Electrolítico', key: 'nephro_status' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Ajustes y Concepto IC', key: 'nephro_opinion' },
        ],
    },
    interconsultation_endocrinology: {
        title: 'Endocrinología: Interconsulta',
        description: 'Alteraciones metabólicas, tiroides, y control glicémico.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Evaluación Metabólica', key: 'endo_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Ajuste Endocrinológico', key: 'endo_opinion' },
        ],
    },
    interconsultation_hematology: {
        title: 'Hematología: Interconsulta',
        description: 'Anemias, coagulopatías, leucopenias y estado hematológico y transfusional.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Evaluación Hematológica', key: 'hemato_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Sugerencia Hematológica', key: 'hemato_opinion' },
        ],
    },
    interconsultation_infectious_diseases: {
        title: 'Infectología: Interconsulta',
        description: 'Fiebre de origen desconocido, sepsis, y antibioticoterapia dirigida.',
        steps: [
            { icon: <AlertTriangle className="w-5 h-5" />, label: 'Foco Infeccioso', key: 'infecto_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Esquema Antimicrobiano', key: 'infecto_opinion' },
        ],
    },
    interconsultation_rheumatology: {
        title: 'Reumatología: Interconsulta',
        description: 'Enfermedades autoinmunes, vasculitis y dolor articular inflamatorio.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Evaluación Autoinmune', key: 'rheuma_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Plan Inmunosupresor', key: 'rheuma_opinion' },
        ],
    },
    interconsultation_oncology: {
        title: 'Oncología: Interconsulta',
        description: 'Sospecha de malignidad, estadificación y valoración de pronóstico.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Estadificación / Sospecha', key: 'onco_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Plan Oncológico', key: 'onco_opinion' },
        ],
    },
    interconsultation_dermatology: {
        title: 'Dermatología: Interconsulta',
        description: 'Lesiones cutáneas, valoración de nevus y dermatitis complejas.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Examen Dermatológico', key: 'derm_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Manejo Cutáneo', key: 'derm_opinion' },
        ],
    },
    interconsultation_ophthalmology: {
        title: 'Oftalmología: Interconsulta',
        description: 'Agudeza visual, fondo de ojo y presión intraocular.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Examen Oftalmológico', key: 'ophtha_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Manejo Visual', key: 'ophtha_opinion' },
        ],
    },
    interconsultation_otolaryngology: {
        title: 'Otorrinolaringología: Interconsulta',
        description: 'Otoscopia, rinoscopia, laringoscopia y patología cervicofacial.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Examen ORL', key: 'ent_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Conducta ORL', key: 'ent_opinion' },
        ],
    },
    interconsultation_urology: {
        title: 'Urología: Interconsulta',
        description: 'Tracto urinario, próstata, urolitiasis y disfunción sexual.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Examen Urológico', key: 'uro_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Plan Urológico', key: 'uro_opinion' },
        ],
    },
    interconsultation_orthopedics: {
        title: 'Traumatología: Interconsulta',
        description: 'Arcos de movilidad, fuerza, deformidades óseas y manejo articular.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Examen Físico Funcional', key: 'ortho_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Recomendaciones Ortopédicas', key: 'ortho_opinion' },
        ],
    },
    interconsultation_psychiatry: {
        title: 'Psiquiatría: Interconsulta',
        description: 'Examen mental, riesgo suicida y ajuste de psicofármacos.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Examen Mental', key: 'psych_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Conducta Psiquiátrica', key: 'psych_opinion' },
        ],
    },
    interconsultation_geriatrics: {
        title: 'Geriatría: Interconsulta',
        description: 'Valoración geriátrica integral y síndromes geriátricos.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Valoración Integral', key: 'geriatric_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Plan Geriátrico', key: 'geriatric_opinion' },
        ],
    },
    interconsultation_gynecology: {
        title: 'Ginecología: Interconsulta',
        description: 'Examen pélvico, ecografía, y patología ginecológica.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Examen Ginecológico', key: 'gyn_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Manejo Ginecológico', key: 'gyn_opinion' },
        ],
    },
    interconsultation_surgery: {
        title: 'Cirugía General: Interconsulta',
        description: 'Evaluación prequirúrgica, abdomen agudo y patología herniaria.',
        steps: [
            { icon: <Activity className="w-5 h-5" />, label: 'Evaluación Quirúrgica', key: 'surgery_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Conducta Quirúrgica', key: 'surgery_opinion' },
        ],
    },
    interconsultation_allergy: {
        title: 'Alergología: Interconsulta',
        description: 'Pruebas cutáneas, sospecha de anafilaxia e inmunoterapia.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Examen de Alergias', key: 'allergy_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Inmunoterapia / Manejo', key: 'allergy_opinion' },
        ],
    },
    telemedicine: {
        title: 'Asistente: Teleconsulta / Remoto',
        description: 'Triaje rápido de síntomas y gestión de recetas.',
        steps: [
            { icon: <Zap className="w-5 h-5" />, label: 'Triaje Remoto', key: 'telemed_triage' },
        ],
    },
    second_opinion_oncology: {
        title: 'Segunda Opinión: Oncología',
        description: 'Revisión externa de diagnósticos de cáncer y protocolos quimioterapéuticos.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Revisión Oncológica', key: 'sec_onco_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Opinión de Manejo', key: 'sec_onco_plan' },
        ],
    },
    second_opinion_neurology: {
        title: 'Segunda Opinión: Neurología',
        description: 'Evaluación de diagnósticos neurológicos complejos y epilepsia refractaria.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Revisión Neurológica', key: 'sec_neuro_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Alternativas Neurológicas', key: 'sec_neuro_plan' },
        ],
    },
    second_opinion_surgery: {
        title: 'Segunda Opinión: Cirugía',
        description: 'Análisis de alternativas quirúrgicas, necesidad de intervención y técnicas mínimamente invasivas.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Evaluación Quirúrgica', key: 'sec_surg_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Alternativas Quirúrgicas', key: 'sec_surg_plan' },
        ],
    },
    second_opinion_cardiology: {
        title: 'Segunda Opinión: Cardiología',
        description: 'Manejo alternativo de cardiopatías, arritmias complejas e indicación de dispositivos.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Revisión Cardiológica', key: 'sec_cardio_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Opinión Cardiovascular', key: 'sec_cardio_plan' },
        ],
    },
    second_opinion_rare_disease: {
        title: 'Segunda Opinión: Genética / Enf. Raras',
        description: 'Abordaje de diagnósticos genéticos, síndromes atípicos y enfermedades huérfanas.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Análisis de Caso', key: 'sec_rare_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Orientación Genética', key: 'sec_rare_plan' },
        ],
    },
    second_opinion_pain: {
        title: 'Segunda Opinión: Clínica del Dolor',
        description: 'Manejo de síndromes dolorosos refractarios, neuropatías crónicas y opciones intervencionistas.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Evaluación del Dolor', key: 'sec_pain_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Estrategia Analgésica', key: 'sec_pain_plan' },
        ],
    },
    second_opinion_fertility: {
        title: 'Segunda Opinión: Fertilidad',
        description: 'Revisión de opciones de reproducción asistida, fallo de implantación y pronóstico reproductivo.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Revisión Reproductiva', key: 'sec_fertility_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Opciones de Fertilidad', key: 'sec_fertility_plan' },
        ],
    },
    second_opinion_ortho: {
        title: 'Segunda Opinión: Ortopedia',
        description: 'Manejo alternativo de patología articular, decisiones sobre prótesis y lesiones complejas.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Revisión Ortopédica', key: 'sec_ortho_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Alternativas Ortopédicas', key: 'sec_ortho_plan' },
        ],
    },
    second_opinion_general: {
        title: 'Segunda Opinión Clínica',
        description: 'Revisión holística de diagnósticos dudosos, polifarmacia y casos médicos generales refractarios.',
        steps: [
            { icon: <Search className="w-5 h-5" />, label: 'Revisión Integral', key: 'sec_general_assessment' },
            { icon: <ClipboardList className="w-5 h-5" />, label: 'Sugerencias Médicas', key: 'sec_general_plan' },
        ],
    },
};

export function getWizardProfile(subcategory: string, chiefComplaint?: string): WizardProfileKey {
    if (chiefComplaint) {
        const subprofilePrefixes = ['nutrition_', 'pediatric_', 'womens_', 'sports_', 'psych_', 'acute_', 'chronic_', 'preventive_', 'occupational_', 'procedure_', 'therapy_', 'emergency_', 'interconsultation_', 'clinical_observation', 'followup_', 'second_opinion_'];

        for (const [key, profile] of Object.entries(WIZARD_PROFILE_MAP)) {
            const isSubprofile = subprofilePrefixes.some(prefix => profile.startsWith(prefix));
            if (isSubprofile && profile !== 'womens_health' && chiefComplaint.includes(key)) {
                return profile as WizardProfileKey;
            }
        }
    }
    return WIZARD_PROFILE_MAP[subcategory] || 'first_visit';
}