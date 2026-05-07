'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTabStore } from '@/store/useTabStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { getPatients, getPatientClinicalData, updatePatientAnamnesis } from '@/actions/patients';
import { saveEncounterDraft, finalizeEncounter, getEncounters } from '@/actions/encounters';
import type { Patient, Condition, AllergyIntolerance, EncounterWithClinicalNote } from '@/types/database.types';
import type { Json } from '@/types/database.types';
import type { Path, UseFormRegister } from 'react-hook-form';
import HistoryPatientPanel from './HistoryPatientPanel';
import DiagnosisSearch from '@/components/clinical/DiagnosisSearch';
import { FIELD_SUGGESTION_MAP } from '@/lib/constants/wizard-suggestions';
import { cn } from '@/lib/utils';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Stepper, StepperHeader, StepperIcon, StepperItem, StepperSeparator } from '@/components/ui/stepper';
import { toast } from 'sonner';
import { PageHeader, PageContainer } from '@/components/ui/PageLayout';
import { WizardProfileKey, WIZARD_PROFILES, WIZARD_PROFILE_MAP, getWizardProfile } from './wizard/wizard-data';

// Form & Validation
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';

// Icons
import {
    Save,
    MessageSquare,
    Plus,
    Stethoscope,
    Activity,
    User,
    RefreshCw,
    AlertTriangle,
    X,
    Info,
    CheckCircle2,
    Clock,
    CheckCircle,
    Zap,
    Shield,
    Settings2,
    Users,
    ClipboardList,
    Search,
    Microscope,
    Utensils,
    Dumbbell,
    MessageCircle,
    HeartPulse
} from 'lucide-react';

const encounterSchema = z.object({
    chiefComplaint: z.string().min(1, "El motivo de consulta es requerido"),
    currentIllness: z.object({
        suspectedDiagnosis: z.string().optional(),
        timeAmount: z.string().optional(),
        timeUnit: z.string().optional(),
        severity: z.string().optional(),
        course: z.string().optional(),
        status: z.string().optional(),
        adherence: z.string().optional(),
        tolerated: z.boolean().optional(),
        generalState: z.string().optional(),
        limitations: z.boolean().optional(),
        lifestyleCh: z.string().optional(),
        aggravatingFactors: z.string().optional(),
        alleviatingFactors: z.string().optional(),
        preventiveGoal: z.string().optional(),
        lastCheckupDate: z.string().optional(),
        mainConcerns: z.string().optional(),
        lifestyleGoals: z.string().optional(),
        onsetMode: z.string().optional(),
        pastTreatments: z.string().optional(),
        patientTheory: z.string().optional(),
        notes: z.string().optional()
    }),
    familyHistory: z.string().optional(),
    surgicalHistory: z.string().optional(),
    pastConditions: z.string().optional(),
    knownAllergies: z.string().optional(),
    currentMedications: z.string().optional(),
    hospitalizationHistory: z.string().optional(),
    reviewOfSystems: z.string().optional(),
    habitsHistory: z.string().optional(),
    laboratoryExams: z.string().optional(),
    imagingExams: z.string().optional(),
    physicalExam: z.object({
        headNeck: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        thorax: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        abdomen: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        pelvis: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        extremities: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        neurological: z.object({ normal: z.boolean(), notes: z.string().optional() }),
        skin: z.object({ normal: z.boolean(), notes: z.string().optional() }),
    }),
    evolutionNote: z.string(),
    treatmentPlan: z.string(),
    vitals: z.object({
        bpSystolic: z.number().min(60).max(250),
        bpDiastolic: z.number().min(40).max(160),
        heartRate: z.number().min(30).max(250),
        temperature: z.number().min(34).max(43),
        respRate: z.number().min(8).max(60),
        spo2: z.number().min(60).max(100),
        weight: z.number().min(1).max(400),
        height: z.number().min(30).max(250),
    }),
    diagnoses: z.array(z.object({
        code: z.string(),
        description: z.string(),
        type: z.enum(['primary', 'secondary', 'other'])
    })),
    symptoms: z.array(z.string()),
    encounterCategory: z.string().optional(),
    encounterSubcategory: z.string().optional(),
});

type EncounterFormValues = z.infer<typeof encounterSchema>;

