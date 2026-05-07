'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COMMON_FAMILY_HISTORIES = [
    'Cáncer (colon, mama, pulmón)',
    'Diabetes Mellitus tipo 2',
    'Hipertensión arterial',
    'Cardiopatía isquémica',
    'Enfermedad cerebrovascular (EVC)',
    'Asma / EPOC',
    'Obesidad',
    'Dislipidemia / Hipercolesterolemia',
    'Artritis / Artropatías',
    'Enfermedad renal crónica',
    'Hepatopatía crónica',
    'Epilepsia / Trastornos convulsivos',
    'Enfermedades autoinmunes (Lupus, AR, Tiroiditis)',
    'Trastornos mentales (Depresión, Ansiedad, Esquizofrenia)',
    'Deficiencias nutric踹',
    'Malformaciones congénitas',
    'Tromboembolismo venoso (TEV)',
    'Alzheimer / Demencia',
    'Enfermedad de Parkinson',
    'Sordera / Ceguera prematura',
];

type StepContentProps = {
    form: UseFormReturn<any>;
    selectedPatient: { id: string; name_family: string; name_given: string[] | null } | null;
    familyHistorySelectKey?: number;
    setFamilyHistorySelectKey?: React.Dispatch<React.SetStateAction<number>>;
    profileKey?: string;
};

export function Step_illness({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Estado / Enfermedad Actual</h3>
                <p className="text-xs text-n-8 mb-4">Indique la sintomatología y evolución de la molestia.</p>
            </div>
            <Field className="mb-2">
                <FieldLabel className="text-xs mb-1.5 font-medium leading-none text-n-11">Enfermedad Presuntiva / Diagnóstico Inicial</FieldLabel>
                <Textarea {...form.register('currentIllness.suspectedDiagnosis')} placeholder="Busque por CIE-10, enfermedad o escriba manualmente..." rows={3} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Field>
                        <FieldLabel className="text-xs mb-1.5 text-n-8">Tiempo de Evolución</FieldLabel>
                        <div className="flex gap-2">
                            <input type="number" {...form.register('currentIllness.timeAmount')} placeholder="Ej: 3" className="flex-1 bg-n-1 border-n-5/30 rounded-md h-10 px-3 text-sm" />
                            <Select onValueChange={(val: string) => form.setValue('currentIllness.timeUnit' as any, val)}>
                                <SelectTrigger className="w-[110px] bg-n-1 border-n-5/30 rounded-md h-10"><SelectValue placeholder="Unidad" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="horas">Horas</SelectItem>
                                    <SelectItem value="días">Días</SelectItem>
                                    <SelectItem value="semanas">Semanas</SelectItem>
                                    <SelectItem value="meses">Meses</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </Field>
                    <Field>
                        <FieldLabel className="text-xs mb-1.5 text-n-8">Severidad</FieldLabel>
                        <Select onValueChange={(v: string) => form.setValue('currentIllness.severity' as any, v)}>
                            <SelectTrigger className="bg-n-1 border-n-5/30 rounded-md h-10"><SelectValue placeholder="Escala de severidad" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Leve (1-3)">Leve (1-3)</SelectItem>
                                <SelectItem value="Moderada (4-7)">Moderada (4-7)</SelectItem>
                                <SelectItem value="Severa (8-10)">Severa (8-10)</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field>
                        <FieldLabel className="text-xs mb-1.5 text-n-8">Factores que agravan</FieldLabel>
                        <input {...form.register('currentIllness.aggravatingFactors')} placeholder="Agravantes..." className="text-xs bg-n-1 border-n-5/30 rounded-md h-10 px-3 w-full" />
                    </Field>
                </div>
                <Field>
                    <FieldLabel className="text-xs mb-1.5 text-n-8">Aliviantes</FieldLabel>
                    <Textarea {...form.register('currentIllness.alleviatingFactors')} placeholder="Frío, reposo, analgésicos..." rows={2} className="bg-n-1 border-n-5/30 rounded-md" />
                </Field>
            </div>
        </div>
    );
}

