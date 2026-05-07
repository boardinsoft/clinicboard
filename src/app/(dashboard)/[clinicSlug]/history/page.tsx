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
import SubjetivoSection from './sections/SubjetivoSection';
import ObjetivoSection from './sections/ObjetivoSection';
import EvaluacionSection from './sections/EvaluacionSection';
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
            .map(([k, v]) => `${({ headNeck: 'Cabeza y Cuello', thorax: 'Tórax (Cardiopulmonar)', abdomen: 'Abdomen', pelvis: 'Pelvis / Genitourinario', extremities: 'Extremidades', neurological: 'Neurológico', skin: 'Piel y Faneras' } as Record<string,string>)[k] || k}: ${v.notes}`)
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
                                <SubjetivoSection
                                    form={form}
                                    selectedPatient={selectedPatient}
                                    chiefComplaintSelectKey={chiefComplaintSelectKey}
                                    setChiefComplaintSelectKey={setChiefComplaintSelectKey}
                                    isWizardOpen={isWizardOpen}
                                    setIsWizardOpen={setIsWizardOpen}
                                    wizardStep={wizardStep}
                                    setWizardStep={setWizardStep}
                                    familyHistorySelectKey={familyHistorySelectKey}
                                    setFamilyHistorySelectKey={setFamilyHistorySelectKey}
                                />

                            {/* Conditions & Allergies Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="bg-n-1 border border-n-5/30 overflow-hidden">
                                    <div className="px-5 pt-4 pb-3 bg-b-8/5 border-b border-n-5/30">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 bg-b-8/10 rounded-md">
                                                <Activity className="w-4 h-4 text-b-8" />
                                            </div>
                                            <span className="text-sm font-semibold text-n-11">Condiciones preexistentes</span>
                                        </div>
                                    </div>
                                    <CardContent className="p-5">
                                        <div className="flex flex-wrap gap-2">
                                            {clinicalData.conditions.length > 0
                                                ? clinicalData.conditions.map((c) => (
                                                    <Badge key={c.id} variant="outline" className="border-n-5/30 bg-b-8/5 text-b-8 text-[10px] font-bold uppercase tracking-tighter">
                                                        {c.code_display}
                                                    </Badge>
                                                ))
                                                : <span className="text-xs text-n-8 font-medium">
                                                    {selectedPatient ? 'Sin condiciones registradas' : '—'}
                                                </span>
                                            }
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-n-1 border border-destructive/20 overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-destructive/40" />
                                    <div className="px-5 pt-4 pb-3 bg-destructive/5 border-b border-destructive/10">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 bg-destructive/10 rounded-md">
                                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                            </div>
                                            <span className="text-sm font-semibold text-n-11">Alergias conocidas</span>
                                        </div>
                                    </div>
                                    <CardContent className="p-5">
                                        <div className="flex flex-wrap gap-2">
                                            {clinicalData.allergies.length > 0
                                                ? clinicalData.allergies.map((a) => (
                                                    <Badge key={a.id} variant="pill-danger">
                                                        {a.code_display}
                                                    </Badge>
                                                ))
                                                : <span className="text-xs text-n-8 font-medium">
                                                    {selectedPatient ? 'Sin alergias registradas' : '—'}
                                                </span>
                                            }
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <ObjetivoSection
                                form={form}
                                selectedPatient={selectedPatient}
                            />
                        </div>

                        <div className="space-y-8">

                            {/* AI Scribe Promo */}
                            <div className="bg-b-8/5 border border-b-8/20 rounded-xl p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4 text-b-8">
                                    <div className="bg-b-8/20 p-3 rounded-full">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-n-11">AI Clinical Scribe</h4>
                                        <p className="text-xs text-n-8 font-medium">Transcripción inteligente y autogeneración de nota evolutiva.</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="border-n-5/30 text-n-11 hover:bg-n-2 font-medium text-xs h-8 px-5">
                                    Activar <span className="ml-2 text-[8px] bg-b-8 text-n-1 px-1.5 py-0.5 rounded font-bold">BETA</span>
                                </Button>
                            </div>

                        </div>

                        <EvaluacionSection
                            form={form}
                            selectedPatient={selectedPatient}
                            diagnosesFields={diagnosesFields}
                            appendDiagnosis={appendDiagnosis}
                            removeDiagnosis={removeDiagnosis}
                        />
                    </fieldset>

                    {isReadOnly && activeEncounterId && (
                        <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto px-6 py-6 pb-24">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-n-8">Notas Evolutivas</span>
                            <div className="flex-1 h-px bg-n-5/40" />
                        </div>
                            <div className="space-y-6">
                                <Alert className="bg-amber-50/80 border-amber-200/50 text-amber-900">
                                    <Shield className="w-4 h-4 text-amber-500" />
                                    <AlertTitle className="text-sm font-bold text-amber-900">Registro Permanente</AlertTitle>
                                    <AlertDescription className="text-xs text-amber-800">
                                        Este acto médico ha sido finalizado y firmado. No es posible editar la nota original, pero puede añadir aclaraciones o información complementaria mediante una <b>Addenda</b>.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold flex items-center gap-2 text-n-11">
                                            <ClipboardList className="w-4 h-4 text-b-8" /> Historial de Addendas
                                        </h3>
                                        {!isAddingAddendum && (
                                            <Button size="sm" onClick={() => setIsAddingAddendum(true)} className="gap-2">
                                                <Plus className="w-4 h-4" /> Nueva Addenda
                                            </Button>
                                        )}
                                    </div>

                                    {isAddingAddendum && (
                                        <Card className="border-amber-200/50 bg-amber-50/50 overflow-hidden shadow-none animate-in zoom-in-95 duration-200">
                                            <div className="px-4 py-3 border-b border-amber-200/50 bg-amber-50/80">
                                                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Nueva Nota Aclaratoria</span>
                                            </div>
                                            <CardContent className="p-4 space-y-4">
                                                <Textarea 
                                                    value={newAddendumContent}
                                                    onChange={(e) => setNewAddendumContent(e.target.value)}
                                                    placeholder="Escriba la información complementaria aquí..."
                                                    className="resize-none min-h-[120px] bg-n-1 border-n-5/30 focus:ring-amber-500/20"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setIsAddingAddendum(false)} disabled={isSavingAddendum} className="text-n-8 hover:text-n-11">Cancelar</Button>
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
                                            <div className="text-center py-12 border-2 border-dashed border-n-5/20 rounded-xl bg-n-2/30">
                                                <p className="text-sm text-n-8 font-medium">No se han registrado addendas para este encuentro.</p>
                                            </div>
                                        ) : (
                                            addenda.map((ad, idx) => (
                                                <Card key={ad.id} className="border-n-5/30 overflow-hidden shadow-none bg-n-1">
                                                    <div className="px-4 py-3 border-b border-n-5/30 bg-n-2/50 flex flex-row items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-b-8/10 flex items-center justify-center text-[10px] font-bold text-b-8">
                                                                {idx + 1}
                                                            </div>
                                                            <span className="text-xs font-bold text-n-11">
                                                                {ad.author?.name_family}, {ad.author?.name_given?.join(' ')}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-n-8">
                                                            {new Date(ad.created_at).toLocaleString('es-ES', { 
                                                                year: 'numeric', month: 'short', day: '2-digit', 
                                                                hour: '2-digit', minute: '2-digit' 
                                                            })}
                                                        </span>
                                                    </div>
                                                    <CardContent className="p-4 text-sm text-n-11 leading-relaxed whitespace-pre-wrap">
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

