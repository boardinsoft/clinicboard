'use client';

import React from 'react';
import { FlaskConical, Image as ImageIcon, FileSearch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import { UseFormReturn } from 'react-hook-form';
import DocumentosSection from './DocumentosSection';

type EstudiosSectionProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<any>;
    selectedPatient: { id: string; name_family: string; name_given: string[] | null } | null;
    encounterId: string | null;
    isReadOnly: boolean;
};

export default function EstudiosSection({ form, selectedPatient, encounterId, isReadOnly }: EstudiosSectionProps) {
    return (
        <div className="space-y-6">
            <Card className="bg-n-1">
                <div className="px-6 pt-5 pb-4 border-b border-n-5/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-b-8/10 rounded-lg">
                            <FileSearch className="w-5 h-5 text-b-8" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-n-11">Estudios Complementarios</h2>
                            <p className="text-xs text-n-8 leading-relaxed mt-0.5">Laboratorio e imagenología. Registre resultados o solicitudes.</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <FlaskConical className="w-4 h-4 text-n-8" />
                                    <FieldLabel className="text-xs font-medium text-n-8 m-0">Laboratorio</FieldLabel>
                                </div>
                                <Textarea
                                    {...form.register("laboratoryExams")}
                                    placeholder="Resultados de laboratorios, biometría, química sanguínea..."
                                    rows={5}
                                    disabled={!selectedPatient}
                                    className="resize-none bg-n-1 border-n-5/30"
                                />
                            </Field>

                            <Field>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <ImageIcon className="w-4 h-4 text-n-8" />
                                    <FieldLabel className="text-xs font-medium text-n-8 m-0">Imagenología</FieldLabel>
                                </div>
                                <Textarea
                                    {...form.register("imagingExams")}
                                    placeholder="Radiografías, ecografías, tomografías, resonancias..."
                                    rows={5}
                                    disabled={!selectedPatient}
                                    className="resize-none bg-n-1 border-n-5/30"
                                />
                            </Field>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DocumentosSection encounterId={encounterId} isReadOnly={isReadOnly} />
        </div>
    );
}