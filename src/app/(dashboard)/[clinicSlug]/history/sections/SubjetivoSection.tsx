'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import { UseFormReturn } from 'react-hook-form';
import { User, Plus, Activity, CheckCircle, Info } from 'lucide-react';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Stepper, StepperHeader, StepperIcon, StepperItem, StepperSeparator } from '@/components/ui/stepper';
import { WIZARD_PROFILES, getWizardProfile } from '../wizard/wizard-data';
import { WizardStepContent } from '../wizard/WizardSteps';

const ENCOUNTER_CATEGORIES = [
    { label: 'CONSULTA GENERAL', options: ['Consulta de Medicina General', 'Consulta de Seguimiento', 'Consulta de Control'] },
    { label: 'ESPECIALIDAD', options: ['Consulta de Cardiología', 'Consulta de Dermatología', 'Consulta de Endocrinología', 'Consulta de Gastroenterología', 'Consulta de Neumología', 'Consulta de Neurología', 'Consulta de Oftalmología', 'Consulta de Ortopedia', 'Consulta de Psiquiatría', 'Consulta de Urología'] },
    { label: 'PEDIATRÍA', options: ['Consulta de Pediatría', 'Consulta de Niño Sano', 'Consulta de Seguimiento Pediátrico'] },
    { label: 'OBSTETRICIA', options: ['Consulta Prenatal', 'Control de Embarazo', 'Consulta Postparto'] },
    { label: 'URGENCIAS', options: ['Atención de Urgencias', 'Consulta de Urgencias Menores'] },
    { label: 'REHABILITACIÓN', options: ['Consulta de Fisioterapia', 'Consulta de Terapia Física', 'Evaluación de Rehabilitación'] },
    { label: 'NUTRICIÓN', options: ['Consulta de Nutrición', 'Valoración Nutricional', 'Seguimiento Nutricional'] },
    { label: 'ODONTOLOGÍA', options: ['Consulta Dental', 'Tratamiento Odontológico'] },
    { label: 'PSIQUIATRÍA', options: ['Consulta Psiquiátrica', 'Evaluación de Salud Mental'] },
];

const SUGGESTION_MAP: Record<string, string[]> = {
    'Consulta de Medicina General': ['Dolor de cabeza', 'Dolor abdominal', 'Dolor de espalda', 'Fiebre', 'Tos', 'Fatiga', 'Mareos', 'Náuseas'],
    'Consulta de Seguimiento': ['Mejoría continúa', 'Sin cambios', 'Nuevos síntomas', 'Efectos secundarios'],
    default: ['Dolor', 'Fiebre', 'Tos', 'Fatiga', 'Mareos', 'Náuseas', 'Dificultad para respirar'],
};

function getCategoryForSubcategory(subcategory: string): string {
    for (const group of ENCOUNTER_CATEGORIES) {
        if (group.options.includes(subcategory)) return group.label;
    }
    return 'CONSULTA GENERAL';
}

type SubjetivoSectionProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<any>;
    selectedPatient: { id: string; name_family: string; name_given: string[] | null } | null;
    chiefComplaintSelectKey: number;
    setChiefComplaintSelectKey: React.Dispatch<React.SetStateAction<number>>;
    isWizardOpen: boolean;
    setIsWizardOpen: React.Dispatch<React.SetStateAction<boolean>>;
    wizardStep: number;
    setWizardStep: React.Dispatch<React.SetStateAction<number>>;
    familyHistorySelectKey?: number;
    setFamilyHistorySelectKey?: React.Dispatch<React.SetStateAction<number>>;
};