export function Step_personal({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Antecedentes Personales Patológicos</h3>
                <p className="text-xs text-n-8 mb-4">Condiciones médicas crónicas e historial de hospitalizaciones.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs font-medium text-n-8 mb-2">Enfermedades y Condiciones Crónicas</FieldLabel>
                <Textarea {...form.register('pastConditions')} placeholder="Hipertensión, diabetes, asma, cardiopatía, hipotiroidismo..." rows={5} disabled={!selectedPatient} className="bg-n-1 border-n-5/30 rounded-md" />
            </Field>
            <Field>
                <FieldLabel className="text-xs font-medium text-n-8 mb-2">Historial de Hospitalizaciones Previas</FieldLabel>
                <Textarea {...form.register('hospitalizationHistory')} placeholder="Indique motivos, fechas aproximadas y tiempo de estancia..." rows={3} disabled={!selectedPatient} className="bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_surgical({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Antecedentes Quirúrgicos</h3>
                <p className="text-xs text-n-8 mb-4">Cirugías pasadas, procedimientos invasivos y anestesia.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs font-medium text-n-8 mb-2">Cirugías y Procedimientos</FieldLabel>
                <Textarea {...form.register('surgicalHistory')} placeholder="Apéndice (2010), Colecistectomía (2018), Cesáreas, etc..." rows={8} disabled={!selectedPatient} className="bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_meds_allergies({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Medicación Actual y Alergias</h3>
                <p className="text-xs text-n-8 mb-4">Registre los medicamentos que toma el paciente y sus alergias conocidas.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs font-medium text-n-8 mb-2">Medicamentos Actuales (Dosis y Frecuencia)</FieldLabel>
                <Textarea {...form.register('currentMedications')} placeholder="Ej: Losartán 50mg (1 vez/día), Metformina 850mg (con cena)..." rows={4} disabled={!selectedPatient} className="bg-n-1 border-n-5/30 rounded-md" />
            </Field>
            <Field>
                <FieldLabel className="text-xs font-medium text-n-8 mb-2 text-destructive">Alergias Conocidas (Medicamentos / Alimentos / Otros)</FieldLabel>
                <Textarea {...form.register('knownAllergies')} placeholder="Penicilina, polen, látex, aines, alimentos, etc..." rows={3} disabled={!selectedPatient} className="bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_family({ form, selectedPatient, familyHistorySelectKey = 0, setFamilyHistorySelectKey }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Antecedentes Familiares</h3>
                <p className="text-xs text-n-8 mb-4">Enfermedades heredofamiliares de relevancia clínica.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs font-medium text-n-8 mb-2">Seleccionar condición familiar genérica</FieldLabel>
                <div className="mb-3">
                    <Select key={familyHistorySelectKey} onValueChange={(val) => {
                        const current = form.getValues('familyHistory') || '';
                        if (current.includes(val)) return;
                        form.setValue('familyHistory', current.trim() + (current.trim() ? ', ' : '') + val, { shouldDirty: true });
                        setFamilyHistorySelectKey?.(k => k + 1);
                    }}>
                        <SelectTrigger className="bg-n-1 border-n-5/30 rounded-md h-10"><SelectValue placeholder="Seleccionar para añadir a la lista..." /></SelectTrigger>
                        <SelectContent>
                            {COMMON_FAMILY_HISTORIES.map((c, idx) => <SelectItem key={idx} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Textarea {...form.register('familyHistory')} placeholder="Cáncer, diabetes, hipertensión familiar..." rows={8} disabled={!selectedPatient} className="bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_habits({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Hábitos / Estilo de Vida</h3>
                <p className="text-xs text-n-8 mb-4">Tabaquismo, alcohol, drogas, dieta o actividad física.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs font-medium text-n-8 mb-2">Descripción de Hábitos</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Fuma 5 cigarrillos al día, bebedor ocasional, sedentarismo..." rows={10} disabled={!selectedPatient} className="bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_review_systems({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Revisión por Sistemas</h3>
                <p className="text-xs text-n-8 mb-4">Interrogatorio para detectar síntomas secundarios.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs font-medium text-n-8 mb-2">Anamnesis por Sistemas</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Respiratorio, Cardiovascular, Gastrointestinal, Genitourinario, Musculoesquelético, Neurológico..." rows={10} disabled={!selectedPatient} className="bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_nutrition_anthropometry({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Antropometría y Mediciones</h3>
                <p className="text-xs text-n-8 mb-4">Ingrese los datos antropométricos iniciales relevantes para la asesoría nutricional.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Masa Corporal y Antropometría</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Peso inicial, talla, % grasa corporal (bioimpedancia), pliegues cutáneos..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_nutrition_diet({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Dietética y R24H</h3>
                <p className="text-xs text-n-8 mb-4">Recordatorio de 24 horas, preferencias, aversiones y suplementación.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Dietética (R24H) y Suplementos</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Desayuno: ... Almuerzo: ... Cena: ... Suplementos: ..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_nutrition_clinical_signs({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Clínico: Signos y Síntomas</h3>
                <p className="text-xs text-n-8 mb-4">Frecuencia de evacuaciones, calidad de sueño, energía y signos físicos (cabello, uñas, piel).</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Evaluación Clínica Nutricional</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Digestión, distensión abdominal, calidad del sueño, fatiga..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_nutrition_biochemical({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Bioquímicos: Exámenes de Laboratorio</h3>
                <p className="text-xs text-n-8 mb-4">Interpretación rápida de analíticas recientes (Glucosa, Perfil Lipídico, Hemograma, etc).</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Resultados y Observaciones Bioquímicas</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Colesterol Total: ... Triglicéridos: ... Glucosa en ayuno: ..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_nutrition_sports_clinical({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Clínico: Rendimiento Deportivo</h3>
                <p className="text-xs text-n-8 mb-4">Metas de desempeño, tipo de entrenamiento, intensidad, recuperación muscular.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Evaluación Deportiva y Metas</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Entrenamiento de fuerza 5x semana. Fatiga post-entreno, calambres..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_nutrition_behavioral_clinical({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Clínico: Comportamiento y Barreras</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación de relación con la comida, barreras para adherencia, estrés emocional.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Evaluación Psicológica Nutricional</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Atracones nocturnos, ansiedad, pensamientos restrictivos..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_psycho_reason({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Motivo de Consulta y Emoción Principal</h3>
                <p className="text-xs text-n-8 mb-4">Explore los motivos emocionales y desencadenantes percibidos.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Exploración de Motivo de Consulta</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Paciente refiere sentirse... Manifiesta ansiedad ante situaciones de..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_psycho_events({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Eventos Estresantes y Patrones de Sueño</h3>
                <p className="text-xs text-n-8 mb-4">Eventos recientes que puedan afectar la estabilidad y calidad del sueño.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Desencadenantes / Somatización / Sueño</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Dificultad para conciliar sueño (insomnio inicial). Eventos recientes: pérdida de empleo..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_psych_symptoms({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Síntomas y Detonantes</h3>
                <p className="text-xs text-n-8 mb-4">Identifique síntomas actuales y posibles factores detonantes.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Síntomas / Detonantes</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Episodios de ansiedad, triggers conocidos..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_psych_biological({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Factores Biológicos</h3>
                <p className="text-xs text-n-8 mb-4">Sueño, dieta y su impacto en el estado mental.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Biológico (Sueño/Dieta)</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Horas de sueño, calidad de dieta..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_psych_interpersonal({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Dinámica Interpersonal</h3>
                <p className="text-xs text-n-8 mb-4">Relaciones familiares, laborales y sociales.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Dinámica Interpersonal</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Relación de pareja, ambiente laboral..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_psych_stress({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Estrés y Comunicación</h3>
                <p className="text-xs text-n-8 mb-4">Mecanismos de afrontamiento y nivel de stress percibido.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Estrés / Comunicación</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Nivel de estrés (0-10), actividades de relajamiento..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_peds_development({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Hitos del Desarrollo Psicomotor</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación de desarrollo motor fino/grueso, lenguaje y área social-adaptativa.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Hitos Alcanzados</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Motor: sostiene cabeza (3m), se sienta solo (6m)... Lenguaje: balbuceos..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_peds_diet_vaccines({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Inmunizaciones y Alimentación</h3>
                <p className="text-xs text-n-8 mb-4">Esquema de vacunación y alimentación complementaria.</p>
            </div>
            <Field className="mb-4">
                <FieldLabel className="text-xs mb-1.5 text-n-8">Esquema de Vacunación</FieldLabel>
                <Textarea {...form.register('pastConditions')} placeholder="Vacunas al día (BCG, Pentavalente, Rotavirus...)" rows={3} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Alimentación Pediátrica</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Lactancia materna exclusiva. Inicio alimentación complementaria con verduras/frutas." rows={3} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_peds_growth({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Crecimiento y Percentiles</h3>
                <p className="text-xs text-n-8 mb-4">Registro de peso, talla, PC y su ubicación en curvas de crecimiento.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Percentiles y Antropometría Pediátrica</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Peso: X kg (pXX). Talla: X cm (pXX). PC: X cm (pXX). Tendencia..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_peds_diet({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Alimentación Pediátrica</h3>
                <p className="text-xs text-n-8 mb-4">Lactancia, fórmulas o ablactación.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Hábitos de Alimentación</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="LME / Fórmula (cantidad/frecuencia). Tolerancia..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_peds_infectious({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Cuadro Infeccioso / Agudo</h3>
                <p className="text-xs text-n-8 mb-4">Días de fiebre, picos máximos, estado de hidratación y apetito.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Historia de la Enfermedad</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Inició hace X días con alza térmica de X°C. Tolerancia intolerancia oral..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_peds_exam_directed({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Examen Físico Dirigido</h3>
                <p className="text-xs text-n-8 mb-4">Oídos, garganta, ruidos pulmonares, signos meníngeos.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Hallazgos Físicos Relevantes</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Orofarínge congestiva, otoscopia con abombamiento, tirajes..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_peds_behavior({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Conducta y Entorno</h3>
                <p className="text-xs text-n-8 mb-4">Rendimiento escolar, comportamiento en casa, alertas del neurodesarrollo.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Conducta y Entorno</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Rendimiento escolar, comportamiento en casa..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_peds_sleep_habits({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Hábitos de Sueño</h3>
                <p className="text-xs text-n-8 mb-4">Patrón de sueño, horas, despertares nocturnos.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Hábitos / Sueño</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Duerme 10-12 hrs con 2 despertares nocturnos..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_wh_cycle({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Ciclo Menstrual y Prevención</h3>
                <p className="text-xs text-n-8 mb-4">Información de regularidad, MAC (Métodos Anticonceptivos) y tamizaje preventivo.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">FUM, Características de Ciclo y Anticoncepción</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="FUM: dd/mm/aaaa. Ciclos de 28/4 días. MAC: ACO combinada. Última citología/PAP: Normal..." rows={7} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
            <Field>
                <FieldLabel className="text-xs font-medium text-n-8 mb-2">Antecedentes Gineco-Obstétricos (AGO)</FieldLabel>
                <Textarea {...form.register('pastConditions')} placeholder="G_P_A_C_, Embarazos previos (complicaciones)..." rows={3} disabled={!selectedPatient} className="bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_wh_preventive({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Prevención Ginecológica</h3>
                <p className="text-xs text-n-8 mb-4">Citología, mamografía, detección de ITS.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Prevención (PAP/Mamo)</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Último PAP: fecha, resultado. Mamografía: fecha, resultado..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_wh_contraception({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Anticoncepción</h3>
                <p className="text-xs text-n-8 mb-4">Métodos anticonceptivos en uso y plan reproductivo.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Anticoncepción</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="MAC actual: ACO, DIU, preservativo. Plan reproductivo: desea embarazos futuros..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_wh_prenatal({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Gestación y Control Prenatal</h3>
                <p className="text-xs text-n-8 mb-4">Edad gestacional, controles, complicaciones del embarazo.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Gestación / Obstétrico</FieldLabel>
                <Textarea {...form.register('pastConditions')} placeholder="EG: X semanas. FUR: dd/mm/aaaa. Controles prenatales: #. Complicaciones..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_wh_maternal_eval({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Evaluación Materna</h3>
                <p className="text-xs text-n-8 mb-4">Estado general, peso, presión arterial, edema.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Evaluación Materna</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Peso: X kg. PA: X/X. Edema: presencia/severidad. Estado general..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_wh_bleeding_pain({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Patrón de Sangrado y Dolor</h3>
                <p className="text-xs text-n-8 mb-4">Características del sangrado menstrual, dismenorrea.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Patrón Sangrado / Dolor</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Sangrado: cantidad, duración, frecuencia. Dismenorrea: intensidad (0-10)..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_wh_endocrinology({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Endocrinología y Exámenes</h3>
                <p className="text-xs text-n-8 mb-4">Hormonas tiroideas, perfil metabólico, exámenes relevantes.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Endocrino / Exámenes</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="TSH: X. T4L: X. Glucosa: X. Perfil lipídico..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_sports_performance({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Rendimiento y Metas Físicas</h3>
                <p className="text-xs text-n-8 mb-4">Frecuencia de entrenamiento y objetivos del paciente.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Rutina y Objetivos</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Entrenamiento cruzado 5 veces/semana. Corrección de gesto deportivo. Aumento masa muscular..." rows={5} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_sports_injuries({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Historial Lesivo</h3>
                <p className="text-xs text-n-8 mb-4">Registro de lesiones previas agudas o por sobreuso que impacten la biomecánica.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Lesiones Previas / Sobreuso</FieldLabel>
                <Textarea {...form.register('pastConditions')} placeholder="Esguince tobillo derecho crónico. Tendinopatía rotuliana leve..." rows={5} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_sports_cardio_risk({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Riesgo Cardiovascular</h3>
                <p className="text-xs text-n-8 mb-4">Factores de riesgo cardiovascular y constantes vitales en reposo.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Riesgo / Constantes</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Tabaquismo: sí/no. PA en reposo: X/X. FC en reposo: X lpm..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_sports_aptitude({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Aptitud Física</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación de la capacidad para práctica deportiva.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Aptitud Física</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Prueba de Ruffier: X. Índice de Wells: X. Apto para práctica deportiva..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_sports_injury_mech({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Lesión y Mecanismo</h3>
                <p className="text-xs text-n-8 mb-4">Descripción de la lesión y mecanismo de producción.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Lesión / Mecanismo</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Lesión en tobillo derecho. Mecanismo: inversión forzada durante carrera..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_sports_functional({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Funcionalidad</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación de la capacidad funcional post-lesión.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Funcionalidad</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Escala EVA dolor: X/10. Test de equilibrio: X. Marcha: normal/cojera..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_acute_resp_symptoms({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Síntomas Respiratorios</h3>
                <p className="text-xs text-n-8 mb-4">Disnea, tos, expectoración, dolor torácico.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Vía Aérea / Respiración</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Disnea: grado (MRC X). Tos: productiva/seca. Expectoración: color/cantidad..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_acute_resp_exam({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Examen Respiratorio</h3>
                <p className="text-xs text-n-8 mb-4">Inspección, percusión, auscultación pulmonar.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Examen Dirigido</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Inspección:宝箱 simétrico. Percusión: claro pulmonar. Auscultación: murmullo vesicular conservado..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_acute_gi_symptoms({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Síntomas Digestivos</h3>
                <p className="text-xs text-n-8 mb-4">Náusea, vómito, dolor abdominal, hábitos intestinales.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Digestivo / Hidratación</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Náusea: sí/no. Vómito: veces/contenido. Dolor: localización/intensidad. Hábito intestinal: normal/alterado..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_acute_gi_exam({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Examen Abdominal</h3>
                <p className="text-xs text-n-8 mb-4">Inspección, palpación, signos vitales.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Examen Abdominal</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Abdomen: blando/deodoro/doloroso a la palpación. Signos de irritación peritoneal: sí/no..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_acute_osteo_symptoms({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Semiología del Dolor</h3>
                <p className="text-xs text-n-8 mb-4">Localización, intensidad, irradiación, temporalidad del dolor musculoesquelético.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Semiología del Dolor</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Dolor lumbar cronico. EVA: X/10. Irradia a miembro inferior izquierdo. Empeora con la sedestación..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_acute_osteo_exam({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Examen Funcional Musculoesquelético</h3>
                <p className="text-xs text-n-8 mb-4">Arcos de movimiento, fuerza, reflejos.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Examen Funcional</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="ROM: flexión lumbar X°. Fuerza miembros inferiores: 5/5. Reflejos rotulianos: +/++..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_acute_neuro_symptoms({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Síntomas Neurológicos</h3>
                <p className="text-xs text-n-8 mb-4">Cefalea, mareo, défices motores, sensitivos.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Síntoma Neurológico</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Cefalea holocraneana pulsátil. Mareo. No défices motores. No alterción de lenguaje..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_acute_neuro_exam({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Examen Neurológico</h3>
                <p className="text-xs text-n-8 mb-4">Estado de conciencia, pares craneales, motor, sensitivo.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Examen Neurológico</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Glasgow: X/15. Pares craneales: conservados. Motor: 5/5. Sensitivo: conservado..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_chronic_cardio_control({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Control Cardiovascular</h3>
                <p className="text-xs text-n-8 mb-4">Adherencia al tratamiento, control de factores de riesgo.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Control / Adherencia</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Toma medicamentos: sí/no. PA promedio domiciliario: X/X. Último perfil lipídico..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_chronic_cardio_labs({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Metas y Laboratorios</h3>
                <p className="text-xs text-n-8 mb-4">Objetivos terapéuticos y resultados de laboratorio.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Metas / Laboratorios</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="LDL meta: <70 mg/dL. Último LDL: X. HbA1c: X%. Función renal: TFGe X..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_chronic_resp_control({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Control Respiratorio</h3>
                <p className="text-xs text-n-8 mb-4">Síntomas, exacerbaciones y adherencia al inhalador.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Síntomas / Exacerbaciones</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Disnea de esfuerzos: mm 2. Exacerbaciones: X/año. Usa SABA: X veces/día..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_chronic_resp_exam({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Examen Respiratorio</h3>
                <p className="text-xs text-n-8 mb-4">Exploración pulmonar y espirometría.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Examen / Espirometría</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Espirometría: FEV1 X% pred. Reversibilidad: sí/no. Auscultación: silbidos..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_chronic_rheuma_control({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Control Reumatológico</h3>
                <p className="text-xs text-n-8 mb-4">Dolor articular, rigidez matutina, actividad de la enfermedad.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Actividad / Dolor</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="DAS28: X. Rigidez matutina: X min. EVA dolor: X/10. Articulaciones tumefactas: X..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_chronic_rheuma_exam({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Examen Articular</h3>
                <p className="text-xs text-n-8 mb-4">Conteo de articulaciones dolorosas y tumefactas.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Examen Articular</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="28 articulaciones: X dolorosas, X tumefactas. Manos en botón de camisa: sí/no..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_chronic_neuro_control({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Control de Crisis Neurológicas</h3>
                <p className="text-xs text-n-8 mb-4">Frecuencia de crisis, adherencia a anticconvulsivantes.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Control de Crisis</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Crisis epilépticas: X/mes. Último episodio: fecha. Adherencia a carbamazepina: sí/no..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_chronic_neuro_exam({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Examen Neurológico</h3>
                <p className="text-xs text-n-8 mb-4">Exploración de défices neurológicos focales.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Examen Neurológico</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Motor: 5/5 simétrico. Sensitivo: conservado. Marcha: normal. Temblor intencion: sí/no..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_followup_status({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Estructura ACD</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación del estado actual, contingencia y discapacidad.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Estado General / SV</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Actual: paciente refiere mejoría. Contingencia: puede laborar. Discapacidad: temporal..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_followup_changes({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Cambios y Ajustes</h3>
                <p className="text-xs text-n-8 mb-4">Modificaciones al tratamiento y notas de evolución.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Ajuste / Notas</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Se aumenta dosis de Losartán a 100mg. Se agrega Amlodipino 5mg..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_postop_status({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Estado Postoperatorio</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación del estado general post-cirugía.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Estado General / SV</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Paciente con buena tolerancia. SV estables. Dolor quirúrgico controlado..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_postop_wound({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Herida y Drenaje</h3>
                <p className="text-xs text-n-8 mb-4">Estado de herida quirúrgica y sistemas de drenaje.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Herida y Drenaje</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Herida quirúrgica: limpio, seco. Suturas intactas. Dren Jackson-Pratt: X mL serohemático..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_exam_results({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Exámenes Complementarios</h3>
                <p className="text-xs text-n-8 mb-4">Resultados de laboratorios, imágenes y otros estudios.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Exámenes</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Laboratorios: BH, QS, EGO. Imágenes: Rx tórax normal. EKG: ritmo sinusal..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_exam_conduct({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Conducta Médica</h3>
                <p className="text-xs text-n-8 mb-4">Plan de manejo, estudios adicionales y seguimiento.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Conducta Médica</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Continuar con antibiticoterapia IV. Solicitar hemocultivos. Revalorar en 48h..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_psych_status({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Evolución Mental</h3>
                <p className="text-xs text-n-8 mb-4">Estado mental y riesgo suicida.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Evolución Mental</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Estado mental: lúcido, orientado. Humor: disfórico. Riesgo suicida: bajo..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_meds_tolerance({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Tolerancia a Medicamentos</h3>
                <p className="text-xs text-n-8 mb-4">Efectos secundarios y adherencia a la medicación psicotrópica.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Tolerancia</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Tolera bien Quetiapina 50mg. Efecto sedante leve. Adherencia: 90%..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_psych_adjustments({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Ajustes y Plan</h3>
                <p className="text-xs text-n-8 mb-4">Modificaciones al tratamiento y plan de seguimiento.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Ajuste / Plan</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Aumentar Quetiapina a 100mg. Sesión de psychotherapy semanal. Revalorar en 2 semanas..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_wound_evolution({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Evolución de Herida</h3>
                <p className="text-xs text-n-8 mb-4">Progreso de cicatrización y signos de infección.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Examen Herida</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Herida con evolución favorable. Granulación: 70%. Signos infección: ausentes..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_wound_treatment({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Plan de Curación</h3>
                <p className="text-xs text-n-8 mb-4">Tipo de curación, apósitos y frecuencia de cambio.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Plan de Curación</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Curación húmeda avanzada. Cambio de apósito cada 72h. Hidrocoloides..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_peds_history({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Alimentación</h3>
                <p className="text-xs text-n-8 mb-4">Tipo de alimentación actual del niño.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Alimentación</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Lactancia materna exclusiva 6 meses. Ablactación iniciada con frutas..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_peds_exam({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Examen Físico Pediátrico</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación completa del niño.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Examen Físico</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Peso: X kg. Talla: X cm. PC: X cm. Semforín: X. Coloración piel: normal..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_peds_plan({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Indicaciones Pediátricas</h3>
                <p className="text-xs text-n-8 mb-4">Plan de manejo, educación a padres y seguimiento.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Indicaciones</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Continuar LME. Próximo control en 1 mes. Señales de alarma..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_rehab_progress({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Progreso Motor</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación de la evolución funcional.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Progreso Motor</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Marcha mejorarada. Rango de movimiento: flexión 90°. Fuerza: 4/5..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_rehab_exam({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Examen Físico de Rehabilitación</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación articular, muscular y funcional.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Examen Físico</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Articulación afectda: ROM limitado. Musculatura: atrofia leve. Pruebas funcionales: 70%..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_rehab_plan({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Plan Terapéutico</h3>
                <p className="text-xs text-n-8 mb-4">Ejercicios prescritos, modalidades de therapy y metas.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Plan Terapéutico</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Ejercicios de fortalecimiento 3x/semana. Termoterapia. Meta: recuperar 100% función..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_maternal_exam({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Estado Materno</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación del estado general de la paciente obstétrica.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Estado Materno</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Estado general: bueno. PA: X/X. Peso: X kg. Edema: leve miembros inferiores..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_fetal_monitoring({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Bienestar Fetal</h3>
                <p className="text-xs text-n-8 mb-4">Monitoreo fetal, movimientos fetales, ultrasonido.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Bienestar Fetal</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Movimientos fetales: presentes. FCF: X lpm. Ultrasonido: peso fetal estimado X g..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_prenatal_plan({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Plan Obstétrico</h3>
                <p className="text-xs text-n-8 mb-4">Próximocontrol, estudios pendientes y educación.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Plan Obstétrico</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Próximo control: 2 semanas. Solicitar USG tercer trimestre. Ácido fólico continuado..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_emergency_reason({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Motivo de Urgencia</h3>
                <p className="text-xs text-n-8 mb-4">Motivo de consulta en el servicio de urgencias.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Motivo Urgente</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Paciente llega por dolor torácico agudo. Inició hace 2 horas. Irradia a brazo izquierdo..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_preventive_state({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Estado General Preventivo</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación del estado general y factores de riesgo.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Estado General</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Estado general: bueno. Factores de riesgo: sedentarismo, dieta hipercalórica..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_proc_description({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Procedimiento</h3>
                <p className="text-xs text-n-8 mb-4">Descripción del procedimiento realizado.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Procedimiento</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Se realiza biopsia de piel bajo anestesia local. Sitmo: región dorsal derecha..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_proc_incidents({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Incidencias</h3>
                <p className="text-xs text-n-8 mb-4">Complicaciones o incidentes durante el procedimiento.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Incidencias</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Sin incidencias. Procedimiento tolerated sin complicaciones. Hemostasia Achieved..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_prev_screening({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Riesgo y Tamizaje</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación de factores de riesgo y estudios de tamizaje.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Riesgo / Tamizaje</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Factor de riesgo: tabaquismo. Tamizaje: colonoscopia pendiente. Mamografía: al día..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_prev_vaccines({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Vacunas y Plan</h3>
                <p className="text-xs text-n-8 mb-4">Esquema de vacunación y plan de prevención.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Vacunas / Plan</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Vacunas al día. Próxima: influenza en octubre. COVID-19: esquema completo..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_occ_aptitude({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Aptitud Laboral</h3>
                <p className="text-xs text-n-8 mb-4">Evaluación de la capacidad para laborar.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Aptitud Laboral</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Apto para laborar en oficina. Limitación: no cargar más de 10 kg. Pantalla: tolerable..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_occ_risks({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Riesgos Ocupacionales</h3>
                <p className="text-xs text-n-8 mb-4">Exposición a factores de riesgo en el lugar de trabajo.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Riesgos Ocupacionales</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Exposición: ruido (85 dB). Vibración de herramientas. Postura mantenida..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_nursing_vitals({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Signos Vitalos</h3>
                <p className="text-xs text-n-8 mb-4">Registro de signos vitales de enfermaría.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Signos Vitales</FieldLabel>
                <Textarea {...form.register('vitals')} placeholder="PA: X/X. FC: X. FR: X. T: X°C. SpO2: X%. Peso: X kg..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_nursing_procedure({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Procedimiento de Enfermería</h3>
                <p className="text-xs text-n-8 mb-4">Descripción del procedimiento realizado por enfermería.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Procedimiento</FieldLabel>
                <Textarea {...form.register('habitsHistory')} placeholder="Se coloca vía venosa periférica #20 en miembro superior derecho. Se administra SUEROTERAPIA..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_infusion_details({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Detalles de la Infusión</h3>
                <p className="text-xs text-n-8 mb-4">Tipo de infusión, velocidad y vigilancia.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Detalles de Infusión</FieldLabel>
                <Textarea {...form.register('currentIllness.notes')} placeholder="Solución: Hartman 1000mL. Velocidad: 500mL/hr. Vía: peripherica. Tolerancia: buena..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

export function Step_infusion_monitoring({ form, selectedPatient }: StepContentProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h3 className="text-sm font-semibold text-n-11 mb-1">Monitoreo de Infusión</h3>
                <p className="text-xs text-n-8 mb-4">Vigilancia y ajustes durante la infusión.</p>
            </div>
            <Field>
                <FieldLabel className="text-xs mb-1.5 text-n-8">Monitoreo</FieldLabel>
                <Textarea {...form.register('reviewOfSystems')} placeholder="Sin reacciones adversas. SpO2 estable. PA estable. Infusión progress sin incidentes..." rows={6} className="resize-none bg-n-1 border-n-5/30 rounded-md" />
            </Field>
        </div>
    );
}

const STEP_COMPONENTS: Record<string, React.FC<StepContentProps>> = {
    illness: Step_illness,
    personal: Step_personal,
    surgical: Step_surgical,
    meds_allergies: Step_meds_allergies,
    family: Step_family,
    habits: Step_habits,
    review_systems: Step_review_systems,
    nutrition_anthropometry: Step_nutrition_anthropometry,
    nutrition_diet: Step_nutrition_diet,
    nutrition_clinical_signs: Step_nutrition_clinical_signs,
    nutrition_biochemical: Step_nutrition_biochemical,
    nutrition_sports_clinical: Step_nutrition_sports_clinical,
    nutrition_behavioral_clinical: Step_nutrition_behavioral_clinical,
    psycho_reason: Step_psycho_reason,
    psycho_events: Step_psycho_events,
    psych_symptoms: Step_psych_symptoms,
    psych_biological: Step_psych_biological,
    psych_interpersonal: Step_psych_interpersonal,
    psych_stress: Step_psych_stress,
    peds_development: Step_peds_development,
    peds_diet_vaccines: Step_peds_diet_vaccines,
    peds_growth: Step_peds_growth,
    peds_diet: Step_peds_diet,
    peds_infectious: Step_peds_infectious,
    peds_exam_directed: Step_peds_exam_directed,
    peds_behavior: Step_peds_behavior,
    peds_sleep_habits: Step_peds_sleep_habits,
    wh_cycle: Step_wh_cycle,
    wh_preventive: Step_wh_preventive,
    wh_contraception: Step_wh_contraception,
    wh_prenatal: Step_wh_prenatal,
    wh_maternal_eval: Step_wh_maternal_eval,
    wh_bleeding_pain: Step_wh_bleeding_pain,
    wh_endocrinology: Step_wh_endocrinology,
    sports_performance: Step_sports_performance,
    sports_injuries: Step_sports_injuries,
    sports_cardio_risk: Step_sports_cardio_risk,
    sports_aptitude: Step_sports_aptitude,
    sports_injury_mech: Step_sports_injury_mech,
    sports_functional: Step_sports_functional,
    acute_resp_symptoms: Step_acute_resp_symptoms,
    acute_resp_exam: Step_acute_resp_exam,
    acute_gi_symptoms: Step_acute_gi_symptoms,
    acute_gi_exam: Step_acute_gi_exam,
    acute_osteo_symptoms: Step_acute_osteo_symptoms,
    acute_osteo_exam: Step_acute_osteo_exam,
    acute_neuro_symptoms: Step_acute_neuro_symptoms,
    acute_neuro_exam: Step_acute_neuro_exam,
    chronic_cardio_control: Step_chronic_cardio_control,
    chronic_cardio_labs: Step_chronic_cardio_labs,
    chronic_resp_control: Step_chronic_resp_control,
    chronic_resp_exam: Step_chronic_resp_exam,
    chronic_rheuma_control: Step_chronic_rheuma_control,
    chronic_rheuma_exam: Step_chronic_rheuma_exam,
    chronic_neuro_control: Step_chronic_neuro_control,
    chronic_neuro_exam: Step_chronic_neuro_exam,
    followup_status: Step_followup_status,
    followup_changes: Step_followup_changes,
    postop_status: Step_postop_status,
    postop_wound: Step_postop_wound,
    exam_results: Step_exam_results,
    exam_conduct: Step_exam_conduct,
    psych_status: Step_psych_status,
    meds_tolerance: Step_meds_tolerance,
    psych_adjustments: Step_psych_adjustments,
    wound_evolution: Step_wound_evolution,
    wound_treatment: Step_wound_treatment,
    peds_history: Step_peds_history,
    peds_exam: Step_peds_exam,
    peds_plan: Step_peds_plan,
    rehab_progress: Step_rehab_progress,
    rehab_exam: Step_rehab_exam,
    rehab_plan: Step_rehab_plan,
    maternal_exam: Step_maternal_exam,
    fetal_monitoring: Step_fetal_monitoring,
    prenatal_plan: Step_prenatal_plan,
    emergency_reason: Step_emergency_reason,
    preventive_state: Step_preventive_state,
    proc_description: Step_proc_description,
    proc_incidents: Step_proc_incidents,
    prev_screening: Step_prev_screening,
    prev_vaccines: Step_prev_vaccines,
    occ_aptitude: Step_occ_aptitude,
    occ_risks: Step_occ_risks,
    nursing_vitals: Step_nursing_vitals,
    nursing_procedure: Step_nursing_procedure,
    infusion_details: Step_infusion_details,
    infusion_monitoring: Step_infusion_monitoring,
};

export function WizardStepContent({ stepKey, ...props }: StepContentProps & { stepKey: string }) {
    const StepComponent = STEP_COMPONENTS[stepKey];
    if (!StepComponent) {
        return (
            <div className="p-6 text-center text-n-8">
                <p className="text-sm">Paso "{stepKey}" no disponible</p>
            </div>
        );
    }
    return <StepComponent {...props} />;
}