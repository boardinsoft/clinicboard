'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ClipboardList, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';

type AntecedentesSectionProps = {
    form: UseFormReturn<any>;
    selectedPatient: { id: string; name_family: string; name_given: string[] | null } | null;
};

export default function AntecedentesSection({ form, selectedPatient }: AntecedentesSectionProps) {
    return (
        <Card className="bg-n-1">
            <div className="px-6 pt-5 pb-4 border-b border-n-5/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-b-8/10 rounded-lg">
                        <ClipboardList className="w-5 h-5 text-b-8" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-n-11">Antecedentes</h2>
                        <p className="text-xs text-n-8 leading-relaxed mt-0.5">AP: personales, quirúrgicos, familiares, hospitalarios, hábitos y medicación actual.</p>
                    </div>
                </div>
            </div>
            <CardContent className="p-0">
                <div className="p-8 space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field>
                            <FieldLabel className="text-xs font-medium text-n-8 mb-2.5">Antecedentes Personales</FieldLabel>
                            <Textarea
                                {...form.register("pastConditions")}
                                placeholder="Patologías previas, enfermedades crónicas..."
                                rows={3}
                                disabled={!selectedPatient}
                                className="resize-none bg-n-1 border-n-5/30"
                            />
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-medium text-n-8 mb-2.5">Antecedentes Quirúrgicos</FieldLabel>
                            <Textarea
                                {...form.register("surgicalHistory")}
                                placeholder="Intervenciones quirúrgicas previas..."
                                rows={3}
                                disabled={!selectedPatient}
                                className="resize-none bg-n-1 border-n-5/30"
                            />
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-medium text-n-8 mb-2.5">Antecedentes Familiares</FieldLabel>
                            <Textarea
                                {...form.register("familyHistory")}
                                placeholder="Enfermedades hereditarias o familiares relevantes..."
                                rows={3}
                                disabled={!selectedPatient}
                                className="resize-none bg-n-1 border-n-5/30"
                            />
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-medium text-n-8 mb-2.5">Hospitalizaciones Previas</FieldLabel>
                            <Textarea
                                {...form.register("hospitalizationHistory")}
                                placeholder="Hospitalizaciones o ingresos previos..."
                                rows={3}
                                disabled={!selectedPatient}
                                className="resize-none bg-n-1 border-n-5/30"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field>
                            <FieldLabel className="text-xs font-medium text-n-8 mb-2.5">Hábitos y Estilo de Vida</FieldLabel>
                            <Textarea
                                {...form.register("habitsHistory")}
                                placeholder="Tabaquismo, alcohol, ejercicio, sueño..."
                                rows={3}
                                disabled={!selectedPatient}
                                className="resize-none bg-n-1 border-n-5/30"
                            />
                        </Field>

                        <Field>
                            <FieldLabel className="text-xs font-medium text-n-8 mb-2.5">Medicamentos Actuales</FieldLabel>
                            <Textarea
                                {...form.register("currentMedications")}
                                placeholder="Medicamentos en uso actualmente..."
                                rows={3}
                                disabled={!selectedPatient}
                                className="resize-none bg-n-1 border-n-5/30"
                            />
                        </Field>
                    </div>

                    <Field>
                        <FieldLabel className="text-xs font-medium text-n-8 mb-2.5">Revisión por Sistemas</FieldLabel>
                        <Textarea
                            {...form.register("reviewOfSystems")}
                            placeholder="Síntomas referidos por sistemas corporales..."
                            rows={3}
                            disabled={!selectedPatient}
                            className="resize-none bg-n-1 border-n-5/30"
                        />
                    </Field>
                </div>
            </CardContent>
        </Card>
    );
}