export default function SubjetivoSection({
    form,
    selectedPatient,
    chiefComplaintSelectKey,
    setChiefComplaintSelectKey,
    isWizardOpen,
    setIsWizardOpen,
    wizardStep,
    setWizardStep,
    familyHistorySelectKey = 0,
    setFamilyHistorySelectKey,
}: SubjetivoSectionProps) {
    return (
        <Card className="bg-n-1">
            <div className="px-6 pt-5 pb-4 border-b border-n-5/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-b-8/10 rounded-lg">
                        <User className="w-5 h-5 text-b-8" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-n-11">Motivo de Consulta y Antecedentes</h2>
                        <p className="text-xs text-n-8 leading-relaxed mt-0.5">Registre la información subjetiva proporcionada por el paciente.</p>
                    </div>
                </div>
            </div>
            <CardContent className="p-0">
                <div className="p-8 space-y-10">
                    <Field>
                        <FieldLabel className="text-xs font-medium text-n-8 mb-2.5">
                            Tipo de Consulta <span className="text-b-8">*</span>
                        </FieldLabel>
                        <Controller
                            control={form.control}
                            name="encounterSubcategory"
                            render={({ field }) => (
                                <Select onValueChange={(val) => {
                                    field.onChange(val);
                                    form.setValue('encounterCategory', getCategoryForSubcategory(val));
                                }} value={field.value} disabled={!selectedPatient}>
                                    <SelectTrigger className="w-full bg-n-1 border-n-5/30 focus:ring-b-8/10 focus:ring-1 rounded-md h-10 text-sm font-medium transition-all">
                                        <SelectValue placeholder="Clasificación de la visita..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {ENCOUNTER_CATEGORIES.map(group => (
                                            <SelectGroup key={group.label}>
                                                <SelectLabel className="text-[10px] font-bold text-n-8 uppercase tracking-widest px-2 py-1.5">{group.label}</SelectLabel>
                                                {group.options.map(opt => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </Field>
                </div>

                <div className="px-8 pb-8">
                    <Field>
                        <FieldLabel className="text-xs font-medium text-n-8 mb-2.5">
                            Motivo de consulta <span className="text-b-8">*</span>
                        </FieldLabel>
                        {selectedPatient && (
                            <div className="mb-2">
                                <Select
                                    key={chiefComplaintSelectKey}
                                    onValueChange={(val) => {
                                        const current = form.getValues("chiefComplaint") as string;
                                        const cleanCurrent = current ? current.trim() : "";
                                        const separator = cleanCurrent
                                            ? (cleanCurrent.endsWith(".") || cleanCurrent.endsWith(",") ? " " : ", ")
                                            : "";
                                        form.setValue("chiefComplaint", cleanCurrent + separator + val, { shouldDirty: true });
                                        setChiefComplaintSelectKey(k => k + 1);
                                    }}
                                >
                                    <SelectTrigger className="bg-n-1 border-n-5/30 focus:ring-b-8/10 rounded-md h-10 text-sm">
                                        <SelectValue placeholder="Sugerencias según tipo de consulta..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(SUGGESTION_MAP[form.watch('encounterSubcategory') as string || ''] || SUGGESTION_MAP[form.watch('encounterCategory') as string || 'default'] || SUGGESTION_MAP['default']).map(symptom => (
                                            <SelectItem key={symptom} value={symptom}>{symptom}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Textarea
                            {...form.register("chiefComplaint")}
                            placeholder="¿Por qué acudir el paciente hoy?"
                            rows={2}
                            disabled={!selectedPatient}
                            className="resize-none min-h-[80px] bg-n-1 border-n-5/30 focus:ring-b-8/10 rounded-md"
                        />
                        {form.formState.errors.chiefComplaint && (
                            <FieldError className="text-[10px] mt-1.5">{String(form.formState.errors.chiefComplaint.message)}</FieldError>
                        )}
                    </Field>
                </div>

                <div className="px-8 pb-8">
                    <Dialog open={isWizardOpen} onOpenChange={(open) => { setIsWizardOpen(open); if (open) setWizardStep(0); }}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" className="w-full h-14 border-dashed border-n-5/30 bg-n-2 hover:bg-n-3 text-n-11 transition-all flex items-center justify-center gap-3 rounded-lg">
                                <Plus className="w-5 h-5" />
                                <span className="font-semibold text-sm">Añadir Historia Clínica (Estado, Condiciones, Alergias, Hábitos...)</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 border-n-5/30 overflow-hidden bg-n-1">
                            <DialogTitle className="sr-only">Asistente de Historia Clínica</DialogTitle>
                            {!form.getValues('encounterSubcategory') ? (
                                <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
                                    <div className="p-4 rounded-full bg-n-2 mb-2">
                                        <Info className="w-8 h-8 text-n-8" />
                                    </div>
                                    <h3 className="text-base font-semibold text-n-11">Selecciona el tipo de encuentro primero</h3>
                                    <p className="text-sm text-n-8 max-w-sm">El asistente se adapta a cada tipo de consulta. Elige la categoría y subcategoría del encuentro para continuar.</p>
                                    <Button variant="outline" onClick={() => setIsWizardOpen(false)}>Cerrar</Button>
                                </div>
                            ) : (() => {
                                const subcategory = form.watch('encounterSubcategory') as string || '';
                                const chiefComplaint = form.watch('chiefComplaint') as string || '';
                                const profileKey = getWizardProfile(subcategory, chiefComplaint);
                                const profile = WIZARD_PROFILES[profileKey];
                                const totalSteps = profile.steps.length;
                                const isLastStep = wizardStep === totalSteps - 1;
                                const currentStepKey = profile.steps[wizardStep]?.key ?? 'illness';

                                return (
                                    <>
                                        <DialogHeader className="p-6 pb-4 bg-n-2 border-b border-n-5/30">
                                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-n-11">
                                                <Activity className="w-5 h-5 text-b-8" />
                                                {profile.title}
                                            </DialogTitle>
                                            <DialogDescription className="text-n-8">{profile.description}</DialogDescription>
                                        </DialogHeader>

                                        <div className="p-6 pb-4 border-b border-n-5/30 bg-n-1">
                                            <Stepper value={wizardStep} onChange={setWizardStep} className="relative flex items-center w-full">
                                                {profile.steps.map((st: { label: string; icon: React.ReactNode }, i: number, arr: { length: number }) => (
                                                    <StepperItem key={i} value={i} disabled={wizardStep < i} className="flex-1 flex flex-col items-center relative text-center">
                                                        <StepperHeader className="flex w-full items-center justify-center">
                                                            <StepperIcon
                                                                className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${wizardStep === i
                                                                    ? 'border-b-8 bg-b-8 text-n-1'
                                                                    : wizardStep > i
                                                                        ? 'border-b-8 bg-b-8/10 text-b-8'
                                                                        : 'border-n-5 bg-n-2 text-n-8'
                                                                    }`}
                                                            >
                                                                {wizardStep > i ? <CheckCircle className="w-5 h-5" /> : st.icon}
                                                            </StepperIcon>
                                                            {i < arr.length - 1 && (
                                                                <StepperSeparator className={`absolute left-[calc(50%+20px)] right-[calc(-50%+20px)] top-5 block h-0.5 rounded-full ${wizardStep > i ? 'bg-b-8' : 'bg-n-5'}`} />
                                                            )}
                                                        </StepperHeader>
                                                        <div className="mt-2 text-center">
                                                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${wizardStep === i ? 'text-n-11' : 'text-n-8'}`}>{st.label}</span>
                                                        </div>
                                                    </StepperItem>
                                                ))}
                                            </Stepper>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-6 bg-n-2 min-h-[360px]">
                                            <WizardStepContent
                                                stepKey={currentStepKey}
                                                form={form}
                                                selectedPatient={selectedPatient}
                                                familyHistorySelectKey={familyHistorySelectKey}
                                                setFamilyHistorySelectKey={setFamilyHistorySelectKey}
                                                profileKey={profileKey}
                                            />
                                        </div>

                                        <div className="p-6 bg-n-1 border-t border-n-5/30 flex flex-row items-center justify-between">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setWizardStep(prev => Math.max(0, prev - 1))}
                                                disabled={wizardStep === 0}
                                                className="text-n-8 hover:text-n-11 hover:bg-n-2"
                                            >
                                                Anterior
                                            </Button>
                                            <div className="flex gap-2 items-center">
                                                <span className="text-xs text-n-8">Paso {wizardStep + 1} de {totalSteps}</span>
                                                {!isLastStep ? (
                                                    <Button
                                                        type="button"
                                                        onClick={() => setWizardStep(prev => Math.min(totalSteps - 1, prev + 1))}
                                                        className="shadow-sm bg-b-8 hover:bg-b-8/90 text-n-1"
                                                    >
                                                        Siguiente
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        onClick={() => { setIsWizardOpen(false); }}
                                                        className="shadow-sm border border-b-8 text-n-1 bg-b-8 hover:bg-b-8/90"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" /> Finalizar Asistente
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}