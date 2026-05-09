'use client';

import React from 'react';
import { UseFormReturn, Controller, useFieldArray } from 'react-hook-form';
import { Stethoscope, Plus, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DiagnosisSearch from '@/components/clinical/DiagnosisSearch';
import { toast } from 'sonner';

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

type EvaluacionSectionProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<any>;
    selectedPatient: { id: string; name_family: string; name_given: string[] | null } | null;
    diagnosesFields: { id: string }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appendDiagnosis: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    removeDiagnosis: any;
};

export default function EvaluacionSection({
    form,
    selectedPatient,
    diagnosesFields,
    appendDiagnosis,
    removeDiagnosis,
}: EvaluacionSectionProps) {
    return (
        <Card className="bg-n-1">
            <div className="px-6 pt-5 pb-4 border-b border-n-5/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-b-8/10 rounded-lg">
                        <Stethoscope className="w-5 h-5 text-b-8" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-n-11">Evaluación, Diagnóstico y Plan</h2>
                        <p className="text-xs text-n-8 leading-relaxed mt-0.5">Conclusión clínica, codificación CIE-10 e indicaciones terapéuticas.</p>
                    </div>
                </div>
            </div>
            <CardContent className="p-0">
                <div className="p-6 space-y-8">
                    <Field>
                        <FieldLabel className="text-xs font-medium text-n-8 mb-2.5">Nota de evolución / Impresión diagnóstica</FieldLabel>
                        <Textarea
                            {...form.register("evolutionNote")}
                            placeholder="Resumen del análisis clínico y razonamiento del diagnóstico…"
                            rows={6}
                            disabled={!selectedPatient}
                            className="resize-none bg-n-1 border-n-5/30"
                        />
                    </Field>
                </div>

                <div className="space-y-6 px-6 pb-6">
                    <div className="flex justify-between items-center bg-n-2/50 p-4 rounded-lg border border-n-5/30">
                        <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-b-8" />
                            <span className="text-sm font-semibold text-n-11">Diagnósticos CIE-10</span>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendDiagnosis({ code: '', description: '', type: 'other' })}
                            disabled={!selectedPatient}
                            className="gap-2 h-8 text-xs font-medium border-n-5/30 text-n-11 hover:bg-n-2"
                        >
                            <Plus className="w-3.5 h-3.5" /> Agregar Código
                        </Button>
                    </div>

                    <div className="space-y-4 bg-n-2/30 p-6 rounded-xl border border-n-5/30">
                        {diagnosesFields.length === 0 && (
                            <div className="bg-n-1 p-1.5 rounded-lg border border-n-5/30 focus-within:ring-1 focus-within:ring-b-8/10 transition-all">
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
                            <div key={field.id} className="flex gap-4 items-end bg-n-1 p-5 rounded-xl border border-n-5/30 shadow-sm relative group animate-in slide-in-from-left-2 duration-200">
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
                                        className="text-n-8 hover:text-s-danger hover:bg-s-danger/10 h-10 w-10 shrink-0 rounded-lg"
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

                <div className="px-6 pb-6 space-y-6">
                    <Field className="pt-4">
                        <div className="flex items-center justify-between mb-2.5">
                            <FieldLabel className="text-xs font-medium text-n-8 m-0">Plan terapéutico e indicaciones</FieldLabel>
                            <Select onValueChange={(val) => {
                                const kit = KITS_OF_ORDERS.find(k => k.id === val);
                                if (kit) {
                                    const currentPlan = form.getValues('treatmentPlan');
                                    const newPlan = currentPlan ? `${currentPlan}\n\n=== ${kit.label} ===\n${kit.content}` : `=== ${kit.label} ===\n${kit.content}`;
                                    form.setValue('treatmentPlan', newPlan);
                                    toast.success('Kit aplicado', { description: `Se ha insertado el kit: ${kit.label}` });
                                }
                            }} disabled={!selectedPatient}>
                                <SelectTrigger className="w-[240px] h-8 text-xs bg-b-8/5 border-n-5/30 text-b-8">
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
                            className="resize-none min-h-[160px] bg-n-1 border-n-5/30"
                        />
                    </Field>

                    <div className="pt-4 border-t border-n-5/30">
                        <div className="flex flex-wrap gap-3" role="group" aria-label="Acciones rápidas">
                            {['Generar Receta', 'Orden de Laboratorios', 'Certificado Médico', 'Referencia'].map(action => (
                                <Button key={action} variant="outline" size="sm" disabled={!selectedPatient} className="bg-n-1 hover:bg-b-8/10 hover:text-b-8 border-n-5/30 text-n-11 hover:border-b-8/30 transition-all font-medium text-xs h-8 px-4">
                                    {action}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}