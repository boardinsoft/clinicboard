'use client';

import React from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import { Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';

const PHYSICAL_SYSTEMS = [
    { id: 'headNeck', label: 'Cabeza y Cuello' },
    { id: 'thorax', label: 'Tórax (Cardiopulmonar)' },
    { id: 'abdomen', label: 'Abdomen' },
    { id: 'pelvis', label: 'Pelvis / Genitourinario' },
    { id: 'extremities', label: 'Extremidades' },
    { id: 'neurological', label: 'Neurológico' },
    { id: 'skin', label: 'Piel y Faneras' },
] as const;

type VitalInputProps = {
    name: string;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    register: any;
    disabled?: boolean;
};

function VitalInput({ name, label, min, max, step, register, disabled }: VitalInputProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-n-8">{label}</label>
            <input
                type="number"
                {...register(name)}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className="w-full h-10 px-3 bg-n-1 border border-n-5/30 rounded-md text-sm text-n-11 text-center focus:outline-none focus:ring-1 focus:ring-b-8/10 disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>
    );
}

type ObjetivoSectionProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<any>;
    selectedPatient: { id: string; name_family: string; name_given: string[] | null } | null;
};

export default function ObjetivoSection({ form, selectedPatient }: ObjetivoSectionProps) {
    return (
        <Card className="bg-n-1">
            <div className="px-6 pt-5 pb-4 border-b border-n-5/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-b-8/10 rounded-lg">
                        <Activity className="w-5 h-5 text-b-8" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-n-11">Signos Vitales y Exploración</h2>
                        <p className="text-xs text-n-8 leading-relaxed mt-0.5">Mediciones fisiológicas e informe del examen físico.</p>
                    </div>
                </div>
            </div>
            <CardContent className="p-0">
                <div className="p-8 space-y-10">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6 bg-n-2/50 p-8 rounded-lg border border-n-5/30">
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

                <div className="space-y-6 px-8 pb-8">
                    <div>
                        <h4 className="text-sm font-semibold text-n-11 mb-1">Examen Físico</h4>
                        <p className="text-xs text-n-8">Registre únicamente los hallazgos positivos (anormales) activando el sistema correspondiente.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {PHYSICAL_SYSTEMS.map(sys => (
                            <div key={sys.id} className="p-4 rounded-lg border border-n-5/30 bg-n-2 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-n-11/90">{sys.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-semibold ${form.watch(`physicalExam.${sys.id}.normal` as const) ? 'text-n-8' : 'text-amber-500'}`}>
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
                                        className="text-xs resize-none mt-3 animate-in fade-in slide-in-from-top-2 duration-200 border-n-5/30 focus-visible:ring-b-8/10 bg-n-1"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}