interface AddendumRow {
    id: string;
    encounter_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author?: {
        name_family: string;
        name_given: string[];
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
const defaultVitals = {
    bpSystolic: 120, bpDiastolic: 80, heartRate: 72,
    temperature: 36.5, respRate: 18, spo2: 98, weight: 68, height: 165,
};

const defaultValues: EncounterFormValues = {
    chiefComplaint: '',
    currentIllness: {
        suspectedDiagnosis: '',
        timeAmount: '',
        timeUnit: 'días',
        severity: 'Leve (1-3)',
        course: 'Agudo',
        status: 'Estable',
        adherence: 'Completa',
        tolerated: true,
        generalState: 'Bueno',
        limitations: false,
        lifestyleCh: '',
        aggravatingFactors: '',
        alleviatingFactors: '',
        preventiveGoal: 'Rutina Anual',
        lastCheckupDate: '',
        mainConcerns: '',
        lifestyleGoals: '',
        onsetMode: 'Gradual',
        pastTreatments: '',
        patientTheory: '',
        notes: '',
    },
    familyHistory: '',
    surgicalHistory: '',
    pastConditions: '',
    knownAllergies: '',
    currentMedications: '',
    hospitalizationHistory: '',
    reviewOfSystems: '',
    habitsHistory: '',
    laboratoryExams: '',
    imagingExams: '',
    physicalExam: {
        headNeck: { normal: true, notes: '' },
        thorax: { normal: true, notes: '' },
        abdomen: { normal: true, notes: '' },
        pelvis: { normal: true, notes: '' },
        extremities: { normal: true, notes: '' },
        neurological: { normal: true, notes: '' },
        skin: { normal: true, notes: '' },
    },
    evolutionNote: '',
    treatmentPlan: '',
    vitals: defaultVitals,
    diagnoses: [],
    symptoms: [],
    encounterCategory: '',
    encounterSubcategory: '',
};

const PHYSICAL_SYSTEMS = [
    { id: 'headNeck', label: 'Cabeza y Cuello' },
    { id: 'thorax', label: 'Tórax (Cardiopulmonar)' },
    { id: 'abdomen', label: 'Abdomen' },
    { id: 'pelvis', label: 'Pelvis / Genitourinario' },
    { id: 'extremities', label: 'Extremidades' },
    { id: 'neurological', label: 'Neurológico' },
    { id: 'skin', label: 'Piel y Faneras' },
] as const;

const ENCOUNTER_CATEGORIES = [
    {
        label: "1. Emergencia / Urgencia",
        options: ["Urgencia Menor", "Urgencia Mayor", "Emergencia Vital", "Observación Clínica"]
    },
    {
        label: "2. Consulta Externa General / Especializada",
        options: ["Consulta de Primera Vez", "Consulta de Seguimiento / Control", "Revisión de Exámenes", "Interconsulta", "Segunda Opinión Médica"]
    },
    {
        label: "3. Atención Quirúrgica y Perioperatoria",
        options: ["Evaluación Preoperatoria", "Control Postoperatorio Temprano", "Control Postoperatorio Tardío"]
    },
    {
        label: "4. Medicina Preventiva y Salud Ocupacional",
        options: ["Chequeo Preventivo Integral", "Evaluación Laboral / Pre-empleo", "Control de Niño Sano / Inmunización", "Planificación Familiar y Salud Femenina", "Aptitud Deportiva"]
    },
    {
        label: "5. Procedimientos y Módulos de Terapia",
        options: ["Procedimiento Médico Mayor Ambulatorio", "Procedimiento de Enfermería", "Terapia Infusional", "Terapia de Rehabilitación"]
    },
    {
        label: "6. Especialidades Aliadas",
        options: ["Sesión de Psicoterapia", "Asesoría Nutricional"]
    },
    {
        label: "7. Telemedicina / Atención Remota",
        options: ["Teleconsulta", "Asesoramiento / Renovación de Receta"]
    }
];

const KITS_OF_ORDERS = [
    {
        id: "kit-respiratory-infection",
        label: "Infección Respiratoria Alta",
        content: "1. Amoxicilina/Ácido Clavulánico 875/125mg VO c/12h x 7 días\n2. Ibuprofeno 400mg VO c/8h por dolor/fiebre\n3. Abundante hidratación oral\n4. Reposo médico por 3 días"
    },
    {
        id: "kit-gastroenteritis",
        label: "Gastroenteritis Aguda",
        content: "1. Suero de Rehidratación Oral a tolerancia\n2. Loperamida 2mg VO después de cada deposición líquida\n3. Dieta blanda astringente\n4. Consultar por urgencias si signos de deshidratación"
    },
    {
        id: "kit-hypertension",
        label: "Control de Hipertensión",
        content: "1. Mantener Losartán 50mg VO c/12h\n2. Dieta hiposódica estricta\n3. Control de PA en casa (Bitácora de 1 semana)\n4. Solicitar: Perfil lipídico, Creatinina, EKG de control"
    },
    {
        id: "kit-routine-labs",
        label: "Exámenes de Rutina Anuales",
        content: "Se solicitan laboratorios:\n- Biometría Hemática Completa\n- Química Sanguínea (Glucosa, Urea, Creatinina, Ácido Úrico)\n- Perfil Lipídico (Colesterol total, HDL, LDL, Triglicéridos)\n- Examen General de Orina"
    }
];

function getCategoryForSubcategory(sub: string) {
    const cat = ENCOUNTER_CATEGORIES.find(c => c.options.includes(sub));
    return cat ? cat.label : '';
}



const SUGGESTION_MAP: Record<string, string[]> = {
    // 1. Emergencia / Urgencia
    "Urgencia Menor": [
        "Herida cortante leve", "Traumatismo leve / Contusión", "Esguince pélvico/extremidad", "Quemadura de primer grado",
        "Cólico nefrítico leve", "Reacción alérgica cutánea", "Picadura de insecto", "Cuerpo extraño en ojo o piel",
        "Otitis aguda", "Crisis asmática leve", "Gastroenteritis aguda sin deshidratación", "Cistitis",
        "Fiebre de origen a determinar", "Cefalea tensional intensa", "Dolor lumbar agudo", "Absceso cutáneo",
        "Retención aguda de orina leve", "Epistaxis leve", "Vómitos", "Sangrado leve no activo"
    ],
    "Urgencia Mayor": [
        "Fractura expuesta o cerrada", "Luxación articular", "Dolor abdominal agudo", "Crisis hipertensiva grave",
        "Dificultad respiratoria moderada-severa", "Traumatismo craneoencefálico leve-moderado", "Hemorragia digestiva", "Quemadura de segundo/tercer grado",
        "Intoxicación aguda", "Reacción alérgica severa", "Cólico biliar severo", "Isquemia aguda en extremidad",
        "Convulsión (primera vez o prolongada)", "Alteración del estado de conciencia", "Síncope o pérdida de conocimiento", "Herida profunda con sangrado activo",
        "Sospecha de ACV temprano", "Dolor torácico (Típico o atípico)", "Crisis psiquiátrica aguda", "Retención urinaria con globo vesical"
    ],
    "Emergencia Vital": [
        "Paro cardiorrespiratorio", "Shock anafiláctico", "Shock hipovolémico", "Shock séptico",
        "Infarto agudo de miocardio (IAM)", "Accidente cerebrovascular (ACV) en curso", "Trauma múltiple (Politraumatismo severo)", "Asfixia / Obstrucción de vía aérea",
        "Status epiléptico", "Insuficiencia respiratoria aguda", "Hemorragia masiva incontrolable", "Coma diabético / Cetoacidosis",
        "Arritmia ventricular inestable", "Taponamiento cardíaco", "Rotura aneurisma aórtico", "Intoxicación letal (Drogas/Gases)",
        "Herida por arma de fuego/blanca severa", "Quemadura extensa (>20% SCT)", "Eclampsia", "Falla multiorgánica rápida"
    ],
    "Observación Clínica": [
        "Monitorización post-síncope", "Control post-convulsión", "Observación por traumatismo craneal", "Vigilancia de dolor abdominal",
        "Hidratación endovenosa prolongada", "Control de crisis hipertensiva", "Monitorización cardíaca por arritmia", "Observación post-reacción alérgica",
        "Evolución de crisis asmática", "Monitoreo de intoxicación leve", "Control de glucosa repetido", "Descartar síndrome coronario agudo",
        "Manejo de dolor crónico agudizado", "Observación post-reducción de fractura/luxación", "Hemovigilancia inicial", "Evaluación de sangrado digestivo",
        "Equilibrio hidroelectrolítico", "Monitoreo de fiebre de origen desconocido", "Vigilancia por sospecha de apendicitis", "Observación post-procedimiento menor"
    ],

    // 2. Consulta Externa General / Especializada
    "Consulta de Primera Vez": [
        "Evaluación médica integral", "Dolor crónico en estudio", "Evaluación de síntomas digestivos", "Astenia / Fatiga crónica",
        "Pérdida de peso involuntaria", "Evaluación de lesiones cutáneas", "Dolor articular crónico", "Disfunción sexual",
        "Cefalea crónica de primera vez", "Trastorno del sueño crónico", "Alteración en ritmo intestinal", "Evaluación de masa palpable",
        "Problemas de memoria", "Debilidad muscular progresiva", "Visión borrosa / Problemas oculares leves", "Mareos y vértigo en estudio",
        "Evaluación por ronquidos / Apnea", "Dificultad respiratoria no aguda", "Edema localizado o generalizado", "Molestias genitourinarias"
    ],
    "Consulta de Seguimiento / Control": [
        "Control de Hipertensión Arterial", "Control de Diabetes Mellitus", "Control de Dislipidemia", "Seguimiento de Asma / EPOC",
        "Control de Hipotiroidismo", "Seguimiento de Osteoartritis", "Evolución de tratamiento antibiótico", "Control de peso y obesidad",
        "Seguimiento de trastorno de ansiedad", "Seguimiento de depresión", "Monitoreo de anticoagulación", "Control de insuficiencia cardíaca",
        "Evolución de herida crónica", "Seguimiento de úlcera péptica", "Chequeo de alergias estacionales", "Control dermatológico periódico",
        "Seguimiento de enfermedad renal crónica", "Control neurológico de migraña", "Evolución de lesión deportiva", "Verificación de cumplimiento terapéutico",
        "Seguimiento de medicación psiquiátrica", "Control de curación de heridas", "Seguimiento pediátrico/neonatal", "Seguimiento de terapia de rehabilitación", "Control prenatal de alto riesgo"
    ],
    "Revisión de Exámenes": [
        "Resultados de Laboratorio Clínico", "Lectura de Radiografía / Tomografía", "Revisión de Resonancia Magnética", "Resultados de Ecografía / Ultrasonido",
        "Lectura de Electrocardiograma (EKG)", "Resultados de Endoscopia / Colonoscopia", "Revisión de biopsia (Patología)", "Lectura de Holter de Presión/Arritmia",
        "Resultados de Espirometría", "Revisión de exámenes preoperatorios", "Resultados de Papanicolaou / Mamografía", "Análisis de marcadores tumorales",
        "Lectura de Densitometría Ósea", "Resultados de exámenes genéticos", "Interpretación de Antibiograma", "Revisión de Hormonas Tiroideas",
        "Valores de Hemoglobina Glicosilada (HbA1c)", "Prueba de esfuerzo / Ergonometría", "Revisión de Audiometría", "Examen General de Orina y Urocultivo"
    ],
    "Interconsulta": [
        "Valoración por Cardiología", "Valoración por Neurología", "Valoración por Neumología", "Valoración por Gastroenterología",
        "Valoración por Nefrología", "Valoración por Endocrinología", "Valoración por Reumatología", "Valoración por Hematología",
        "Valoración por Infectología", "Valoración por Oncología", "Valoración por Geriatría", "Valoración por Psiquiatría",
        "Valoración por Cirugía General", "Valoración por Dermatología", "Valoración por Urología", "Valoración por Otorrinolaringología (ORL)",
        "Valoración por Oftalmología", "Valoración por Traumatología y Ortopedia", "Valoración por Ginecología", "Valoración por Pediatría especializada"
    ],
    "Segunda Opinión Médica": [
        "Confirmación de diagnóstico oncológico", "Alternativas de tratamiento quirúrgico", "Re-evaluación de enfermedad autoinmune", "Dudas sobre manejo crónico",
        "Opinión sobre enfermedad rara", "Evaluación de dolor refractario", "Segunda opinión en neurología / epilepsia", "Manejo alternativo de cardiopatía",
        "Revaloración de lesión deportiva", "Segunda opinión en cirugía de columna", "Opciones de fertilidad / reproducción", "Evaluación de intolerancias alimentarias",
        "Dudas sobre necesidad de prótesis", "Opinión sobre terapias biológicas", "Manejo de nódulo tiroideo", "Revisión de polifarmacia",
        "Perspectiva sobre patología psiquiátrica", "Alternativas en cirugía estética", "Opinión pediátrica compleja", "Consejería por mal pronóstico"
    ],

    // 3. Atención Quirúrgica y Perioperatoria
    "Evaluación Preoperatoria": [
        "Valoración cardiovascular preoperatoria", "Evaluación pulmonar prequirúrgica", "Revisión de exámenes de coagulación", "Confirmación de ayuno y preparación",
        "Firma de consentimiento informado", "Marcaje de sitio quirúrgico", "Valoración de riesgo anestésico (ASA)", "Profilaxis antibiótica preoperatoria",
        "Suspensión o ajuste de medicamentos", "Medición de constantes vitales basales", "Control de glicemia pre-quirúrgica", "Evaluación de alergias anestésicas",
        "Revisión de prótesis o implantes metálicos", "Preparación intestinal o de piel", "Valoración psiquiátrica pre-bariátrica", "Chequeo de compatibilidad sanguínea",
        "Toma de electrocardiograma pre-operatorio", "Manejo de ansiedad ante la cirugía", "Aclaración de dudas quirúrgicas", "Autorizaciones administrativas pre-qx"
    ],
    "Control Postoperatorio Temprano": [
        "Revisión de herida dentro de 48h", "Manejo de dolor postoperatorio agudo", "Detección de sangrado o hematoma", "Evaluación de tolerancia a la dieta",
        "Control de signos de infección temprana", "Monitoreo de tránsito intestinal/miccional", "Revisión y manejo de drenajes", "Retiro de sondas (Vesical/Nasogástrica)",
        "Promoción de deambulación temprana", "Ajuste de analgesia / antibiótico post-alta", "Curación inicial de herida operatoria", "Vigilancia de signos vitales (Fiebre post-qx)",
        "Prevención de trombosis venosa profunda", "Evaluación de viabilidad de colgajo/injerto", "Revisión de función respiratoria post-anestesia", "Verificación de sangrado vaginal post-ginecológica",
        "Extracción de taponamiento nasal/ótico", "Revisión de permeabilidad de vía IV", "Información detallada al paciente/familia", "Detección de reacción a medicamentos"
    ],
    "Control Postoperatorio Tardío": [
        "Retiro de puntos o grapas quirúrgicas", "Evaluación de cicatrización a 1+ semana", "Revisión de resultados de biopsia post-qx", "Alta definitiva quirúrgica",
        "Evaluación de movilidad y funcionalidad", "Manejo de cicatriz hipertrófica/queloide", "Diagnóstico de dehiscencia tardía", "Tratamiento de colección o seroma",
        "Inicio de terapia de rehabilitación física", "Plan de retorno al trabajo / deportes", "Evaluación de dolor crónico post-quirúrgico", "Revisión de fístulas tardías",
        "Control de implantes/prótesis a largo plazo", "Seguimiento nutricional post-bariátrica", "Monitoreo post-apendicectomía/colecistectomía", "Revisión post-cesárea tardía",
        "Seguimiento de ostomías (Colostomía/Ileostomía)", "Verificación de funcionalidad post-ocular", "Seguimiento de recurrencia oncológica", "Certificado de recuperación total"
    ],

    // 4. Medicina Preventiva y Salud Ocupacional
    "Chequeo Preventivo Integral": [
        "Chequeo médico anual (Head to Toe)", "Perfil ejecutivo avanzado", "Chequeo cardiovascular completo", "Panel de despistaje oncológico",
        "Chequeo urológico integral", "Evaluación de riesgo geriátrico", "Chequeo para viajero frecuente", "Screening de enfermedades de transmisión sexual (ETS)",
        "Perfíl metabólico y nutricional", "Prevención de riesgo cardiovascular", "Detección temprana de osteoporosis", "Evaluación de salud pulmonar y tabaquismo",
        "Despistaje de deterioro cognitivo", "Evaluación inmunológica (estado de vacunas)", "Chequeo general preventivo básico", "Valoración de salud mental y estrés",
        "Test de agudeza visual preventiva", "Test de agudeza auditiva preventiva", "Chequeo tiroideo de rutina", "Asesoría antienvejecimiento y longevidad"
    ],
    "Evaluación Laboral / Pre-empleo": [
        "Certificado médico preocupacional", "Examen anual ocupacional", "Evaluación post-incapacidad", "Certificado de aptitud para trabajo en alturas",
        "Evaluación para manipulación de alimentos", "Chequeo toxicológico laboral", "Espirometría para exposición a polvo/químicos", "Audiometría por exposición al ruido",
        "Examen musculoesquelético y ergonómico", "Examen visual para choferes/operadores", "Valoración psicológica laboral", "Evaluación de riesgo biológico",
        "Chequeo de egreso o retiro laboral", "Inmunizaciones laborales (Hepatitis, Tétanos)", "Tratamiento de accidente de trabajo inicial", "Manejo de enfermedad profesional detectada",
        "Análisis de estrés y 'burnout'", "Autorización para trabajo nocturno", "Certificado para espacios confinados", "Examen de retorno post-maternidad/licencia"
    ],
    "Control de Niño Sano / Inmunización": [
        "Control de crecimiento y desarrollo", "Evaluación de hitos del desarrollo", "Esquema de vacunación regular", "Vacunación complementaria",
        "Asesoría en lactancia materna", "Inicio de alimentación complementaria", "Control nutricional pediátrico", "Detección temprana de anemia",
        "Problemas de dentición", "Control de esfínteres", "Dermatitis del pañal / Cuidados de la piel", "Trastornos del sueño infantil",
        "Prevención de accidentes en el hogar", "Detección de problemas visuales/auditivos", "Asesoría en estimulación temprana", "Comportamiento infantil (Rabietas)",
        "Certificado médico escolar", "Sospecha de TEA o TDAH", "Cólico del lactante", "Control de infecciones a repetición"
    ],
    "Planificación Familiar y Salud Femenina": [
        "Control ginecológico anual", "Papanicolaou (PAP) / Citología", "Detección de VPH", "Screening de cáncer de mama (Mamografía)",
        "Inicio de método anticonceptivo", "Control de método anticonceptivo", "Retiro o cambio de DIU / Implante", "Consejería preconcepcional",
        "Control prenatal de rutina", "Sangrado uterino anormal", "Amenorrea / Alteraciones menstruales", "Síndrome de ovario poliquístico (SOP)",
        "Dolor pélvico (Dismenorrea)", "Infección vaginal / Flujo anormal", "Menopausia y Climaterio", "Terapia de reemplazo hormonal",
        "Masas o nódulos mamarios", "Evaluación inicial de infertilidad", "Control de puerperio (Postparto)", "Endometriosis"
    ],
    "Aptitud Deportiva": [
        "Certificado médico inicio de gimnasio", "Evaluación para alto rendimiento", "Prueba de esfuerzo (Ergometría)", "Asesoría de suplementación deportiva",
        "Evaluación antropométrica", "Despistaje de riesgo de muerte súbita", "Revisión de lesiones musculares previas", "Examen biomecánico y postural",
        "Ecocardiograma deportivo", "Evaluación de función pulmonar para atletas", "Prescripción de ejercicio asistido", "Recomendaciones de hidratación atlética",
        "Chequeo pre-maratón/triatlón", "Despistaje de sobreentrenamiento", "Apto médico para ligas y clubes infantiles", "Valoración de flexibilidad y fuerza basal",
        "Prevención de lesiones osteoarticulares", "Evaluación fisiológica de resistencia", "Retorno al juego (Return to play)", "Control antidopaje y salud"
    ],

    // 5. Procedimientos y Módulos de Terapia
    "Procedimiento Médico Mayor Ambulatorio": [
        "Biopsia de piel / Lesión cutánea", "Endoscopia superior digestiva", "Colonoscopia preventiva / diagnóstica", "Colposcopia y toma de biopsia cervical",
        "Cistoscopia ambulatoria", "Infiltración articular guiada", "Exéresis de lipoma o quiste sebáceo", "Cirugía menor dermatológica (Lunares, verrugas)",
        "Vasectomía sin bisturí", "Extracción de uña encarnada (Onicocriptosis)", "Drenaje de absceso profundo", "Bloqueo epidural o facetario (Manejo de dolor)",
        "Revisión y curetaje uterino (AMEU)", "Punción aspiración con aguja fina (PAAF)", "Litotricia extracorpórea ambulatoria", "Fototerapia o terapia láser ambulatoria",
        "Extracción de cuerpo extraño", "Colocación de catéter venoso central", "Reparación de desgarro perineal", "Crioterapia de cuello uterino"
    ],
    "Procedimiento de Enfermería": [
        "Aplicación de inyección (IM / SC / IV)", "Curación de herida simple", "Retiro de puntos de sutura", "Toma de signos vitales seriados",
        "Colocación de sonda vesical", "Lavado ótico (Tapón de cerumen)", "Nebulización / Terapia respiratoria", "Aspiración de secreciones",
        "Curación avanzada de pie diabético", "Manejo de úlceras por presión", "Extracción de muestra de sangre", "Retiro de yeso o férula",
        "Realización de Electrocardiograma (EKG)", "Asistencia en higiene o confort", "Colocación de sonda nasogástrica", "Educación en uso de dispositivos (Insulina, Inhalador)",
        "Manejo de estomas (Limpieza/Cambio)", "Administración de enema evacuante", "Monitoreo fetal no estresante", "Control de líquidos (In/Out)"
    ],
    "Terapia Infusional": [
        "Hidratación endovenosa de rescate", "Administración de antibióticos IV", "Quimioterapia ambulatoria", "Terapia biológica (Anticuerpos monoclonales)",
        "Transfusión de hemoderivados ambulatoria", "Manejo de crisis de migraña (Cóctel IV)", "Administración de hierro endovenoso", "Terapia de reemplazo enzimático",
        "Inmunoglobulina intravenosa", "Nutrición parenteral periférica", "Terapia analgésica continua (Bomba IV)", "Manejo de hiperemesis gravídica IV",
        "Suplementos vitamínicos IV (Ej. Complejo B, Vit C)", "Administración de corticosteroides a altas dosis", "Mantenimiento y lavado de PORT-A-CATH", "Flebotomía terapéutica",
        "Terapias biológicas reumatológicas", "Bisosfonatos IV para osteoporosis", "Terapia de rescate en asma severo IV", "Hidratación post-intoxicación etílica"
    ],
    "Terapia de Rehabilitación": [
        "Terapia física ortopédica y traumatológica", "Rehabilitación neurológica (post-ACV/LME)", "Terapia ocupacional motricidad fina", "Rehabilitación pulmonar / respiratoria",
        "Estimulación temprana pediátrica", "Rehabilitación del suelo pélvico", "Manejo del dolor crónico no farmacológico", "Terapia miofascial y de puntos gatillo",
        "Electroterapia (TENS) y ultrasonido", "Terapia de lenguaje verbal y deglución", "Drenaje linfático manual", "Rehabilitación cardiaca post-infarto",
        "Ejercicios de propiocepción y equilibrio", "Laserterapia y Magnetoterapia", "Tracción cervical o lumbar asistida", "Reeducación postural global (RPG)",
        "Crioterapia y termoterapia de contraste", "Kinesiotaping (Vendaje neuromuscular)", "Rehabilitación deportiva de readaptación", "Terapia vestibular (Manejo de vértigo)"
    ],

    // 6. Especialidades Aliadas
    "Sesión de Psicoterapia": [
        "Crisis de ansiedad / Pánico", "Episodio depresivo mayor", "Terapia de pareja / Conflictos", "Manejo del duelo y pérdida",
        "Terapia cognitivo-conductual", "Trastorno de estrés post-traumático", "Baja autoestima y autoconfianza", "Conflictos familiares / Sistémicos",
        "Trastorno obsesivo-compulsivo (TOC)", "Fobia social / Ansiedad social", "Manejo de la ira y control de impulsos", "Trastorno por déficit de atención (TDAH)",
        "Trastornos del sueño / Insomnio", "Estrés laboral / Burnout", "Orientación vocacional y de vida", "Trastornos de conducta alimentaria (Psicoterapia)",
        "Regulación emocional profunda", "Mindfulness y reducción de estrés", "Crecimiento personal", "Prevención de recaídas en adicciones"
    ],
    "Asesoría Nutricional": [
        "Control de peso (Pérdida/Aumento)", "Plan alimentario para Diabetes Mellitus", "Nutrición en Hipertensión Arterial", "Manejo de Dislipidemia",
        "Asesoría nutricional deportiva", "Nutrición durante el embarazo y lactancia", "Dietoterapia para Intestino Irritable / SIBO", "Soporte nutricional oncológico",
        "Asesoría para transición vegetariana/vegana", "Alergias o intolerancias alimentarias (Ej. Celíacos)", "Nutrición pediátrica / ablactación", "Evaluación de composición corporal por impedancia",
        "Manejo del paciente renal crónico", "Soporte nutricional post-quirúrgico", "Nutrición preventiva para osteoporosis", "Asesoramiento para cirugía bariátrica",
        "Reeducación de hábitos familiares", "Plan de recarga pre-competencia deportiva", "Abordaje nutricional de TCA", "Asesoría en lectura de etiquetas e ingredientes"
    ],

    // 7. Telemedicina / Atención Remota
    "Teleconsulta": [
        "Orientación médica general online", "Triaje inicial por síntomas", "Dudas sobre evolución de enfermedad", "Interpretación de síntomas leves",
        "Asesoramiento sobre nueva medicación", "Orientación pediátrica urgente para padres", "Seguimiento nutricional a distancia", "Sesión de psicoterapia online",
        "Dudas sobre cuidados durante el embarazo", "Asesoría en lactancia materna remota", "Consulta dermatológica por imágenes", "Control de enfermedad crónica estabilizada",
        "Asistencia de aislamiento (Enf. Infecciosas)", "Consulta de salud sexual y reproductiva", "Asesoría geriátrica para cuidadores primarios", "Soporte para deshabituación de tabaco/alcohol",
        "Reporte de valores de presión domiciliaria", "Vigilancia de bitácora de glucosa capilar", "Manejo de dolor leve-moderado postquirúrgico", "Asesoría médica pre-viaje internacional"
    ],
    "Asesoramiento / Renovación de Receta": [
        "Renovación de medicación antihipertensiva", "Resurtido de receta para diabetes", "Prescripción continuada de anticonceptivos", "Renovación de tratamiento psiquiátrico",
        "Solicitud de laboratorios de control periódico", "Ajuste de dosis según síntomas recientes", "Renovación de inhaladores para Asma/EPOC", "Extensión de receta para hipotiroidismo",
        "Autorizaciones médicas rutinarias", "Emisión de receta para terapia física", "Renovación de analgésicos de uso crónico", "Receta para antialérgicos de estación",
        "Resurtido de vitaminas o suplementos", "Aprobación de colirios oftalmológicos uso crónico", "Prescripción de insulina o GLP-1", "Constancia de tratamiento actual",
        "Extensión de incapacidad laboral inicial", "Gestión de efectos adversos leves", "Solicitud formal de interconsulta clínica", "Renovación de pomadas dermatológicas terapéuticas"
    ],

    // Fallback global por defecto
    "default": [
        "Fiebre de presentación reciente", "Dolor de cabeza (Cefalea)", "Tos seca o productiva", "Dolor abdominal inespecífico", "Diarrea o alteraciones del tránsito",
        "Vómitos o náuseas persistentes", "Dificultad sintomática para respirar (Disnea)", "Dolor de garganta / Odinofagia", "Fatiga exagerada / Astenia", "Dolor de espalda bajo (Lumbalgia)",
        "Mareos o episodios de Vértigo", "Dolor general articular / Mialgia", "Erupción cutánea pruriginosa / Rash", "Congestión nasal o coriza",
        "Pérdida de peso involuntaria", "Dolor de oídos intenso", "Dificultad aguda para dormir", "Crisis de ansiedad o nerviosismo repentino",
        "Palpitaciones anómalas", "Malestar generalizado sin foco claro"
    ]
};

const COMMON_FAMILY_HISTORIES = [
    "Diabetes Tipo 1", "Diabetes Tipo 2", "Hipertensión Arterial", "Cáncer de Mama",
    "Cáncer de Próstata", "Cáncer de Colon", "Cáncer de Pulmón", "Cáncer Gástrico",
    "Asma Bronquial", "EPOC", "Infarto de Miocardio", "ACV (Ictus)", "Insuficiencia Cardíaca",
    "Hipotiroidismo", "Hipertiroidismo", "Obesidad", "Depresión", "Ansiedad",
    "Esquizofrenia", "Trastorno Bipolar", "Alzheimer", "Parkinson", "Epilepsia",
    "Artritis Reumatoide", "Lupus", "Osteoporosis", "Glaucoma", "Cataratas",
    "Enfermedad Celíaca", "Enfermedad de Crohn", "Colitis Ulcerosa", "Insuficiencia Renal",
    "Cálculos Renales", "Anemia Falciforme", "Hemofilia", "Trombosis Venosa Profunda",
    "Migraña", "Psoriasis", "Vitíligo", "Endometriosis", "SOP (Ovarios Poliquísticos)",
    "Fibromialgia", "Gota", "Tuberculosis", "VIH/SIDA", "Hepatitis B", "Hepatitis C",
    "Síndrome de Down", "Autismo", "Dislipidemia/Colesterol"
].sort();

// ─── Subcomponents ────────────────────────────────────────────────────────────

function VitalInput({ name, label, min, max, step = 1, register, disabled }: {
    name: Path<EncounterFormValues>; label: string; min: number; max: number;
    step?: number; register: UseFormRegister<EncounterFormValues>; disabled?: boolean;
}) {
    return (
        <Field>
            <FieldLabel className="text-xs font-medium text-muted-foreground mb-1.5 truncate" title={label}>
                {label}
            </FieldLabel>
            <Input
                type="number"
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                {...register(name, { valueAsNumber: true })}
            />
        </Field>
    );
}

function FieldSuggestions({
    fieldKey,
    profileKey,
    onSuggest
}: {
    fieldKey: string;
    profileKey: WizardProfileKey;
    onSuggest: (suggestion: string) => void;
}) {
    const suggestionsForField = FIELD_SUGGESTION_MAP[fieldKey];
    if (!suggestionsForField) return null;

    const suggestions = suggestionsForField[profileKey] || suggestionsForField.default || [];

    if (suggestions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {suggestions.map((suggestion) => (
                <button
                    key={suggestion}
                    type="button"
                    onClick={() => onSuggest(suggestion)}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border/50"
                >
                    <Activity className="w-2.5 h-2.5 mr-1 opacity-70" />
                    {suggestion}
                </button>
            ))}
        </div>
    );
}

// ─── Workspace Header ─────────────────────────────────────────────────────────
// ─── Main Component ─────────────────────────────────────────────────────────────
export default function HistoryPage() {
    const searchParams = useSearchParams();
    const { tabs, activeTabId, setTabData } = useTabStore();
    const { setSecondaryPanel, setRightPanelOpen } = useLayoutStore();

    const tabId = activeTabId || '/history';
    const currentTab = tabs.find(t => t.id === tabId);

    // Contextual State (External to the encounter form itself)
    // Type the tab data to properly access persisted state
    interface TabData { selectedPatient?: Patient; clinicalData?: { conditions: Condition[]; allergies: AllergyIntolerance[] }; formValues?: EncounterFormValues; }
    const tabData = currentTab?.data as TabData | undefined;

    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(tabData?.selectedPatient || null);
    const [clinicalData, setClinicalData] = useState<{ conditions: Condition[]; allergies: AllergyIntolerance[] }>(
        tabData?.clinicalData || { conditions: [], allergies: [] }
    );
    const [pastEncounters, setPastEncounters] = useState<EncounterWithClinicalNote[]>([]);
    const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isLoadingEncounters, setIsLoadingEncounters] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [chiefComplaintSelectKey, setChiefComplaintSelectKey] = useState(0);
    const [familyHistorySelectKey, setFamilyHistorySelectKey] = useState(0);
    const [addenda, setAddenda] = useState<AddendumRow[]>([]);
    const [isAddingAddendum, setIsAddingAddendum] = useState(false);
    const [newAddendumContent, setNewAddendumContent] = useState('');
    const [isSavingAddendum, setIsSavingAddendum] = useState(false);

    // Initialize Form
    const form = useForm<EncounterFormValues>({
        resolver: zodResolver(encounterSchema),
        defaultValues: tabData?.formValues || defaultValues,
    });

    const { fields: diagnosesFields, append: appendDiagnosis, remove: removeDiagnosis } = useFieldArray({
        control: form.control,
        name: "diagnoses",
    });

    // Sync to tab store
    useEffect(() => {
        setTabData(tabId, {
            formValues: form.getValues(),
            selectedPatient,
            clinicalData
        });
    }, [form, tabId, setTabData, selectedPatient, clinicalData]);

    const handleReset = useCallback(() => {
        if (confirm('¿Limpiar todos los datos del formulario actual?')) {
            form.reset(defaultValues);
        }
    }, [form]);

    const handleEncounterSelect = useCallback((id: string | null, enc: EncounterWithClinicalNote | null) => {
        setActiveEncounterId(id);
        const readOnly = enc?.status === 'finished';
        setIsReadOnly(readOnly);
        if (enc) {
            // Check if reason_code is an array of objects
            const rc = enc.clinical_note?.reason_code;
            const chiefComplaint = (Array.isArray(rc)
                ? (rc as Array<Record<string, string>>)[0]?.text
                : typeof rc === 'string' ? rc : '') || '';

            form.reset({
                ...defaultValues,
                evolutionNote: enc.clinical_note?.evolution_note || '',
                treatmentPlan: enc.clinical_note?.plan || '',
                chiefComplaint,
                vitals: (enc.vital_signs as Record<string, unknown>) || defaultVitals,
                physicalExam: (enc.clinical_note?.physical_exam as unknown as EncounterFormValues["physicalExam"]) || defaultValues.physicalExam,
                diagnoses: (enc.clinical_note?.diagnosis as unknown as EncounterFormValues["diagnoses"]) || [],
                encounterCategory: enc.encounter_category || '',
                encounterSubcategory: enc.encounter_subcategory || '',
            });

            if (readOnly) {
                import('@/actions/encounters').then(m => m.getAddenda(enc.id)).then(res => setAddenda(res.data));
            } else {
                setAddenda([]);
            }
        } else {
            handleReset();
            setAddenda([]);
        }
    }, [handleReset, form]);

    const onSave: SubmitHandler<EncounterFormValues> = async (values) => {
        if (!selectedPatient) {
            toast.error('Sin paciente', {
                description: 'Selecciona un paciente con ⌘K o desde el listado.'
            });
            return;
        }

        setIsSaving(true);

        const abnormalFindings = Object.entries(values.physicalExam)
            .filter(([, v]) => !v.normal)
            .map(([k, v]) => `${PHYSICAL_SYSTEMS.find(s => s.id === k)?.label || k}: ${v.notes}`)
            .join(' | ');

        let illnessDesc = '';
        const illness = values.currentIllness;
        const category = values.encounterCategory || '';
        if (category.includes('Seguimiento') || category.includes('Revisión') || category.includes('Postoperatorio') || category.includes('Telemedicina')) {
            illnessDesc = `Estado: ${illness.status || '-'} | Adherencia: ${illness.adherence || '-'} | Tolerado: ${illness.tolerated ? 'Sí' : 'No.'}\nNotas: ${illness.notes || '-'}`;
        } else if (category.includes('Preventiva') || category.includes('Salud Ocupacional') || category.includes('Evaluación Preoperatoria')) {
            illnessDesc = `Estado General: ${illness.generalState || '-'} | Limitaciones: ${illness.limitations ? 'Sí' : 'No'} | Modif. Estilo Vida: ${illness.lifestyleCh || '-'} \nNotas: ${illness.notes || '-'}`;
        } else {
            illnessDesc = `Tiempo evolución: ${illness.timeAmount || '?'} ${illness.timeUnit || 'días'} | Severidad: ${illness.severity || '-'} | Curso: ${illness.course || '-'}\nSituación/Notas: ${illness.notes || '-'}`;
        }

        const reqAnamnesis = updatePatientAnamnesis(selectedPatient.id, {
            familyHistory: values.familyHistory,
            pastConditions: values.pastConditions,
            knownAllergies: values.knownAllergies,
            surgicalHistory: values.surgicalHistory,
            habitsHistory: values.habitsHistory,
        });

        const subjective = `MOTIVO: ${values.chiefComplaint} | ENFERMEDAD ACTUAL: ${illnessDesc.replace(/\n/g, ' ')}`;
        const objective = `SIGNOS VITALES: ${JSON.stringify(values.vitals)} | HALLAZGOS FÍSICOS: ${abnormalFindings || 'Normal'} | EVOLUCIÓN: ${values.evolutionNote}`;
        
        // Un encuentro solo puede guardarse si ya existe (fue creado desde una cita)
        if (!activeEncounterId) {
            toast.error('Sin encuentro activo', {
                description: 'Para registrar una consulta, inicia el encuentro desde la agenda de citas.'
            });
            setIsSaving(false);
            return;
        }

        const res = await saveEncounterDraft(activeEncounterId, {
            subjective,
            objective,
            analysis: '',
            plan: values.treatmentPlan,
            evolution_note: values.evolutionNote,
            vital_signs: values.vitals,
            physical_exam: values.physicalExam as unknown as Json,
            diagnosis: values.diagnoses.map(d => ({ code: d.code, description: d.description, type: d.type })),
        });

        await reqAnamnesis;
        setIsSaving(false);

        if (res.error) {
            toast.error('Error al guardar borrador', {
                description: typeof res.error === 'string' ? res.error : 'No se pudo guardar el borrador.'
            });
        } else {
            toast.success('Borrador guardado', {
                description: 'Los cambios se guardaron como borrador del encuentro.'
            });

            const { data: encs } = await getEncounters(selectedPatient.id);
            setPastEncounters((encs || []) as EncounterWithClinicalNote[]);
        }
    };

    const handleFinalize = async () => {
        if (!activeEncounterId) return;
        setIsSaving(true);
        const res = await finalizeEncounter(activeEncounterId);
        setIsSaving(false);
        if (res.error) {
            toast.error('Error al finalizar', { description: res.error as string });
        } else {
            toast.success('Encuentro finalizado', { 
                description: 'El acto médico ha sido cerrado y firmado con éxito.' 
            });
            if (selectedPatient) {
                const { data: encs } = await getEncounters(selectedPatient.id);
                setPastEncounters((encs || []) as EncounterWithClinicalNote[]);
                const finished = (encs || []).find(e => e.id === activeEncounterId);
                if (finished) {
                    handleEncounterSelect(activeEncounterId, finished as EncounterWithClinicalNote);
                }
            }
        }
    };

    // Setup Sidebar
    useEffect(() => {
        setSecondaryPanel(
            <HistoryPatientPanel />,
            'Historial'
        );
    }, [selectedPatient, pastEncounters, activeEncounterId, isLoadingEncounters, setSecondaryPanel, handleEncounterSelect, handleReset]);

    // Load initial data
    useEffect(() => {
        async function init() {
            const pid = searchParams.get('patientId');
            const encId = searchParams.get('encounterId');

            if (pid || encId) {
                setIsLoadingEncounters(true);

                let patientId = pid;
                let encounterToLoad: EncounterWithClinicalNote | null = null;

                if (!pid && encId) {
                    const { getEncounterById } = await import('@/actions/encounters');
                    const encResult = await getEncounterById(encId);
                    if (encResult.data) {
                        patientId = encResult.data.patient_id;
                        encounterToLoad = encResult.data as EncounterWithClinicalNote;
                    }
                }

                const { data: patients } = await getPatients();
                const patient = patientId ? patients?.find((p) => p.id === patientId) : null;

                if (patient) {
                    setSelectedPatient(patient as Patient);

                    // Extract persisted Anamnesis data
                    const p = patient as Patient;
                    const famHist = Array.isArray(p.family_history) ? (p.family_history[0] as { text?: string })?.text || '' : '';
                    const habitsHist = Array.isArray(p.habits) ? (p.habits[0] as { text?: string })?.text || '' : '';
                    const persHist = Array.isArray(p.personal_history) ? p.personal_history as { label?: string, text?: string }[] : [];
                    const pastCond = persHist.find(h => h.label === 'Patológicos')?.text || '';
                    const surgHist = persHist.find(h => h.label === 'Quirúrgico')?.text || '';
                    const ext = Array.isArray(p.extensions) ? p.extensions as { url?: string, valueString?: string }[] : [];
                    const knownAllergies = ext.find(e => e.url === 'knownAllergies')?.valueString || '';

                    form.reset({
                        ...defaultValues,
                        familyHistory: famHist,
                        habitsHistory: habitsHist,
                        pastConditions: pastCond,
                        surgicalHistory: surgHist,
                        knownAllergies: knownAllergies
                    });

                    try {
                        const [cData, { data: encs }] = await Promise.all([
                            getPatientClinicalData(patient.id),
                            getEncounters(patient.id)
                        ]);

                        setClinicalData(cData as { conditions: Condition[]; allergies: AllergyIntolerance[] });
                        setPastEncounters((encs || []) as EncounterWithClinicalNote[]);

                        if (encId && encs) {
                            const encounter = encs.find(e => e.id === encId);
                            if (encounter) {
                                setActiveEncounterId(encId);
                                const readOnly = encounter.status === 'finished';
                                setIsReadOnly(readOnly);
                                
                                const rcEnc = encounter.clinical_note?.reason_code;
                                const chiefComplaint = (Array.isArray(rcEnc)
                                    ? (rcEnc as Array<Record<string, string>>)[0]?.text
                                    : typeof rcEnc === 'string' ? rcEnc : '') || '';

                                form.reset({
                                    ...form.getValues(),
                                    evolutionNote: encounter.clinical_note?.evolution_note || '',
                                    treatmentPlan: encounter.clinical_note?.plan || '',
                                    chiefComplaint,
                                    vitals: (encounter.vital_signs as Record<string, unknown>) || defaultVitals,
                                    physicalExam: (encounter.clinical_note?.physical_exam as unknown as EncounterFormValues["physicalExam"]) || defaultValues.physicalExam,
                                    diagnoses: (encounter.clinical_note?.diagnosis as unknown as EncounterFormValues["diagnoses"]) || [],
                                    encounterCategory: encounter.encounter_category || '',
                                    encounterSubcategory: encounter.encounter_subcategory || '',
                                });

                                if (readOnly) {
                                    import('@/actions/encounters').then(m => m.getAddenda(encounter.id)).then(res => setAddenda(res.data));
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching clinical data:', error);
                    } finally {
                        setIsLoadingEncounters(false);
                        setRightPanelOpen(true);
                    }
                }
            }
        }
        init();
    }, [searchParams, setRightPanelOpen, form]);

    const handleAddAddendum = async () => {
        if (!activeEncounterId || !newAddendumContent.trim()) return;
        setIsSavingAddendum(true);
        try {
            const { createAddendum, getAddenda } = await import('@/actions/encounters');
            const res = await createAddendum(activeEncounterId, newAddendumContent);
            if (res.error) {
                toast.error('Error al guardar addenda: ' + res.error);
            } else {
                toast.success('Addenda guardada correctamente');
                setNewAddendumContent('');
                setIsAddingAddendum(false);
                const list = await getAddenda(activeEncounterId);
                setAddenda(list.data);
            }
        } catch {
            toast.error('Error inesperado');
        } finally {
            setIsSavingAddendum(false);
        }
    };

    const patientName = selectedPatient 
        ? `${selectedPatient.name_family}, ${selectedPatient.name_given?.join(' ')}`
        : 'Historia Clínica';

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <form id="history-form" onSubmit={form.handleSubmit(onSave as SubmitHandler<EncounterFormValues>)} className="flex flex-col h-full w-full">
                {/* ── Page Header ───────────────────────────────────────────── */}
                <PageHeader
                    title={patientName}
                    description={selectedPatient ? `Expediente: ${(selectedPatient?.identifiers as Array<Record<string, string>> | null)?.[0]?.value || 'S/D'}` : 'Seleccione un paciente para comenzar el registro clínico.'}
                    breadcrumbs={[
                        { label: 'Historia Clínica', href: '/history' },
                        ...(selectedPatient ? [{ label: patientName }] : [])
                    ]}
                    actions={
                        <div className="flex items-center gap-2.5">
                            {isReadOnly && (
                                <Badge variant="pill-warning">
                                    Finalizado
                                </Badge>
                            )}
                            
                            {activeEncounterId && !isReadOnly && (
                                <Button 
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 px-3 font-bold gap-2 shadow-sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (confirm('¿Desea finalizar este encuentro? Una vez finalizado, la nota clínica será permanente y no podrá editarse directamente.')) {
                                            handleFinalize();
                                        }
                                    }}
                                    disabled={isSaving}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar Acto
                                </Button>
                            )}
                            
                            <Button 
                                type="submit"
                                variant={isReadOnly ? "outline" : "default"}
                                size="sm"
                                className={cn(
                                    "h-8 px-4 font-bold gap-2",
                                    !isReadOnly && "shadow-sm"
                                )}
                                disabled={isSaving || isReadOnly || !selectedPatient}
                            >
                                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                {isReadOnly ? "Lectura Permanente" : activeEncounterId ? "Actualizar" : "Guardar"}
                            </Button>

                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 px-3 font-semibold text-muted-foreground"
                                onClick={handleReset}
                                disabled={isSaving || isReadOnly}
                            >
                                Limpiar
                            </Button>
                        </div>
                    }
                    className="py-6"
                />

                <div className="flex-1 overflow-y-auto w-full">
                    <PageContainer size="full" className="pb-24">
                        <fieldset disabled={isReadOnly} className="border-none p-0 m-0 space-y-8">
                            {/* ── NOTA CLÍNICA — Secciones verticales continuas ── */}

                            
                            <div className="space-y-8">
                                <Card className="bg-n-1">
                                    <div className="px-6 pt-5 pb-4 border-b border-n-5/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-b-8/10 rounded-lg">
                                                <User className="w-5 h-5 text-b-8" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-bold text-n-11 tracking-tight">Motivo de Consulta y Antecedentes</h2>
                                                <p className="text-xs text-n-8 leading-relaxed mt-0.5">Registre la información subjetiva proporcionada por el paciente.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="p-8 space-y-10">
                                            <Field>
                                                <FieldLabel className="text-xs font-medium text-muted-foreground mb-2.5">
                                                    Tipo de Consulta <span className="text-primary">*</span>
                                                </FieldLabel>
                                                <Controller
                                                    control={form.control}
                                                    name="encounterSubcategory"
                                                    render={({ field }) => (
                                                        <Select onValueChange={(val) => {
                                                            field.onChange(val);
                                                            form.setValue('encounterCategory', getCategoryForSubcategory(val));
                                                        }} value={field.value} disabled={!selectedPatient}>
                                                            <SelectTrigger className="w-full bg-background/50 border-border/10 focus:ring-1 focus:ring-primary/20 transition-all rounded-xl h-11 text-sm font-medium">
                                                                <SelectValue placeholder="Clasificación de la visita..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px]">
                                                                {ENCOUNTER_CATEGORIES.map(group => (
                                                                    <SelectGroup key={group.label}>
                                                                        <SelectLabel className="bg-muted/5 font-semibold text-xs tracking-tight text-primary/70">{group.label}</SelectLabel>
                                                                        {group.options.map(opt => (
                                                                            <SelectItem key={opt} value={opt} className="text-sm cursor-pointer">{opt}</SelectItem>
                                                                        ))}
                                                                    </SelectGroup>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </Field>
                                        </div>

                                        <Field>
                                            <FieldLabel className="text-xs font-medium text-muted-foreground mb-2.5">
                                                Motivo de consulta <span className="text-primary">*</span>
                                            </FieldLabel>
                                            {selectedPatient && (
                                                <div className="mb-2">
                                                    <Select
                                                        key={chiefComplaintSelectKey}
                                                        onValueChange={(val) => {
                                                            const current = form.getValues("chiefComplaint");
                                                            const cleanCurrent = current ? current.trim() : "";
                                                            const separator = cleanCurrent
                                                                ? (cleanCurrent.endsWith(".") || cleanCurrent.endsWith(",") ? " " : ", ")
                                                                : "";
                                                            form.setValue("chiefComplaint", cleanCurrent + separator + val, { shouldDirty: true });
                                                            setChiefComplaintSelectKey(k => k + 1);
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sugerencias según tipo de consulta..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(SUGGESTION_MAP[form.watch('encounterSubcategory') || ''] || SUGGESTION_MAP[form.watch('encounterCategory') || 'default'] || SUGGESTION_MAP['default']).map(symptom => (
                                                                <SelectItem key={symptom} value={symptom}>{symptom}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                            <Textarea
                                                {...form.register("chiefComplaint")}
                                                placeholder="¿Por qué acude el paciente hoy?"
                                                rows={2}
                                                disabled={!selectedPatient}
                                                className="resize-none min-h-[80px]"
                                            />
                                            {form.formState.errors.chiefComplaint && (
                                                <FieldError className="text-[10px] mt-1.5">{form.formState.errors.chiefComplaint.message}</FieldError>
                                            )}
                                        </Field>

                                    <div className="mt-8 mb-4">
                                        <Dialog open={isWizardOpen} onOpenChange={(open) => { setIsWizardOpen(open); if (open) setWizardStep(0); }}>
                                            <DialogTrigger asChild>
                                                <Button type="button" variant="outline" className="w-full h-14 border-dashed bg-primary/5 hover:bg-primary/10 text-primary transition-all flex items-center justify-center gap-3 rounded-2xl">
                                                    <Plus className="w-5 h-5" />
                                                    <span className="font-semibold text-sm">Añadir Historia Clínica (Estado, Condiciones, Alergias, Hábitos...)</span>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 border-border/10 overflow-hidden bg-background">
                                                <DialogTitle className="sr-only">Asistente de Historia Clínica</DialogTitle>
                                                {!form.getValues('encounterSubcategory') ? (
                                                    <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
                                                        <div className="p-4 rounded-full bg-muted/20 mb-2">
                                                            <Info className="w-8 h-8 text-muted-foreground/60" />
                                                        </div>
                                                        <h3 className="text-base font-semibold">Selecciona el tipo de encuentro primero</h3>
                                                        <p className="text-sm text-muted-foreground max-w-sm">El asistente se adapta a cada tipo de consulta. Elige la categoría y subcategoría del encuentro para continuar.</p>
                                                        <Button variant="outline" onClick={() => setIsWizardOpen(false)}>Cerrar</Button>
                                                    </div>
                                                ) : (() => {
                                                    const subcategory = form.watch('encounterSubcategory') || '';
                                                    const chiefComplaint = form.watch('chiefComplaint') || '';
                                                    const profileKey = getWizardProfile(subcategory, chiefComplaint);
                                                    const profile = WIZARD_PROFILES[profileKey];
                                                    const totalSteps = profile.steps.length;
                                                    const isLastStep = wizardStep >= totalSteps - 1;

                                                    return (
                                                        <>
                                                            <DialogHeader className="p-6 pb-4 bg-muted/5 border-b border-border/5">
                                                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                                                    <Activity className="w-5 h-5 text-primary" />
                                                                    {profile.title}
                                                                </DialogTitle>
                                                                <DialogDescription>{profile.description}</DialogDescription>
                                                            </DialogHeader>

                                                            <div className="p-6 pb-4 border-b border-border/5 bg-background">
                                                                <Stepper value={wizardStep} onChange={setWizardStep} className="relative flex items-center w-full">
                                                                    {profile.steps.map((st, i, arr) => (
                                                                        <StepperItem key={i} value={i} disabled={wizardStep < i} className="flex-1 flex flex-col items-center relative text-center">
                                                                            <StepperHeader className="flex w-full items-center justify-center">
                                                                                <StepperIcon
                                                                                    className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${wizardStep === i
                                                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                                                        : wizardStep > i
                                                                                            ? 'border-primary bg-primary/10 text-primary'
                                                                                            : 'border-neutral-300 bg-neutral-100 text-neutral-400'
                                                                                        }`}
                                                                                >
                                                                                    {wizardStep > i ? <CheckCircle className="w-5 h-5" /> : st.icon}
                                                                                </StepperIcon>
                                                                                {i < arr.length - 1 && (
                                                                                    <StepperSeparator className={`absolute left-[calc(50%+20px)] right-[calc(-50%+20px)] top-5 block h-0.5 rounded-full ${wizardStep > i ? 'bg-primary' : 'bg-neutral-200'}`} />
                                                                                )}
                                                                            </StepperHeader>
                                                                            <div className="mt-2 text-center">
                                                                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${wizardStep === i ? 'text-foreground' : 'text-muted-foreground'}`}>{st.label}</span>
                                                                            </div>
                                                                        </StepperItem>
                                                                    ))}
                                                                </Stepper>
                                                            </div>

                                                            <div className="flex-1 overflow-y-auto p-6 bg-muted/5 min-h-[360px]">
                                                                {/* ─ Step: illness ─ */}
                                                                {profile.steps[wizardStep]?.key === 'illness' && (
                                                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Estado / Enfermedad Actual</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Indique la sintomatología y evolución de la molestia.</p>
                                                                        </div>

                                                                        <Field className="mb-2">
                                                                            <DiagnosisSearch
                                                                                id="suspectedDiagnosis"
                                                                                label="Enfermedad Presuntiva / Diagnóstico Inicial"
                                                                                placeholder="Busque por CIE-10, enfermedad o escriba manualmente..."
                                                                                value={form.watch('currentIllness.suspectedDiagnosis') || ''}
                                                                                onChange={(v) => form.setValue('currentIllness.suspectedDiagnosis', v)}
                                                                                labelClassName="text-xs mb-1.5 font-medium leading-none"
                                                                            />
                                                                        </Field>

                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                            <div className="space-y-4">
                                                                                <Field>
                                                                                    <FieldLabel className="text-xs mb-1.5">Tiempo de Evolución</FieldLabel>
                                                                                    <InputGroup>
                                                                                        <InputGroupInput type="number" placeholder="Ej: 3" {...form.register('currentIllness.timeAmount')} />
                                                                                        <Select onValueChange={(val) => form.setValue('currentIllness.timeUnit', val)}>
                                                                                            <SelectTrigger className="w-[110px]"><SelectValue placeholder="Unidad" /></SelectTrigger>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="horas">Horas</SelectItem>
                                                                                                <SelectItem value="días">Días</SelectItem>
                                                                                                <SelectItem value="semanas">Semanas</SelectItem>
                                                                                                <SelectItem value="meses">Meses</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </InputGroup>
                                                                                </Field>
                                                                                <Field>
                                                                                    <FieldLabel className="text-xs mb-1.5">Severidad</FieldLabel>
                                                                                    <Select onValueChange={(v) => form.setValue('currentIllness.severity', v)}>
                                                                                        <SelectTrigger><SelectValue placeholder="Escala de severidad" /></SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="Leve (1-3)">Leve (1-3)</SelectItem>
                                                                                            <SelectItem value="Moderada (4-7)">Moderada (4-7)</SelectItem>
                                                                                            <SelectItem value="Severa (8-10)">Severa (8-10)</SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </Field>
                                                                                <Field>
                                                                                    <FieldLabel className="text-xs mb-1.5">Factores que agravan</FieldLabel>
                                                                                    <Input {...form.register('currentIllness.aggravatingFactors')} placeholder="Agravantes..." className="text-xs" />
                                                                                </Field>
                                                                            </div>
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Aliviantes</FieldLabel>
                                                                                <Textarea {...form.register('currentIllness.alleviatingFactors')} placeholder="Frío, reposo, analgésicos..." rows={2} />
                                                                            </Field>
                                                                        </div>

                                                                        {/* ─ Additional fields for First Visit ─ */}
                                                                        {profileKey === 'first_visit' && (
                                                                            <div className="pt-4 border-t border-border/10 space-y-4">
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                    <Field>
                                                                                        <FieldLabel className="text-xs mb-1.5">Modo de Inicio</FieldLabel>
                                                                                        <Select onValueChange={(v) => form.setValue('currentIllness.onsetMode', v)}>
                                                                                            <SelectTrigger className="text-xs h-9"><SelectValue placeholder="¿Cómo empezó?" /></SelectTrigger>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="Súbito">Súbito (De golpe)</SelectItem>
                                                                                                <SelectItem value="Insidioso">Insidioso (Poco a poco)</SelectItem>
                                                                                                <SelectItem value="Post-traumático">Post-traumático</SelectItem>
                                                                                                <SelectItem value="Congénito">Congénito (Desde nacimiento)</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </Field>
                                                                                    <Field>
                                                                                        <FieldLabel className="text-xs mb-1.5">Atribución del Paciente</FieldLabel>
                                                                                        <Input {...form.register('currentIllness.patientTheory')} placeholder="¿A qué cree que se debe?" className="text-xs h-9" />
                                                                                    </Field>
                                                                                </div>
                                                                                <Field>
                                                                                    <FieldLabel className="text-xs mb-1.5">Consultas o Tratamientos Previos para este fin</FieldLabel>
                                                                                    <Textarea {...form.register('currentIllness.pastTreatments')} placeholder="Médicos que ha visto antes, remedios caseros, automedicación..." rows={2} />
                                                                                </Field>
                                                                            </div>
                                                                        )}

                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Notas adicionales del relato</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Cualquier otro detalle relevante del interrogatorio..." className="resize-none min-h-[80px]" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: personal ─ */}
                                                                {profile.steps[wizardStep]?.key === 'personal' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Antecedentes Personales Patológicos</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Condiciones médicas crónicas e historial de hospitalizaciones.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs font-medium text-muted-foreground mb-2">Enfermedades y Condiciones Crónicas</FieldLabel>
                                                                            <Textarea {...form.register('pastConditions')} placeholder="Hipertensión, diabetes, asma, cardiopatía, hipotiroidismo..." rows={5} disabled={!selectedPatient} />
                                                                            <FieldSuggestions fieldKey="personalHistory" profileKey={profileKey} onSuggest={(s) => {
                                                                                const curr = form.getValues('pastConditions') || '';
                                                                                form.setValue('pastConditions', curr ? `${curr}, ${s}` : s, { shouldDirty: true });
                                                                            }} />
                                                                        </Field>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs font-medium text-muted-foreground mb-2">Historial de Hospitalizaciones Previas</FieldLabel>
                                                                            <Textarea {...form.register('hospitalizationHistory')} placeholder="Indique motivos, fechas aproximadas y tiempo de estancia..." rows={3} disabled={!selectedPatient} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: surgical ─ */}
                                                                {profile.steps[wizardStep]?.key === 'surgical' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Antecedentes Quirúrgicos</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Cirugías pasadas, procedimientos invasivos y anestesia.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs font-medium text-muted-foreground mb-2">Cirugías y Procedimientos</FieldLabel>
                                                                            <Textarea {...form.register('surgicalHistory')} placeholder="Apéndice (2010), Colecistectomía (2018), Cesáreas, etc..." rows={8} disabled={!selectedPatient} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: meds_allergies ─ */}
                                                                {profile.steps[wizardStep]?.key === 'meds_allergies' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Medicación Actual y Alergias</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registre los medicamentos que toma el paciente y sus alergias conocidas.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs font-medium text-muted-foreground mb-2">Medicamentos Actuales (Dosis y Frecuencia)</FieldLabel>
                                                                            <Textarea {...form.register('currentMedications')} placeholder="Ej: Losartán 50mg (1 vez/día), Metformina 850mg (con cena)..." rows={4} disabled={!selectedPatient} />
                                                                        </Field>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs font-medium text-muted-foreground mb-2 text-destructive">Alergias Conocidas (Medicamentos / Alimentos / Otros)</FieldLabel>
                                                                            <Textarea {...form.register('knownAllergies')} placeholder="Penicilina, polen, látex, aines, alimentos, etc..." rows={3} disabled={!selectedPatient} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: family ─ */}
                                                                {profile.steps[wizardStep]?.key === 'family' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Antecedentes Familiares</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Enfermedades heredofamiliares de relevancia clínica.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs font-medium text-muted-foreground mb-2">Seleccionar condición familiar genérica</FieldLabel>
                                                                            <div className="mb-3">
                                                                                <Select key={familyHistorySelectKey} onValueChange={(val) => {
                                                                                    const current = form.getValues('familyHistory') || '';
                                                                                    if (current.includes(val)) return;
                                                                                    form.setValue('familyHistory', current.trim() + (current.trim() ? ', ' : '') + val, { shouldDirty: true });
                                                                                    setFamilyHistorySelectKey(k => k + 1);
                                                                                }}>
                                                                                    <SelectTrigger><SelectValue placeholder="Seleccionar para añadir a la lista..." /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {COMMON_FAMILY_HISTORIES.map((c, idx) => <SelectItem key={idx} value={c}>{c}</SelectItem>)}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                            <Textarea {...form.register('familyHistory')} placeholder="Cáncer, diabetes, hipertensión familiar..." rows={8} disabled={!selectedPatient} />
                                                                            <FieldSuggestions fieldKey="family" profileKey={profileKey} onSuggest={(s) => {
                                                                                const curr = form.getValues('familyHistory') || '';
                                                                                form.setValue('familyHistory', curr ? `${curr}, ${s}` : s, { shouldDirty: true });
                                                                            }} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: habits ─ */}
                                                                {profile.steps[wizardStep]?.key === 'habits' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Hábitos / Estilo de Vida</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Tabaquismo, alcohol, drogas, dieta o actividad física.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs font-medium text-muted-foreground mb-2">Descripción de Hábitos</FieldLabel>
                                                                            <Textarea {...form.register('habitsHistory')} placeholder="Fuma 5 cigarrillos al día, bebedor ocasional, sedentarismo..." rows={10} disabled={!selectedPatient} />
                                                                            <FieldSuggestions fieldKey="habits" profileKey={profileKey} onSuggest={(s) => {
                                                                                const curr = form.getValues('habitsHistory') || '';
                                                                                form.setValue('habitsHistory', curr ? `${curr}, ${s}` : s, { shouldDirty: true });
                                                                            }} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: review_systems ─ */}
                                                                {profile.steps[wizardStep]?.key === 'review_systems' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Revisión por Sistemas</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Interrogatorio para detectar síntomas secundarios.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs font-medium text-muted-foreground mb-2">Anamnesis por Sistemas</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Respiratorio, Cardiovascular, Gastrointestinal, Genitourinario, Musculoesquelético, Neurológico..." rows={10} disabled={!selectedPatient} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─── NEW SPECIALIZED STEPS ─── */}

                                                                {/* ─ Step: nutrition_anthropometry ─ */}
                                                                {profile.steps[wizardStep]?.key === 'nutrition_anthropometry' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Antropometría y Mediciones</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Ingrese los datos antropométricos iniciales relevantes para la asesoría nutricional.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Masa Corporal y Antropometría</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Peso inicial, talla, % grasa corporal (bioimpedancia), pliegues cutáneos..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: nutrition_diet ─ */}
                                                                {profile.steps[wizardStep]?.key === 'nutrition_diet' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Dietética y R24H</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Recordatorio de 24 horas, preferencias, aversiones y suplementación.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Dietética (R24H) y Suplementos</FieldLabel>
                                                                            <Textarea {...form.register('habitsHistory')} placeholder="Desayuno: ... Almuerzo: ... Cena: ... Suplementos: ..." rows={6} className="resize-none" />
                                                                            <FieldSuggestions fieldKey="habits" profileKey={profileKey} onSuggest={(s) => {
                                                                                const curr = form.getValues('habitsHistory') || '';
                                                                                form.setValue('habitsHistory', curr ? `${curr}, ${s}` : s, { shouldDirty: true });
                                                                            }} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: nutrition_clinical_signs ─ */}
                                                                {profile.steps[wizardStep]?.key === 'nutrition_clinical_signs' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Clínico: Signos y Síntomas</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Frecuencia de evacuaciones, calidad de sueño, energía y signos físicos (cabello, uñas, piel).</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evaluación Clínica Nutricional</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Digestión, distensión abdominal, calidad del sueño, fatiga..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: nutrition_biochemical ─ */}
                                                                {profile.steps[wizardStep]?.key === 'nutrition_biochemical' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Bioquímicos: Exámenes de Laboratorio</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Interpretación rápida de analíticas recientes (Glucosa, Perfil Lipídico, Hemograma, etc).</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Resultados y Observaciones Bioquímicas</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Colesterol Total: ... Triglicéridos: ... Glucosa en ayuno: ..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: nutrition_sports_clinical ─ */}
                                                                {profile.steps[wizardStep]?.key === 'nutrition_sports_clinical' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Clínico: Rendimiento Deportivo</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Metas de desempeño, tipo de entrenamiento, intensidad, recuperación muscular.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evaluación Deportiva y Metas</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Entrenamiento de fuerza 5x semana. Fatiga post-entreno, calambres..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: nutrition_behavioral_clinical ─ */}
                                                                {profile.steps[wizardStep]?.key === 'nutrition_behavioral_clinical' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Clínico: Comportamiento y Barreras</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Evaluación de relación con la comida, barreras para adherencia, estrés emocional.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evaluación Psicológica Nutricional</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Atracones nocturnos, ansiedad, pensamientos restrictivos..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: psycho_reason ─ */}
                                                                {profile.steps[wizardStep]?.key === 'psycho_reason' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Motivo de Consulta y Emoción Principal</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Explore los motivos emocionales y desencadenantes percibidos.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Exploración de Motivo de Consulta</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Paciente refiere sentirse... Manifiesta ansiedad ante situaciones de..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: psycho_events ─ */}
                                                                {profile.steps[wizardStep]?.key === 'psycho_events' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Eventos Estresantes y Patrones de Sueño</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Eventos recientes que puedan afectar la estabilidad y calidad del sueño.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Desencadenantes / Somatización / Sueño</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Dificultad para conciliar sueño (insomnio inicial). Eventos recientes: pérdida de empleo..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: peds_development ─ */}
                                                                {profile.steps[wizardStep]?.key === 'peds_development' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Hitos del Desarrollo Psicomotor</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Evaluación de desarrollo motor fino/grueso, lenguaje y área social-adaptativa.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hitos Alcanzados</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Motor: sostiene cabeza (3m), se sienta solo (6m)... Lenguaje: balbuceos..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: peds_diet_vaccines ─ */}
                                                                {profile.steps[wizardStep]?.key === 'peds_diet_vaccines' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Inmunizaciones y Alimentación</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Esquema de vacunación y alimentación complementaria.</p>
                                                                        </div>
                                                                        <Field className="mb-4">
                                                                            <FieldLabel className="text-xs mb-1.5">Esquema de Vacunación</FieldLabel>
                                                                            <Textarea {...form.register('pastConditions')} placeholder="Vacunas al día (BCG, Pentavalente, Rotavirus...)" rows={3} className="resize-none" />
                                                                        </Field>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Alimentación Pediátrica</FieldLabel>
                                                                            <Textarea {...form.register('habitsHistory')} placeholder="Lactancia materna exclusiva. Inicio alimentación complementaria con verduras/frutas." rows={3} className="resize-none" />
                                                                            <FieldSuggestions fieldKey="habits" profileKey={profileKey} onSuggest={(s) => {
                                                                                const curr = form.getValues('habitsHistory') || '';
                                                                                form.setValue('habitsHistory', curr ? `${curr}, ${s}` : s, { shouldDirty: true });
                                                                            }} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: wh_cycle ─ */}
                                                                {profile.steps[wizardStep]?.key === 'wh_cycle' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Ciclo Menstrual y Prevención</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Información de regularidad, MAC (Métodos Anticonceptivos) y tamizaje preventivo.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">FUM, Características de Ciclo y Anticoncepción</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="FUM: dd/mm/aaaa. Ciclos de 28/4 días. MAC: ACO combinada. Última citología/PAP: Normal..." rows={7} className="resize-none" />
                                                                        </Field>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs font-medium text-muted-foreground mb-2">Antecedentes Gineco-Obstétricos (AGO)</FieldLabel>
                                                                            <Textarea {...form.register('pastConditions')} placeholder="G_P_A_C_, Embarazos previos (complicaciones)..." rows={3} disabled={!selectedPatient} />
                                                                            <FieldSuggestions fieldKey="personalHistory" profileKey={profileKey} onSuggest={(s) => {
                                                                                const curr = form.getValues('pastConditions') || '';
                                                                                form.setValue('pastConditions', curr ? `${curr}, ${s}` : s, { shouldDirty: true });
                                                                            }} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: sports_performance ─ */}
                                                                {profile.steps[wizardStep]?.key === 'sports_performance' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Rendimiento y Metas Físicas</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Frecuencia de entrenamiento y objetivos del paciente.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Rutina y Objetivos</FieldLabel>
                                                                            <Textarea {...form.register('habitsHistory')} placeholder="Entrenamiento cruzado 5 veces/semana. Corrección de gesto deportivo. Aumento masa muscular..." rows={5} className="resize-none" />
                                                                            <FieldSuggestions fieldKey="habits" profileKey={profileKey} onSuggest={(s) => {
                                                                                const curr = form.getValues('habitsHistory') || '';
                                                                                form.setValue('habitsHistory', curr ? `${curr}, ${s}` : s, { shouldDirty: true });
                                                                            }} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: sports_injuries ─ */}
                                                                {profile.steps[wizardStep]?.key === 'sports_injuries' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Historial Lesivo</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro de lesiones previas agudas o por sobreuso que impacten la biomecánica.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Lesiones Previas / Sobreuso</FieldLabel>
                                                                            <Textarea {...form.register('pastConditions')} placeholder="Esguince tobillo derecho crónico. Tendinopatía rotuliana leve..." rows={5} className="resize-none" />
                                                                            <FieldSuggestions fieldKey="personalHistory" profileKey={profileKey} onSuggest={(s) => {
                                                                                const curr = form.getValues('pastConditions') || '';
                                                                                form.setValue('pastConditions', curr ? `${curr}, ${s}` : s, { shouldDirty: true });
                                                                            }} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─── NEW PEDIATRIC STEPS ─── */}
                                                                {profile.steps[wizardStep]?.key === 'peds_growth' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Crecimiento y Percentiles</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro de peso, talla, PC y su ubicación en curvas de crecimiento.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Percentiles y Antropometría Pediátrica</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Peso: X kg (pXX). Talla: X cm (pXX). PC: X cm (pXX). Tendencia..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'peds_diet' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Alimentación Pediátrica</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Lactancia, fórmulas o ablactación.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hábitos de Alimentación</FieldLabel>
                                                                            <Textarea {...form.register('habitsHistory')} placeholder="LME / Fórmula (cantidad/frecuencia). Tolerancia..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'peds_infectious' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Cuadro Infeccioso / Agudo</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Días de fiebre, picos máximos, estado de hidratación y apetito.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Historia de la Enfermedad</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Inició hace X días con alza térmica de X°C. Tolerancia intolerancia oral..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'peds_exam_directed' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Físico Dirigido</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Oídos, garganta, ruidos pulmonares, signos meníngeos.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Físicos Relevantes</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Orofarínge congestiva, otoscopia con abombamiento, tirajes..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'peds_behavior' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Conducta y Entorno</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Rendimiento escolar, comportamiento en casa, alertas del neurodesarrollo.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evaluación Conductual</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Reportes de guardería/colegio. Rabietas, hiperactividad, atención..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'peds_sleep_habits' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Hábitos de Sueño y Dinámica</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Rutinas de sueño, despertares nocturnos, terrores, chupón.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Registro de Hábitos</FieldLabel>
                                                                            <Textarea {...form.register('habitsHistory')} placeholder="Duerme X horas. Uso de pantallas antes de dormir..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─── NEW WOMENS HEALTH STEPS ─── */}
                                                                {profile.steps[wizardStep]?.key === 'wh_preventive' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Prevención y Tamizaje</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Fechas y resultados de últimos estudios preventivos.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">PAP, Mamografía y Ecografía</FieldLabel>
                                                                            <Textarea {...form.register('pastConditions')} placeholder="Último PAP y resultado: ... Mamografía: ... Eco Transvaginal: ..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'wh_contraception' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Anticoncepción y Ciclo</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Método actual, tolerancia, FUM, deseo de embarazo.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">MAC y Ritmo Genital</FieldLabel>
                                                                            <Textarea {...form.register('habitsHistory')} placeholder="FUM: ... Ritmo menstrual: ... Tolerancia a MAC actual: ..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'wh_prenatal' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Control Prenatal</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Semanas de gestación por FUM / Eco, FPP, movimientos fetales.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Desarrollo de la Gestación</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="FUM: ... FPP: ... SDG actuales: ... Eco anatómico: ... Movimientos: ..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'wh_maternal_eval' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Materna</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Ganancia de peso, presión arterial materna, molestias del trimestre.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Signos y Suplementación</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="PA: ... Peso actual/Ganancia: ... Tolerancia hierro/ácido fólico: ..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'wh_bleeding_pain' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Patrón de Sangrado y Dolor</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Cantidad (toallas/día), dismenorrea, dispareunia, coágulos.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Semiología del Dolor y Sangrado</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Cantidad de sangrado, duración, intensidad dolor EVA, irradiación..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'wh_endocrinology' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Endocrinología Ginecológica</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Acné, hirsutismo, galactorrea, síntomas vasomotores (bochornos).</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Signos Endocrinos</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Cambios peso, hirsutismo, caída de cabello, bochornos..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─── NEW SPORTS STEPS ─── */}
                                                                {profile.steps[wizardStep]?.key === 'sports_cardio_risk' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Riesgo Cardiovascular</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Antecedentes de muerte súbita, síncopes al esfuerzo, disnea extradeportiva.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">AHA / Muerte Súbita Familiar</FieldLabel>
                                                                            <Textarea {...form.register('familyHistory')} placeholder="Historia familiar muerte súbita <50a. Dolor precordial al esfuerzo..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sports_aptitude' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Aptitud Física y Exámenes</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Resultados de EKG, Ergometría, Ecocardio.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evaluación Pre-participativa</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="EKG Basal: ... Apto para competición deportiva: Sí/No..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sports_injury_mech' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Mecanismo de Lesión</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Cómo ocurrió, tiempo de evolución, terapias e infiltraciones previas.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Cinemática y Abordaje Previo</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Manejo agudo (RICE), mecanismo exacto (torsión, impacto)..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sports_functional' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Limitación Funcional y Retorno</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Grado de limitación en AVD, dolor al gesto deportivo, meta de Return to Play.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Déficit Funcional</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Imposibilidad para carga axial. Dolor al cambio de dirección. Expectativas..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─── NEW PSYCHOTHERAPY STEPS ─── */}
                                                                {profile.steps[wizardStep]?.key === 'psych_symptoms' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Sintomatología y Severidad</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Frecuencia e intensidad de ataques de angustia, llanto, o apatía.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Exploración de la Esfera Afectiva</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Ideas de minusvalía, anhedonia, presencia de ideación estructurada..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'psych_biological' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Esfera Biológica / Somática</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Alteración del apetito, insomnio de mantenimiento, fatiga, pérdida de peso.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Síntomas Físicos Asociados</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Despertares tempranos. Pérdida de apetito marcada. Taquicardias." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'psych_interpersonal' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Dinámica Interpersonal</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Conflictos de roles, límites, alianzas, y patrones de dependencia.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Sistema Familiar / Pareja</FieldLabel>
                                                                            <Textarea {...form.register('familyHistory')} placeholder="Genograma familiar relevando conflictos. Roles actuales..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'psych_stress' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Estrés y Afrontamiento</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Estresores peritraumáticos, recursos del paciente, red de apoyo.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Mecanismos de Afrontamiento</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Estrategias de evitación, negación vs asimilación. Red de apoyo principal..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─── PRIMARY CARE: ACUTE STEPS ─── */}
                                                                {profile.steps[wizardStep]?.key === 'acute_resp_symptoms' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Vía Aérea y Respiración</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro de tos, disnea, expectoración y factores agravantes.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evolución Síntomas Respiratorios</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Inicio de síntomas hace X días. Tos productiva verdosa. Escalofríos y fiebre no cuantificada. Sin disnea en reposo..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'acute_resp_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Físico Dirigido (Respiratorio)</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Auscultación pulmonar, ORL, signos de distrés.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Pulmonares / ORL</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam')} placeholder="Orofaringe hiperémica, no exudado. Tórax: Murmullo vesicular conservado. Roncus diseminados basales sin crepitantes..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {profile.steps[wizardStep]?.key === 'acute_gi_symptoms' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Síntomas Gastrointestinales</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Dolor abdominal, tránsito intestinal, estado de hidratación.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evolución y Tolerancia Oral</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Dolor abdominal tipo cólico difuso desde hace X hrs. Múltiples deposiciones líquidas. Tolerancia oral parcial..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'acute_gi_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Abdominal / Hidratación</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Semiología del abdomen, signos de irritación peritoneal, mucosas.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Abdominales</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam')} placeholder="Abdomen blando, depresible, ruidos hidroaéreos aumentados. Dolor a palpación profunda en fosa ilíaca derecha. Blumberg negativo..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {profile.steps[wizardStep]?.key === 'acute_osteo_symptoms' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Semiología del Dolor / Musculoesquelético</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Mecanismo, radiación del dolor, factores que alivian o empeoran.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Historia de la Dolencia / Lesión</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Inicio brusco al realizar esfuerzo (levantar peso). Dolor lumbar irradiado a miembro inferior derecho. EVA 8/10..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'acute_osteo_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Funcional (Osteomuscular)</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Rango de movimiento, maniobras provocativas, reflejos y fuerza.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Músculo-esqueléticos</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam')} placeholder="Marcha antálgica. Limitación a flexión anterior de tronco. Lasègue (+) a 45° a derecha. Fuerza conservada en EEII..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {profile.steps[wizardStep]?.key === 'acute_neuro_symptoms' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Síntoma Neurológico Agudo</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Características de cefalea, vértigo o déficit motor/sensitivo.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evolución y Banderas Rojas</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Cefalea holocraneal opresiva intensa desde hace X hrs. Fotofobia asociada. Sin fiebre ni vómitos previos..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'acute_neuro_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Neurológico</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Pares craneales, signos meníngeos, coordinación y fuerza.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Neurológicos</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam')} placeholder="Paciente alerta, orientado. Pupilas isocóricas fotorreactivas. Pares craneales sin alteraciones. Sin signos de irritación meníngea. Fuerza y sensibilidad conservadas en 4 extremidades..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─── CHRONIC DISEASE: FOLLOW-UP STEPS ─── */}
                                                                {profile.steps[wizardStep]?.key === 'chronic_cardio_control' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Control Cardiometabólico y Adherencia</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro de síntomas, adherencia al tratamiento y estilo de vida agudo.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Estado Actual y Cumplimiento</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Paciente asintomático cardiovascular. Refiere buena adherencia a medicación (Metformina 850mg c/12h). Actividad física 3 veces/semana..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'chronic_cardio_labs' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Metas y Exámenes Complementarios</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro de PA, HbA1c, perfil lipídico y examen físico focalizado.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Físicos y Laboratorios</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam')} placeholder="PA: 125/80 mmHg. Examen de pie diabético: pulsos presentes, sensibilidad conservada. Labs (fecha): HbA1c 6.8%, LDL 90 mg/dL..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {profile.steps[wizardStep]?.key === 'chronic_resp_control' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Control Respiratorio (Asma / EPOC)</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Frecuencia de síntomas, uso de medicación de rescate y exacerbaciones recientes.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Síntomas y Uso de Inhaladores</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Ausencia de tos nocturna o sibilancias en el último mes. Necesidad de SABA < 2 veces/semana. Cumple tratamiento de mantenimiento (ICS/LABA)..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'chronic_resp_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Pulmonar / Pruebas Función</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Auscultación actual y resultados de espirometría si están disponibles.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Pulmonares y Funcionales</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam')} placeholder="Tórax normoexpansible. Murmullo vesicular pasa bien en ambos campos pulmonares, sin agregados. Oximetría: 97% al aire ambiente. Espirometría reciente muestra..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {profile.steps[wizardStep]?.key === 'chronic_rheuma_control' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Actividad Reumatológica y Dolor</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro de dolor (EVA), rigidez matinal, brotes y fatiga.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Estado Clínico y Funcional</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Refiere rigidez matinal de 15 minutos. Dolor basal EVA 3/10. Buen control con tratamiento modificador de la enfermedad (FAMEs)..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'chronic_rheuma_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Articular Dirigido</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Recuento de articulaciones dolorosas/tumefactas y limitación del rango de movimiento.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Articulares / Sistémicos</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam')} placeholder="Carencia de artritis activa en manos y carpos. Leve crepitación en rodilla derecha sin derrame articular. Movilidad cervical conservada..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {profile.steps[wizardStep]?.key === 'chronic_neuro_control' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Control Neurológico (Crisis/Episodios)</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro de frecuencia de episodios (crisis, cefaleas), desencadenantes y adherencia.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evolución y Tolerancia a Fármacos</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Libre de crisis convulsivas durante los últimos 6 meses. Adecuada tolerancia al valproato, sin somnolencia ni temblor referidos. Cumplimiento 100%..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'chronic_neuro_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Físico Neurológico</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Tono, trofismo, marcha, coordinación y evaluación cognitiva breve.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Neurológicos Actuales</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam')} placeholder="Marcha estable y coordinada. Fuerza conservada 5/5 global. Tono normal. Reflejos osteotendinosos simétricos ++/++++. Sin signos cerebelosos ni extrapiramidales..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─── CHRONIC DISEASE: FOLLOW-UP STEPS ─── */}
                                                                {profile.steps[wizardStep]?.key === 'chronic_cardio_control' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Control Cardiometabólico y Adherencia</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro de síntomas, adherencia al tratamiento y estilo de vida agudo.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Estado Actual y Cumplimiento</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Paciente asintomático cardiovascular. Refiere buena adherencia a medicación (Metformina 850mg c/12h). Actividad física 3 veces/semana..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'chronic_cardio_labs' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Metas y Exámenes Complementarios</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro de PA, HbA1c, perfil lipídico y examen físico focalizado.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Físicos y Laboratorios</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="PA: 125/80 mmHg. Examen de pie diabético: pulsos presentes, sensibilidad conservada. Labs (fecha): HbA1c 6.8%, LDL 90 mg/dL..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {profile.steps[wizardStep]?.key === 'chronic_resp_control' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Control Respiratorio (Asma / EPOC)</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Frecuencia de síntomas, uso de medicación de rescate y exacerbaciones recientes.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Síntomas y Uso de Inhaladores</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Ausencia de tos nocturna o sibilancias en el último mes. Necesidad de SABA < 2 veces/semana. Cumple tratamiento de mantenimiento (ICS/LABA)..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'chronic_resp_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Pulmonar / Pruebas Función</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Auscultación actual y resultados de espirometría si están disponibles.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Pulmonares y Funcionales</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="Tórax normoexpansible. Murmullo vesicular pasa bien en ambos campos pulmonares, sin agregados. Oximetría: 97% al aire ambiente. Espirometría reciente muestra..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {profile.steps[wizardStep]?.key === 'chronic_rheuma_control' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Actividad Reumatológica y Dolor</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro de dolor (EVA), rigidez matinal, brotes y fatiga.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Estado Clínico y Funcional</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Refiere rigidez matinal de 15 minutos. Dolor basal EVA 3/10. Buen control con tratamiento modificador de la enfermedad (FAMEs)..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'chronic_rheuma_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Articular Dirigido</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Recuento de articulaciones dolorosas/tumefactas y limitación del rango de movimiento.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Articulares / Sistémicos</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="Carencia de artritis activa en manos y carpos. Leve crepitación en rodilla derecha sin derrame articular. Movilidad cervical conservada..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {profile.steps[wizardStep]?.key === 'chronic_neuro_control' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Control Neurológico (Crisis/Episodios)</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro de frecuencia de episodios (crisis, cefaleas), desencadenantes y adherencia.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evolución y Tolerancia a Fármacos</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Libre de crisis convulsivas durante los últimos 6 meses. Adecuada tolerancia al valproato, sin somnolencia ni temblor referidos. Cumplimiento 100%..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'chronic_neuro_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Físico Neurológico</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Tono, trofismo, marcha, coordinación y evaluación cognitiva breve.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Neurológicos Actuales</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="Marcha estable y coordinada. Fuerza conservada 5/5 global. Tono normal. Reflejos osteotendinosos simétricos ++/++++. Sin signos cerebelosos ni extrapiramidales..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─── PREVENTIVE & OCCUPATIONAL HEALTH STEPS ─── */}
                                                                {profile.steps[wizardStep]?.key === 'prev_screening' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Riesgo y Tamizaje</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Evaluación de factores de riesgo cardiovascular, oncológico y metabólico.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Factores de Riesgo / Antecedentes relevantes</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Riesgo CV a 10 años: X%. Tabaquismo activo (IPA). Sedentarismo. Familiar de 1er grado con Ca Colon..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'prev_vaccines' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Vacunas y Plan Preventivo</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Estado de inmunizaciones y prescripción de estudios de screening.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Inmunizaciones y Pruebas Indicadas</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="Esquema de vacunación completo para la edad. Pendiente refuerzo Antitetánica. Se solicita screening: Colonoscopia, Mamografía, PSA..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {profile.steps[wizardStep]?.key === 'occ_aptitude' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Aptitud Laboral</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Evaluación de la capacidad del trabajador para desempeñar su cargo.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Físico Ocupacional / Conclusión</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Apto sin restricciones. Examen físico dentro de límites normales. Agudeza visual conservada con corrección..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'occ_risks' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Riesgos y Exposición</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Ergonomía, exposición química, física, biológica o psicológica en el puesto.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Factores de Riesgo Ocupacional</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="Trabajador administrativo: riesgo biomecánico y visual. Refiere pausas activas irregulares. Sin exposición a químicos..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─── PREVENTIVE & OCCUPATIONAL HEALTH STEPS ─── */}
                                                                {profile.steps[wizardStep]?.key === 'prev_screening' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Riesgo y Tamizaje</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Evaluación de factores de riesgo cardiovascular, oncológico y metabólico.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Factores de Riesgo / Antecedentes relevantes</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Riesgo CV a 10 años: X%. Tabaquismo activo (IPA). Sedentarismo. Familiar de 1er grado con Ca Colon..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'prev_vaccines' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Vacunas y Plan Preventivo</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Estado de inmunizaciones y prescripción de estudios de screening.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Inmunizaciones y Pruebas Indicadas</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="Esquema de vacunación completo para la edad. Pendiente refuerzo Antitetánica. Se solicita screening: Colonoscopia, Mamografía, PSA..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {profile.steps[wizardStep]?.key === 'occ_aptitude' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Aptitud Laboral</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Evaluación de la capacidad del trabajador para desempeñar su cargo.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Físico Ocupacional / Conclusión</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Apto sin restricciones. Examen físico dentro de límites normales. Agudeza visual conservada con corrección..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'occ_risks' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Riesgos y Exposición</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Ergonomía, exposición química, física, biológica o psicológica en el puesto.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Factores de Riesgo Ocupacional</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="Trabajador administrativo: riesgo biomecánico y visual. Refiere pausas activas irregulares. Sin exposición a químicos..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─── PROCEDURES, EMERGENCIES & INTERCONSULTATION STEPS ─── */}
                                                                {profile.steps[wizardStep]?.key === 'nursing_vitals' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Constantes y Signos Vitales</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro inicial prep-procedimiento.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Signos Vitales y Estado Basal</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="PA: 120/80 mmHg, FC: 75 lpm, FR: 16 rpm, SatO2: 98%. Paciente alerta y orientado..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'nursing_procedure' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Curación / Administración</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Detalle del procedimiento realizado por enfermería.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Detalles del Procedimiento Realizado</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Se realiza curación de herida quirúrgica con suero fisiológico y cobertura con apósito estéril. Se administra 1 ampolla de Ketorolaco IM..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'obs_vitals' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Estado Basal y Signos Vitales</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registro al momento del inicio de observación clínica.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Signos Vitales y Vías de Acceso</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="FC, FR, PA, SatO2, T°... Vía venosa periférica permeable y pasando plan..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'obs_evolution' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evolución Clínica y Conducta Médica</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Actualizaciones durante observación o resumen al momento del egreso/ingreso.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Nota de Evolución / Tolerancia a vía oral</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Evolución favorable, afebril, consciente, hidratado. Tolera vía oral. Alta médica con pautas de alarma..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'infusion_monitoring' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Monitorización de Infusión</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Signos vitales y evaluación de vía venosa periférica o central.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Monitoreo Pre y Durante Infusión</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="VVP permeable sin signos de extravasación ni flebitis. Signos vitales estables durante la primera hora de infusión..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'infusion_details' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Detalles de la Infusión</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Medicación, dosis, volumen y tiempo de administración.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Registro de Tratamiento Infusional</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Se infunde Hierro Endovenoso 500mg diluido en 500ml de SSN 0.9% a pasar en 2 horas. Sin reacciones adversas reportadas..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'rehab_evolution' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evolución Funcional</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Rangos de movilidad, fuerza y escala visual análoga (EVA) del dolor.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evaluación Funcional / Musculoesquelética</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="Dolor EVA 3/10. Arco de movilidad articular de hombro derecho flexión 120°. Fuerza 4/5..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'rehab_therapy' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Terapia Aplicada</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Modalidades físicas y ejercicios realizados en la sesión.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Intervención y Modalidades</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="US pulsado 1 MHz por 5 min. Ejercicios isométricos y elongación pasiva de musculatura flexora. Paciente tolera bien..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'emergency_minor_management' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Manejo Inicial (Urgencia Menor)</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Atención inmediata, curación o analgesia administrada.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Manejo y Plan a Alta</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Se realiza lavado y sutura de herida en antebrazo (3 puntos simples). Se receta analgesia oral y cobertura antibiótica tópica. Alta médica..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'trauma_mechanism' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Mecanismo de Trauma</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Cinemática del accidente y descripción del evento lesivo.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Detalles del Mecanismo y Síntomas</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Caída de propia altura con apoyo sobre mano extendida. Refiere dolor agudo 8/10 y limitación funcional..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'trauma_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Lesiones y Examen Físico</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Hallazgos objetivos, deformidades y estado neurovascular distal.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos / Solicitud de Imágenes</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="Deformidad evidente en muñeca en «dorso de tenedor». Pulsos distales presentes. Sensibilidad conservada. Se solicita Rx en dos proyecciones..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'cardio_abcd' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Inicial ABCD</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Vía aérea, respiración, circulación y déficit neurológico según protocolos vitales.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos y Constantes Críticas</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="A: Vía aérea permeable. B: Taquipneico a 28 rpm. C: Pulso filiforme 130 lpm, hipotenso 80/50. D: Glasgow 12 (O3, V4, M5)..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'cardio_intervention' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Intervención de Emergencia Vital</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Procedimientos de reanimación o estabilización hemodinámica/respiratoria realizados.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Tratamiento y Plan de Derivación</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Se instalan 2 VVP de grueso calibre. Reanimación con hídricos a chorro. Oxígeno por mascarilla de reservorio. Se activa código azul..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'ic_reason' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Motivo y Contexto de la Interconsulta</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Pregunta clínica específica y revisión de los antecedentes entregados por el servicio base.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Análisis de la Interconsulta Solicitada</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Paciente ingresado por servicio de Medicina Interna. Se solicita IC a Cardiología por hallazgo de soplo sistólico en evaluación preparatoria..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'ic_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Opinión y Recomendaciones al Servicio</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Conclusión de la especialidad y manejo sugerido al médico tratante.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Sugerencias y Plan</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Al examen: soplo meso-sistólico foco aórtico III/VI. No requiere intervención aguda. Se sugiere completar Ecocardiograma y alta con seguimiento ambulatorio por nuestra especialidad..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Cardiología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'cardio_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Cardiovascular</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Físico Cardiovascular</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.thorax.notes')} placeholder="Ruidos cardíacos rítmicos, regulares. Presencia de soplo sistólico grado III/VI..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'cardio_tests' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Revisión de EKG y Pruebas Hemodinámicas</FieldLabel>
                                                                            <Textarea {...form.register('imagingExams')} placeholder="EKG: Ritmo sinusal, FC 75 lpm, eje normal. Sin alteraciones isquémicas agudas..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Neurología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'neuro_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Neurológica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Neurológico General (Glasgow, Reflejos)</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.neurological.notes')} placeholder="Glasgow 15/15. Pupilas isocóricas fotorreactivas. Reflejos osteotendinosos simétricos..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'neuro_specific' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos Específicos Adicionales</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Ausencia de signos meníngeos. No hay déficit motor sensitivo aparente..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Neumología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'pulm_status' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Estado Respiratorio y Ventilación</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Físico Pulmonar</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.thorax.notes')} placeholder="Murmullo vesicular conservado, presencia de sibilancias espiratorias bilaterales..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'pulm_images' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Interpretación de Imágenes/Espirometría</FieldLabel>
                                                                            <Textarea {...form.register('imagingExams')} placeholder="Rx Tórax: Infiltrados intersticiales basales. Patrón sugestivo de..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Gastroenterología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'gastro_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Digestiva y Hepática</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Abdominal</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.abdomen.notes')} placeholder="Abdomen blando, depresible, no doloroso, Murphy negativo..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'gastro_specific' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Correlación Clínica y Endoscópica</FieldLabel>
                                                                            <Textarea {...form.register('imagingExams')} placeholder="Endoscopia digestiva alta reporta eritema gástrico difuso severo..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Nefrología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'nephro_status' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Estado Renal y Hemodinámico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Correlación Electrolítica y TFG</FieldLabel>
                                                                            <Textarea {...form.register('laboratoryExams')} placeholder="Creatinina basal 1.2 mg/dL con elevación aguda a 2.5 mg/dL. Electrolitos post-diálise..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Personalized Opinions (Interconsultations) ─ */}
                                                                {profile.steps[wizardStep]?.key === 'cardio_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Bacteriológico / Cardiológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Conclusión y Conducta Cardiológica</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Bajo riesgo quirúrgico cardiovascular. Se sugiere suspender ARA-II 24h previas. Continuar estatinas..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'neuro_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Neurológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Manejo y Plan Neurológico</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="No hay evidencia actual de focalización motora. Sugiero TAC Simple de cráneo y control ambulatorio..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'pulm_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Neumológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan Ventilatorio y Sugerencias</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Patrón obstructivo reversible. Iniciar biterapia inhalatoria. Optimizar destete ventilatorio según gases..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'gastro_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Gastroenterológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Manejo Digestivo / Hepático</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Riesgo moderado de sangrado por varices. Mantener IBP a doble dosis y programar endoscopia electiva..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'nephro_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Nefrológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Ajuste de Filtrado y Manejo de Fluidos</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Ajustar todas las dosis de antibióticos a TFG < 30ml/min. Restricción hídrica de 800cc dia..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Endocrinología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'endo_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Metabólica y Glicémica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Parámetros Endocrinológicos</FieldLabel>
                                                                            <Textarea {...form.register('laboratoryExams')} placeholder="HbA1c 9.5%, glucosa capilar periescala 250mg/dL. TSH inhibida..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'endo_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Endocrinológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Ajustes Basal-Bolo u Hormonales</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Suspender antidiabéticos orales. Iniciar esquema insulina basal-bolo (Glargina 15 U noche + corrección rápida)..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Hematología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'hemato_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Hematológica y Coagulación</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Frotis y Laboratorios Hematológicos</FieldLabel>
                                                                            <Textarea {...form.register('laboratoryExams')} placeholder="Hb 7g/dL, VCM 72 fL (microcítica hipocrómica). Plaquetas 90,000. Tiempos prolongados..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'hemato_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Hematológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Manejo Hemoderivados / Hierro</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Anemia ferropénica severa. Sugiero transfusión de 2 CH prequirúrgicos y suplementación endovenosa de hierro..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Infectología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'infecto_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación de Foco Infeccioso / Sepsis</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Cultivos y Hallazgos Clínicos</FieldLabel>
                                                                            <Textarea {...form.register('laboratoryExams')} placeholder="Hemocultivo 1/2 reporta cocos gram positivos (SAMR). Foco primario probable en catéter venoso central..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'infecto_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Infectológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Escalamiento / Desescalamiento Antimicrobiano</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Retirar CVC inmediatamente. Iniciar Vancomicina IV ajustada por nivel valle. Duración estimada 14 días..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Reumatología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'rheuma_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Inmunológica / Articular</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Físico y Autoanticuerpos</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.extremities.notes')} placeholder="Artritis activa en MCF bilaterales y carpos. ANA 1:320 patrón moteado, Anti-CCP positivo..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'rheuma_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Reumatológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan Inmunosupresor o Biolóigo</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Brote agudo de Artritis Reumatoide. Iniciar puenteo con corticoides a 0.5mg/kg e introducir Metotrexato..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Oncología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'onco_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Oncológica (Estadificación)</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Sospecha Diagnóstica o Complicación</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Paciente con Ca. Mama Estadio III. Presenta síndrome de compresión medular secundario a mets vertebrales..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'onco_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Oncológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan Terapéutico o Cuidados Paliativos</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Dexametasona dosis altas iniciadas. Se solicitará Radioterapia urgente paleativa. Pronóstico reservado..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Dermatología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'derm_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Dermatológica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Descripción de Lesiones / Dermatoscopia</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.skin.notes')} placeholder="Placas eritemato-descamativas en superficies extensoras sugerentes de psoriasis. Ausencia de compromiso ungueal..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'derm_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Dermatológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan Dermatológico / Tópico</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Piel: Iniciar corticoides tópicos de alta potencia, evitar irritantes..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Oftalmología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'ophtha_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Oftalmológica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Agudeza Visual y Fondo de Ojo</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.headNeck.notes')} placeholder="OD: 20/40, OI: 20/20. Fondo de ojo evidencia retinopatía diabética no proliferativa leve en ambos ojos..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'ophtha_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Oftalmológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Manejo Visual y Recomendaciones</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Control de glucemia estricto, lubricantes oculares PRN, cita de revisión en 6 meses..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Otorrinolaringología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'ent_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación ORL</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Otoscopia / Rinoscopia / Orofaringe</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.headNeck.notes')} placeholder="Membranas timpánicas íntegras, cornetes hipertróficos con rinorrea hialina, amígdalas grado II sin exudado..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'ent_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Otorrinolaringológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan Quirúrgico o Médico ORL</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Lavados nasales, corticoide intranasal por 1 mes y valorar septoplastia si no hay mejoría..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Urología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'uro_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Urológica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Signos Genitourinarios y Tacto Rectal</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.abdomen.notes')} placeholder="Tracto urinario normal. Tacto rectal: próstata grado II, adenomatosa, sin nódulos pétreos. Globo vesical (-)..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'uro_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Urológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan Terapéutico Urológico</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="HBP sintomática. Iniciar Tamsulosina 0.4mg/día, solicitar USG vías urinarias de control..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Traumatología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'ortho_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Ortopédica / Funcional</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Arcos de Movilidad y Fuerzas</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.extremities.notes')} placeholder="Limitación de 30° a la flexión de rodilla HD. Derrame articular moderado. Signo del témpano (+)..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'ortho_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Traumatológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan Ortopédico / Rehabilitación</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Artrocentesis diagnóstica/terapéutica y vendaje compresivo. Iniciar fisioterapia precoz..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Psiquiatría Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'psych_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Mental Básica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Estado Mental y Riesgo Suicida</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.neurological.notes')} placeholder="Paciente alerta, orientado. Afecto depresivo, ideación suicida estructurada negada. Ansiedad moderada..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'psych_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Psiquiátrico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Ajuste de Psicofármacos / Conducta</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Episodio depresivo mayor moderado. Iniciar Sertralina 50mg/día. Consejería de apoyo. Control en 4 semanas..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Geriatría Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'geriatric_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Valoración Geriátrica Integral</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Funcionalidad y Síndromes Geriátricos</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.neurological.notes')} placeholder="Dependiente para AVD (Barthel 40/100). Síndrome de fragilidad presente. Polifarmacia (7 medicamentos)..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'geriatric_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Geriátrico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan Manejo / Desprescripción</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Desprescribir Benzodiazepinas gradualmente. Terapia física para prevención de caídas. Ajuste de antihipertensivos..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Ginecología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'gyn_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Ginecológica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Pélvico / Ecográfico</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.abdomen.notes')} placeholder="Útero A-V, volumen normal. Anexos sin masas palpables. Especuloscopia: cérvix de aspecto sano, leucorrea fisiológica..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'gyn_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Ginecológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Conducta Quirúrgica / Médica</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Miomatosis uterina asintomática. Conducta expectante. Ecografía transvaginal control en 1 año. Toma de PAP vigente normal..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Cirugía Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'surgery_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Prequirúrgica o Abdominal</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Físico Específico</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.abdomen.notes')} placeholder="Abdomen blando, depresible. Defecto herniario umbilical reducible de 2cm, no doloroso. Sin signos de irritación peritoneal..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'surgery_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Quirúrgico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Conducta / Plan Operatorios</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Hernia umbilical sintomática pequeña. Se programa para herniorrafia umbilical programada. Solicitar prequirúrgicos..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Alergología Interconsulta ─ */}
                                                                {profile.steps[wizardStep]?.key === 'allergy_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen Dermatológico / Respiratorio</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Hallazgos y Pruebas Cutáneas</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.skin.notes')} placeholder="Habones eritematosos pruriginosos diseminados. Angioedema palpebral leve. Sin compromiso de vía aérea. Prick Test (pendiente)..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'allergy_opinion' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Concepto Alergológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Manejo Antihistamínico / Preventivo</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Urticaria aguda por alérgeno alimentario sospechoso. Antihistamínico H1 2da gen c/12h x 5 días. Corticoide sistémico dosis baja. Evitar camarones..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Segunda Opinión: Oncología ─ */}
                                                                {profile.steps[wizardStep]?.key === 'sec_onco_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Revisión Oncológica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Análisis de Biopsias y Estadificación Previa</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Paciente con reporte de patología (Fecha) compatible con Adenocarcinoma. Inmunohistoquímica: ER(+), PR(+), HER2(-). PET-CT muestra..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sec_onco_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Opinión de Manejo Oncológico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Sugerencias y Plan Terapéutico</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="De acuerdo con el diagnóstico actual. Sugiero añadir terapia endocrina adyuvante. No considero criterio absoluto para radioterapia en este estadio..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Segunda Opinión: Neurología ─ */}
                                                                {profile.steps[wizardStep]?.key === 'sec_neuro_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Revisión Neurológica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Análisis de Electroencefalograma e Imágenes</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Revisión de RNM cerebral simple y contrastada (Fecha): Foco epileptogénico temporal derecho... EEG prolongado muestra..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sec_neuro_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Alternativas Neurológicas</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Sugerencias de Manejo Neurológico</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Epilepsia focal estructural refractaria. Considerar evaluación por neurocirugía funcional o rotación a biterapia con Levetiracetam + brivaracetam..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Segunda Opinión: Cirugía ─ */}
                                                                {profile.steps[wizardStep]?.key === 'sec_surg_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación Quirúrgica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Análisis del Caso y Pruebas Anatómicas</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Paciente programado para laminectomía L4-L5. TAC de columna evidencia canal estrecho focal pero con estabilidad biomecánica conservada..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sec_surg_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Alternativas Quirúrgicas</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Opinión sobre Abordaje Quirúrgico</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Sugiero intentar bloqueo peridural facetario y programa de estabilización lumbar antes de considerar la artrodesis, dado el bajo grado de listesis..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Segunda Opinión: Cardiología ─ */}
                                                                {profile.steps[wizardStep]?.key === 'sec_cardio_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Revisión Cardiológica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Análisis de Ecocardiograma y Holter</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Fracción de Eyección (FEVI) del 35%, sin mejoría tras 3 meses de terapia médica óptima. Holter de 24h documenta 3 episodios de TVNS..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sec_cardio_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Opinión Cardiovascular</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Estrategia Cardiológica Sugerida</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Cumple indicación clase I para implante de Cardiodesfibrilador Implantable (CDI) como prevención primaria. Se autoriza programación del dispositivo..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Segunda Opinión: Enfermedades Raras / Genética ─ */}
                                                                {profile.steps[wizardStep]?.key === 'sec_rare_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Análisis de Síndrome Atípico</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Análisis de Pruebas Genéticas o Metabólicas</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Estudio de exoma clínico completo reporta variante VUS en gen X. Fenotipo clínico mixto compatible parcialmente con síndrome Y..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sec_rare_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Orientación Genética / Rara</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Sugerencias y Consejo Genético</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="No se puede establecer diagnóstico concluyente aún. Sugerimos prueba de segregación familiar (panel a ambos padres) y reevaluación metabólica en 6 meses..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Segunda Opinión: Dolor ─ */}
                                                                {profile.steps[wizardStep]?.key === 'sec_pain_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación del Dolor Refractario</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Historial Analgésico y Escalas de Dolor</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Dolor neuropático post-herpético. EVA 8/10 persistente a pesar de uso dual de Pregabalina 300mg/día y Duloxetina 60mg/día por 8 semanas..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sec_pain_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Estrategia Analgésica</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Alternativas para Manejo del Dolor</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Falla terapéutica oral. Sugiero aplicar parches de Lidocaína al 5% tópica como coadyuvante y programar bloqueo simpático o infiltración intercostal guiada..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Segunda Opinión: Fertilidad ─ */}
                                                                {profile.steps[wizardStep]?.key === 'sec_fertility_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Revisión Reproductiva</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Análisis Embrionario y Hormonal</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Pareja con 2 intentos fallidos de FIV previos (Baja reserva ovárica + Teratozoospermia leve). Niveles de AMH 0.4 ng/mL..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sec_fertility_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Opciones de Fertilidad</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Opinión sobre Pronóstico Reproductivo</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Pronóstico reservado con óvulos propios. Se discute detalladamente la alternativa de ovodonación. Sugerimos ICSI con selección espermática PICSI en próximo ciclo..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Segunda Opinión: Ortopedia ─ */}
                                                                {profile.steps[wizardStep]?.key === 'sec_ortho_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Revisión Ortopédica / Deportiva</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Análisis de Pruebas de Imagen y Estabilidad</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="RMN de rodilla derecha muestra lesión compleja del menisco interno y desgaste condral grado III. Paciente deportista de alto impacto..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sec_ortho_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Alternativas Ortopédicas</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Sugerencias Quirúrgicas o Conservadoras</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Evitar artroscopia de primera línea dado el daño condral asociado. Sugiero iniciar visosuplementación con ácido hialurónico intraarticular y adaptar la descarga deportiva por 3 meses..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Segunda Opinión: Clínica General ─ */}
                                                                {profile.steps[wizardStep]?.key === 'sec_general_assessment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Revisión Clínica Integral</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Antecedentes, Polifarmacia y Diagnósticos Previos</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Paciente evaluado por fatiga crónica inespecífica, refiriendo diagnóstico previo de 'sensibilidad química múltiple'. Exámenes de laboratorios básicos normales..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'sec_general_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Sugerencias Médicas de Segunda Opinión</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Análisis Crítico y Planes Alternativos</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Sugiero reevaluar bajo la óptica de un Síndrome de Fatiga Crónica / EM. Retirar los 3 neuromoduladores actuales que pueden estar empeorando el letargo. Derivación holística..." rows={6} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: telemed_triage ─ */}
                                                                {profile.steps[wizardStep]?.key === 'telemed_triage' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 mb-2">
                                                                            <Search className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                                                            <p className="text-xs text-primary font-medium">Triaje Remoto: Enfoque en banderas rojas y síntomas generales de resolución rápida (no emergencias).</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Relato y Síntomas Remotos</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Paciente estable hemodinámicamente, refiere dolor tipo cólico... Sin signos de alarma." rows={5} className="resize-none" />
                                                                        </Field>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Renovación de Receta / Actualización</FieldLabel>
                                                                            <Textarea {...form.register('currentMedications')} placeholder="Medicamentos actuales reportados para continuidad de tratamiento..." rows={3} className="resize-none" />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: followup_status ─ */}
                                                                {profile.steps[wizardStep]?.key === 'followup_status' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Estado Actual del Tratamiento</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Evalúe cómo evolucionó el paciente desde la última visita.</p>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Estado General</FieldLabel>
                                                                                <Select onValueChange={(v) => form.setValue('currentIllness.status', v)}>
                                                                                    <SelectTrigger><SelectValue placeholder="Estado clínico" /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="Mejorado">Mejorado</SelectItem>
                                                                                        <SelectItem value="Estable">Estable</SelectItem>
                                                                                        <SelectItem value="Sin cambios">Sin cambios</SelectItem>
                                                                                        <SelectItem value="Empeorado">Empeorado</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </Field>
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Adherencia al tratamiento</FieldLabel>
                                                                                <Select onValueChange={(v) => form.setValue('currentIllness.adherence', v)}>
                                                                                    <SelectTrigger><SelectValue placeholder="Adherencia" /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="Completa">Completa</SelectItem>
                                                                                        <SelectItem value="Parcial">Parcial</SelectItem>
                                                                                        <SelectItem value="Nula">Nula</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </Field>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Notas de seguimiento</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Cambios desde la última consulta, efectos secundarios, respuesta al tratamiento..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: followup_changes ─ */}
                                                                {profile.steps[wizardStep]?.key === 'followup_changes' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">¿Hubo cambios desde la última visita?</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Solo si aplica, actualice información de alergias, médicos tratantes u otras novedades.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Nueva alergia o cambio en alergias</FieldLabel>
                                                                            <Textarea {...form.register('knownAllergies')} placeholder="Deje en blanco si no hubo cambios..." rows={3} disabled={!selectedPatient} />
                                                                        </Field>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Cambios en hábitos</FieldLabel>
                                                                            <Textarea {...form.register('habitsHistory')} placeholder="Deje en blanco si no hubo cambios..." rows={3} disabled={!selectedPatient} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: postop_status ─ */}
                                                                {profile.steps[wizardStep]?.key === 'postop_status' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evolución Postoperatoria</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Evalúe el dolor y el estado general del paciente tras la cirugía.</p>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Escala de Dolor (EVA)</FieldLabel>
                                                                                <Select onValueChange={(v) => form.setValue('currentIllness.severity', v)}>
                                                                                    <SelectTrigger><SelectValue placeholder="Severidad" /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="Leve (1-3)">Leve (1-3)</SelectItem>
                                                                                        <SelectItem value="Moderada (4-7)">Moderada (4-7)</SelectItem>
                                                                                        <SelectItem value="Severa (8-10)">Severa (8-10)</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </Field>
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Estado Funcional / Movilidad</FieldLabel>
                                                                                <Input {...form.register('currentIllness.status')} placeholder="Ej. Deambulación asistida..." />
                                                                            </Field>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Síntomas Actuales</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Fiebre, náuseas, tolerancia a la vía oral..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: postop_wound ─ */}
                                                                {profile.steps[wizardStep]?.key === 'postop_wound' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Estado de la Herida y Drenajes</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Detalle el aspecto de la herida quirúrgica y el manejo de drenajes/sondas.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Aspecto de la Herida (Examen Físico)</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam')} placeholder="Herida limpia, bordes afrontados, sin signos de flogosis. Se realiza curación..." rows={5} />
                                                                        </Field>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan y Conducta (Suturas / Drenajes)</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Se retiran puntos alternos. Cita control en 7 días..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: exam_results ─ */}
                                                                {profile.steps[wizardStep]?.key === 'exam_results' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Revisión Paraclínica</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registre los hallazgos relevantes de los laboratorios o estudios de imagen traídos.</p>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Laboratorios</FieldLabel>
                                                                                <Textarea {...form.register('laboratoryExams')} placeholder="Hemograma, Glicemia, Perfil Lipídico..." rows={6} />
                                                                            </Field>
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Imágenes / Otros</FieldLabel>
                                                                                <Textarea {...form.register('imagingExams')} placeholder="Rayos X, Ecografías, EKG..." rows={6} />
                                                                            </Field>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: exam_conduct ─ */}
                                                                {profile.steps[wizardStep]?.key === 'exam_conduct' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Conducta Médica</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Correlación clínica y ajuste del plan de tratamiento basado en los resultados.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Análisis / Correlación Clínica</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Resultados dentro de límites normales, correlacionan con mejoría clínica..." rows={3} />
                                                                        </Field>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Ajuste de Tratamiento y Plan</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Se ajusta dosis de antihipertensivo. Mantener pautas nutricionales..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Seguimiento Psiquiátrico ─ */}
                                                                {profile.steps[wizardStep]?.key === 'psych_status' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evolución Mental</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Estado de ánimo, afecto y comportamiento actual.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Mental y Estado Emocional</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Ánimo estable, sin ideación autolítica..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'meds_tolerance' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Tolerancia a Medicación</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Efectos Adversos o Tolerancia</FieldLabel>
                                                                            <Textarea {...form.register('pastConditions')} placeholder="Paciente refiere somnolencia diurna leve, sin otros efectos..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'psych_adjustments' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Ajuste de Tratamiento</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Ajustar dosis nocturna. Mantener psicoterapia..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Clínica de Heridas ─ */}
                                                                {profile.steps[wizardStep]?.key === 'wound_evolution' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Examen de Herida</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Descripción de la Herida (Piel)</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.skin.notes')} placeholder="Bordes afrontados, sin eritema ni secreción..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'wound_treatment' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan de Curación</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Limpieza con suero fisiológico, aplicación de hidrogel..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Seguimiento Pediátrico ─ */}
                                                                {profile.steps[wizardStep]?.key === 'peds_history' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Alimentación y Hábitos</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Lactancia, alimentación o sueño</FieldLabel>
                                                                            <Textarea {...form.register('habitsHistory')} placeholder="Lactancia materna exclusiva, duerme 12h diarias..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'peds_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Físico Integral</FieldLabel>
                                                                            <Textarea {...form.register('reviewOfSystems')} placeholder="Activo, reactivo, fontanela normotensa..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'peds_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Indicaciones y Vacunas</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Administrar vacunas de 2 meses. Control en 1 mes..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Seguimiento Rehabilitación ─ */}
                                                                {profile.steps[wizardStep]?.key === 'rehab_progress' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Progreso Motor</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Evolución de dolor y función</FieldLabel>
                                                                            <Textarea {...form.register('evolutionNote')} placeholder="Refiere disminución del dolor EVA 3/10..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'rehab_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Rangos de Movimiento (Extremidades)</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.extremities.notes')} placeholder="Flexión rodilla 90°, extensión completa..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'rehab_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan Terapéutico</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Continuar calor local y estiramientos..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Steps: Control Prenatal ─ */}
                                                                {profile.steps[wizardStep]?.key === 'maternal_exam' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Estado Materno</h3>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Examen Físico Materno / Abdomen</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.abdomen.notes')} placeholder="Altura Uterina 30cm, dinámica uterina negativa..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'fetal_monitoring' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Bienestar Fetal (Pelvis/Genitourinario)</FieldLabel>
                                                                            <Textarea {...form.register('physicalExam.pelvis.notes')} placeholder="Frecuencia Cardíaca Fetal: 145 lpm, movimientos presentes..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                                {profile.steps[wizardStep]?.key === 'prenatal_plan' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Plan Obstétrico</FieldLabel>
                                                                            <Textarea {...form.register('treatmentPlan')} placeholder="Continuar vitaminas prenatales, eco control en 2 semanas..." rows={5} />
                                                                        </Field>
                                                                    </div>
                                                                )}



                                                                {/* ─ Step: emergency_reason ─ */}
                                                                {profile.steps[wizardStep]?.key === 'emergency_reason' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-2">
                                                                            <Zap className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                                                                            <p className="text-xs text-destructive font-medium">Modo de acceso rápido: Solo los campos mínimos necesarios para la atención de urgencia.</p>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Tiempo desde inicio</FieldLabel>
                                                                                <InputGroup>
                                                                                    <InputGroupInput type="number" placeholder="Ej: 2" {...form.register('currentIllness.timeAmount')} />
                                                                                    <Select onValueChange={(val) => form.setValue('currentIllness.timeUnit', val)}>
                                                                                        <SelectTrigger className="w-[110px]"><SelectValue placeholder="Unidad" /></SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="minutos">Min</SelectItem>
                                                                                            <SelectItem value="horas">Horas</SelectItem>
                                                                                            <SelectItem value="días">Días</SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </InputGroup>
                                                                            </Field>
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Severidad</FieldLabel>
                                                                                <Select onValueChange={(v) => form.setValue('currentIllness.severity', v)}>
                                                                                    <SelectTrigger><SelectValue placeholder="Escala de severidad" /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="Leve (1-3)">Leve (1-3)</SelectItem>
                                                                                        <SelectItem value="Moderada (4-7)">Moderada (4-7)</SelectItem>
                                                                                        <SelectItem value="Severa (8-10)">Severa (8-10)</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </Field>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Descripción de la urgencia</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Descripción rápida del episodio..." rows={4} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: preventive_state ─ */}
                                                                {profile.steps[wizardStep]?.key === 'preventive_state' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Evaluación de Bienestar y Prevención</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Paciente asintomático. Enfoque en tamizaje y mantenimiento de la salud.</p>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Objetivo de la Evaluación</FieldLabel>
                                                                                <Select onValueChange={(v) => form.setValue('currentIllness.preventiveGoal', v)}>
                                                                                    <SelectTrigger><SelectValue placeholder="Seleccione objetivo" /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="Rutina Anual">Chequeo de Rutina Anual</SelectItem>
                                                                                        <SelectItem value="Certificado Médico">Certificado Médico / Aptitud</SelectItem>
                                                                                        <SelectItem value="Seguimiento Laboral">Evaluación Laboral</SelectItem>
                                                                                        <SelectItem value="Control de Riesgo">Control de Factores de Riesgo</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </Field>
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Última Evaluación Completa</FieldLabel>
                                                                                <Input {...form.register('currentIllness.lastCheckupDate')} placeholder="Ej: Hace 2 años, Oct 2023..." className="text-xs" />
                                                                            </Field>
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Estado Percibido</FieldLabel>
                                                                                <Select onValueChange={(v) => form.setValue('currentIllness.generalState', v)}>
                                                                                    <SelectTrigger><SelectValue placeholder="¿Cómo se siente?" /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="Excelente">Excelente</SelectItem>
                                                                                        <SelectItem value="Bueno">Bueno</SelectItem>
                                                                                        <SelectItem value="Regular">Regular</SelectItem>
                                                                                        <SelectItem value="Malo">Malo</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </Field>
                                                                            <Field>
                                                                                <FieldLabel className="text-xs mb-1.5">Limitaciones en su vida diaria</FieldLabel>
                                                                                <div className="flex items-center gap-3 mt-2 h-[36px]">
                                                                                    <Switch onCheckedChange={(v) => form.setValue('currentIllness.limitations', v)} />
                                                                                    <span className="text-xs text-muted-foreground">Reportas limitaciones físicas</span>
                                                                                </div>
                                                                            </Field>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Preocupaciones o Enfoques Específicos</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.mainConcerns')} placeholder="¿Hay algún aspecto de su salud que le preocupe hoy? (ej: peso, sueño, estrés)..." rows={3} />
                                                                        </Field>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Objetivos de Vida y Salud</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.lifestyleGoals')} placeholder="¿Busca mejorar su dieta, comenzar ejercicio, reducir estrés?..." rows={3} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: proc_description ─ */}
                                                                {profile.steps[wizardStep]?.key === 'proc_description' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Descripción del Procedimiento</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Documente el procedimiento realizado, materiales usados y resultado.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Procedimiento realizado y resultado</FieldLabel>
                                                                            <Textarea {...form.register('currentIllness.notes')} placeholder="Tipo de procedimiento, técnica utilizada, respuesta del paciente, resultado..." rows={8} />
                                                                        </Field>
                                                                    </div>
                                                                )}

                                                                {/* ─ Step: proc_incidents ─ */}
                                                                {profile.steps[wizardStep]?.key === 'proc_incidents' && (
                                                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold mb-1">Incidencias</h3>
                                                                            <p className="text-xs text-muted-foreground mb-4">Registre cualquier complicación, reacción adversa o evento durante el procedimiento.</p>
                                                                        </div>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Alergias o reacciones detectadas</FieldLabel>
                                                                            <Textarea {...form.register('knownAllergies')} placeholder="Deje en blanco si no hubo incidencias..." rows={4} disabled={!selectedPatient} />
                                                                        </Field>
                                                                        <Field>
                                                                            <FieldLabel className="text-xs mb-1.5">Otras notas de incidencia</FieldLabel>
                                                                            <Textarea {...form.register('surgicalHistory')} placeholder="Complicaciones, cambios en el plan, etc..." rows={4} disabled={!selectedPatient} />
                                                                        </Field>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <DialogFooter className="p-6 bg-background border-t border-border/5 flex flex-row items-center justify-between sm:justify-between">
                                                                <Button type="button" variant="ghost" onClick={() => setWizardStep(prev => Math.max(0, prev - 1))} disabled={wizardStep === 0} className="text-muted-foreground">
                                                                    Anterior
                                                                </Button>
                                                                <div className="flex gap-2">
                                                                    <span className="text-xs text-muted-foreground self-center">Paso {wizardStep + 1} de {totalSteps}</span>
                                                                    {!isLastStep ? (
                                                                        <Button type="button" onClick={() => setWizardStep(prev => Math.min(totalSteps - 1, prev + 1))} className="shadow-sm">
                                                                            Siguiente
                                                                        </Button>
                                                                    ) : (
                                                                        <Button type="button" onClick={() => { setIsWizardOpen(false); toast.success('Información completa', { description: 'Datos recopilados con éxito en la historia clínica.' }); }} className="shadow-sm border border-primary text-primary-foreground bg-primary hover:bg-primary/90">
                                                                            <CheckCircle className="w-4 h-4 mr-2" /> Finalizar Asistente
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </DialogFooter>
                                                        </>
                                                    );
                                                })()}
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Conditions & Allergies Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="border-border/10 bg-card/20 backdrop-blur-sm shadow-none">
                                    <CardHeader className="flex flex-row items-center gap-3 border-b border-border/5 bg-muted/5 py-4">
                                        <div className="p-1.5 bg-primary/10 rounded-md">
                                            <Activity className="w-4 h-4 text-primary" />
                                        </div>
                                        <CardTitle className="text-sm font-semibold text-primary/80">Condiciones preexistentes</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="flex flex-wrap gap-2">
                                            {clinicalData.conditions.length > 0
                                                ? clinicalData.conditions.map((c) => (
                                                    <Badge key={c.id} variant="outline" className="border-border/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-tighter">
                                                        {c.code_display}
                                                    </Badge>
                                                ))
                                                : <span className="text-xs text-muted-foreground/40 font-medium">
                                                    {selectedPatient ? 'Sin condiciones registradas' : '—'}
                                                </span>
                                            }
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-sm shadow-none relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-destructive/40"></div>
                                    <CardHeader className="flex flex-row items-center gap-3 border-b border-destructive/10 bg-destructive/5 py-4">
                                        <div className="p-1.5 bg-destructive/10 rounded-md">
                                            <AlertTriangle className="w-4 h-4 text-destructive" />
                                        </div>
                                        <CardTitle className="text-sm font-semibold text-destructive/80">Alergias conocidas</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="flex flex-wrap gap-2">
                                            {clinicalData.allergies.length > 0
                                                ? clinicalData.allergies.map((a) => (
                                                    <Badge key={a.id} variant="pill-danger">
                                                        {a.code_display}
                                                    </Badge>
                                                ))
                                                : <span className="text-xs text-muted-foreground/40 font-medium">
                                                    {selectedPatient ? 'Sin alergias registradas' : '—'}
                                                </span>
                                            }
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <Card className="bg-n-1">
                                    <div className="px-6 pt-5 pb-4 border-b border-n-5/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-b-8/10 rounded-lg">
                                                <Activity className="w-5 h-5 text-b-8" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-bold text-n-11 tracking-tight">Signos Vitales y Exploración</h2>
                                                <p className="text-xs text-n-8 leading-relaxed mt-0.5">Mediciones fisiológicas e informe del examen físico.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="p-8 space-y-10">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6 bg-n-2/50 p-8 rounded-2xl border border-n-5/30">
                                                <VitalInput name="vitals.bpSystolic" label="PA Sistólica (mmHg)" min={60} max={250} register={form.register} disabled={!selectedPatient} />
                                                <VitalInput name="vitals.bpDiastolic" label="PA Diastólica (mmHg)" min={40} max={160} register={form.register} disabled={!selectedPatient} />
                                                <VitalInput name="vitals.heartRate" label="FC (lpm)" min={30} max={250} register={form.register} disabled={!selectedPatient} />
                                                <VitalInput name="vitals.temperature" label="Temp (°C)" min={34} max={43} step={0.1} register={form.register} disabled={!selectedPatient} />
                                                <VitalInput name="vitals.respRate" label="FR (rpm)" min={8} max={60} register={form.register} disabled={!selectedPatient} />
                                                <VitalInput name="vitals.spo2" label="SpO₂ (%)" min={60} max={100} register={form.register} disabled={!selectedPatient} />
                                                <VitalInput name="vitals.weight" label="Peso (kg)" min={1} max={400} step={0.1} register={form.register} disabled={!selectedPatient} />
                                                <VitalInput name="vitals.height" label="Talla (cm)" min={30} max={250} register={form.register} disabled={!selectedPatient} />
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                            <h4 className="text-sm font-semibold text-foreground/80 mb-1">Examen Físico</h4>
                                            <p className="text-xs text-muted-foreground">Registre únicamente los hallazgos positivos (anormales) activando el sistema correspondiente.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            {PHYSICAL_SYSTEMS.map(sys => (
                                                <div key={sys.id} className="p-4 rounded-xl border border-border/10 bg-muted/5 transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-foreground/90">{sys.label}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] uppercase font-bold tracking-wider ${form.watch(`physicalExam.${sys.id}.normal` as const) ? 'text-primary/70' : 'text-amber-500'}`}>
                                                                {form.watch(`physicalExam.${sys.id}.normal` as const) ? 'Normal' : 'Anormal'}
                                                            </span>
                                                            <Controller
                                                                control={form.control}
                                                                name={`physicalExam.${sys.id}.normal` as const}
                                                                render={({ field }) => (
                                                                    <Switch
                                                                        checked={!field.value}
                                                                        onCheckedChange={(checked) => field.onChange(!checked)}
                                                                        disabled={!selectedPatient}
                                                                        className={field.value ? '' : 'bg-amber-500'}
                                                                    />
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                    {!form.watch(`physicalExam.${sys.id}.normal` as const) && (
                                                        <Textarea
                                                            {...form.register(`physicalExam.${sys.id}.notes` as const)}
                                                            placeholder="Describa la anormalidad encontrada..."
                                                            rows={2}
                                                            disabled={!selectedPatient}
                                                            className="text-xs resize-none mt-3 animate-in fade-in slide-in-from-top-2 duration-200 border-amber-500/30 focus-visible:ring-amber-500/20"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-8">

                            {/* AI Scribe Promo */}
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-between shadow-sm backdrop-blur-md">
                                <div className="flex items-center gap-4 text-primary">
                                    <div className="bg-primary/20 p-3 rounded-full animate-pulse">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">AI Clinical Scribe</h4>
                                        <p className="text-xs text-primary/70 font-medium">Transcripción inteligente y autogeneración de nota evolutiva.</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 font-medium text-xs h-8 px-5">
                                    Activar <span className="ml-2 text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">BETA</span>
                                </Button>
                            </div>

                            <Card className="bg-n-1">
                                    <div className="px-6 pt-5 pb-4 border-b border-n-5/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-b-8/10 rounded-lg">
                                                <Stethoscope className="w-5 h-5 text-b-8" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-bold text-n-11 tracking-tight">Evaluación, Diagnóstico y Plan</h2>
                                                <p className="text-xs text-n-8 leading-relaxed mt-0.5">Conclusión clínica, codificación CIE-10 e indicaciones terapéuticas.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="p-8 space-y-12">
                                            <Field>
                                        <FieldLabel className="text-xs font-medium text-muted-foreground mb-2.5">Nota de evolución / Impresión diagnóstica</FieldLabel>
                                        <Textarea
                                            {...form.register("evolutionNote")}
                                            placeholder="Resumen del análisis clínico y razonamiento del diagnóstico…"
                                            rows={6}
                                            disabled={!selectedPatient}
                                            className="resize-none"
                                        />
                                    </Field>
                                        </div>

                                        <div className="space-y-6 pt-2">
                                        <div className="flex justify-between items-center bg-muted/5 p-4 rounded-xl border border-border/5">
                                            <div className="flex items-center gap-2">
                                                <Stethoscope className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-semibold text-foreground/80">Diagnósticos CIE-10</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => appendDiagnosis({ code: '', description: '', type: 'other' })}
                                                disabled={!selectedPatient}
                                                className="gap-2 h-8 text-xs font-medium border-primary/20 text-primary hover:bg-primary/10"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Agregar Código
                                            </Button>
                                        </div>

                                        <div className="space-y-4 bg-muted/5 p-6 rounded-2xl border border-border/10">
                                            {diagnosesFields.length === 0 && (
                                                <div className="bg-background/40 p-1.5 rounded-xl border border-border/10 focus-within:border-primary/40 transition-all">
                                                    <Controller
                                                        control={form.control}
                                                        name="diagnoses"
                                                        render={() => (
                                                            <DiagnosisSearch
                                                                id="diagnosis-initial"
                                                                label=""
                                                                placeholder="Busque por código o nombre (ej: J01.9)..."
                                                                value=""
                                                                onChange={val => {
                                                                    const [code, ...descParts] = val.split(' — ');
                                                                    const desc = descParts.join(' — ');
                                                                    if (code && desc) {
                                                                        appendDiagnosis({ code, description: desc, type: 'primary' });
                                                                    }
                                                                }}
                                                                disabled={!selectedPatient}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            )}

                                            {diagnosesFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-4 items-end bg-background/40 p-5 rounded-2xl border border-border/10 shadow-sm relative group animate-in slide-in-from-left-2 duration-200">
                                                    <div className="flex-1">
                                                        <Controller
                                                            control={form.control}
                                                            name={`diagnoses.${index}.code`}
                                                            render={() => (
                                                                <DiagnosisSearch
                                                                    id={`diagnosis-${index}`}
                                                                    label={index === 0 ? "Diagnóstico principal" : `Relacionado #${index}`}
                                                                    placeholder="CIE-10..."
                                                                    value={`${form.watch(`diagnoses.${index}.code`)}${form.watch(`diagnoses.${index}.description`) ? ' — ' + form.watch(`diagnoses.${index}.description`) : ''}`}
                                                                    onChange={val => {
                                                                        const [code, ...descParts] = val.split(' — ');
                                                                        const desc = descParts.join(' — ');
                                                                        form.setValue(`diagnoses.${index}.code`, code);
                                                                        form.setValue(`diagnoses.${index}.description`, desc);
                                                                    }}
                                                                    disabled={!selectedPatient}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0 rounded-xl"
                                                            onClick={() => removeDiagnosis(index)}
                                                            title="Quitar"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Field className="pt-4">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <FieldLabel className="text-xs font-medium text-muted-foreground m-0">Plan terapéutico e indicaciones</FieldLabel>
                                            <Select onValueChange={(val) => {
                                                const kit = KITS_OF_ORDERS.find(k => k.id === val);
                                                if (kit) {
                                                    const currentPlan = form.getValues('treatmentPlan');
                                                    const newPlan = currentPlan ? `${currentPlan}\n\n=== ${kit.label} ===\n${kit.content}` : `=== ${kit.label} ===\n${kit.content}`;
                                                    form.setValue('treatmentPlan', newPlan);
                                                    toast.success('Kit aplicado', { description: `Se ha insertado el kit: ${kit.label}` });
                                                }
                                            }} disabled={!selectedPatient}>
                                                <SelectTrigger className="w-[200px] h-8 text-xs bg-primary/5 border-primary/20 text-primary">
                                                    <SelectValue placeholder="Aplicar Kit de Órdenes..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {KITS_OF_ORDERS.map(kit => (
                                                        <SelectItem key={kit.id} value={kit.id} className="text-xs">{kit.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Textarea
                                            {...form.register("treatmentPlan")}
                                            placeholder="Medicamentos, dosis, estudios solicitados, próxima cita…"
                                            rows={6}
                                            disabled={!selectedPatient}
                                            className="resize-none min-h-[160px]"
                                        />
                                    </Field>

                                    <div className="pt-8 border-t border-border/5">
                                        <div className="flex flex-wrap gap-3" role="group" aria-label="Acciones rápidas">
                                            {['Generar Receta', 'Orden de Laboratorios', 'Certificado Médico', 'Referencia'].map(action => (
                                                <Button key={action} variant="outline" size="sm" disabled={!selectedPatient} className="bg-background/5 hover:bg-primary/10 hover:text-primary border-border/10 hover:border-primary/30 transition-all font-medium text-xs h-8 px-4">
                                                    {action}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </fieldset>

                    {isReadOnly && activeEncounterId && (
                        <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto px-6 py-6 pb-24">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50">Notas Evolutivas</span>
                            <div className="flex-1 h-px bg-border/40" />
                        </div>
                            <div className="space-y-6">
                                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                                    <Shield className="w-4 h-4 text-amber-600" />
                                    <AlertTitle className="text-sm font-bold">Registro Permanente</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        Este acto médico ha sido finalizado y firmado. No es posible editar la nota original, pero puede añadir aclaraciones o información complementaria mediante una <b>Addenda</b>.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold flex items-center gap-2">
                                            <ClipboardList className="w-4 h-4 text-primary" /> Historial de Addendas
                                        </h3>
                                        {!isAddingAddendum && (
                                            <Button size="sm" onClick={() => setIsAddingAddendum(true)} className="gap-2">
                                                <Plus className="w-4 h-4" /> Nueva Addenda
                                            </Button>
                                        )}
                                    </div>

                                    {isAddingAddendum && (
                                        <Card className="border-amber-200 bg-amber-50/30 overflow-hidden shadow-sm animate-in zoom-in-95 duration-200">
                                            <CardHeader className="p-4 border-b border-amber-100 bg-amber-50">
                                                <CardTitle className="text-xs font-bold text-amber-900 uppercase tracking-wider">Nueva Nota Aclaratoria</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 space-y-4">
                                                <Textarea 
                                                    value={newAddendumContent}
                                                    onChange={(e) => setNewAddendumContent(e.target.value)}
                                                    placeholder="Escriba la información complementaria aquí..."
                                                    className="resize-none min-h-[120px] bg-white border-amber-200 focus:ring-amber-500"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setIsAddingAddendum(false)} disabled={isSavingAddendum}>Cancelar</Button>
                                                    <Button size="sm" onClick={handleAddAddendum} disabled={isSavingAddendum || !newAddendumContent.trim()} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                                                        {isSavingAddendum ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                        Guardar Addenda
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <div className="space-y-4">
                                        {addenda.length === 0 && !isAddingAddendum ? (
                                            <div className="text-center py-12 border-2 border-dashed border-muted/20 rounded-2xl bg-muted/5">
                                                <p className="text-sm text-muted-foreground font-medium">No se han registrado addendas para este encuentro.</p>
                                            </div>
                                        ) : (
                                            addenda.map((ad, idx) => (
                                                <Card key={ad.id} className="border-border/10 overflow-hidden shadow-none bg-background/50">
                                                    <CardHeader className="p-4 py-3 bg-muted/10 border-b border-border/5 flex flex-row items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                                {idx + 1}
                                                            </div>
                                                            <span className="text-xs font-bold text-foreground">
                                                                {ad.author?.name_family}, {ad.author?.name_given?.join(' ')}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-muted-foreground">
                                                            {new Date(ad.created_at).toLocaleString('es-ES', { 
                                                                year: 'numeric', month: 'short', day: '2-digit', 
                                                                hour: '2-digit', minute: '2-digit' 
                                                            })}
                                                        </span>
                                                    </CardHeader>
                                                    <CardContent className="p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                                        {ad.content}
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    </PageContainer>
                </div>
            </form>
        </div>
    );
}

