'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Activity } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import type { Condition, AllergyIntolerance } from '@/types/database.types';

interface AlergologiaSectionProps {
    clinicalData: { conditions: Condition[]; allergies: AllergyIntolerance[] };
    selectedPatient: { id: string; name_family: string; name_given: string[] | null } | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: any;
}

export default function AlergologiaSection({ clinicalData, selectedPatient, form }: AlergologiaSectionProps) {
    const hasAllergies = clinicalData.allergies.length > 0;

    return (
        <div className="space-y-6">
            <Card className={`bg-n-1 border ${hasAllergies ? 'border-destructive/30' : 'border-n-5/30'} overflow-hidden`}>
                <div className={`px-6 pt-5 pb-4 border-b ${hasAllergies ? 'bg-destructive/5 border-destructive/20' : 'bg-n-2/50 border-n-5/30'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${hasAllergies ? 'bg-destructive/10' : 'bg-b-8/10'}`}>
                            <AlertTriangle className={`w-5 h-5 ${hasAllergies ? 'text-destructive' : 'text-b-8'}`} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-n-11">Alergología</h2>
                            <p className="text-xs text-n-8 leading-relaxed mt-0.5">
                                {hasAllergies
                                    ? `⚠️ ${clinicalData.allergies.length} alergia(s) registrada(s) — verificar antes de prescribir`
                                    : 'Sin alergias registradas en el sistema.'}
                            </p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-6 space-y-5">
                    <Field>
                        <FieldLabel className="text-xs font-medium text-n-8 mb-2.5">
                            Alergias e Intolerancias
                        </FieldLabel>
                        <Textarea
                            {...form.register("knownAllergies")}
                            placeholder="Describa alergias a medicamentos, alimentos u otras sustancias..."
                            rows={3}
                            disabled={!selectedPatient}
                            className={`resize-none bg-n-1 border-n-5/30 ${hasAllergies ? 'border-destructive/30 focus:ring-destructive/20' : ''}`}
                        />
                    </Field>

                    {clinicalData.allergies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {clinicalData.allergies.map((a) => (
                                <Badge key={a.id} variant="pill-danger" className="text-xs">
                                    {a.code_display}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-n-1 border border-n-5/30 overflow-hidden">
                <div className="px-6 pt-5 pb-4 bg-n-2/50 border-b border-n-5/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-b-8/10 rounded-lg">
                            <Activity className="w-5 h-5 text-b-8" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-n-11">Condiciones Preexistentes</h2>
                            <p className="text-xs text-n-8 leading-relaxed mt-0.5">Referencia rápida — solo lectura. Edite desde el perfil del paciente.</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-5">
                    <div className="flex flex-wrap gap-2">
                        {clinicalData.conditions.length > 0
                            ? clinicalData.conditions.map((c) => (
                                <Badge key={c.id} variant="outline" className="border-n-5/30 bg-b-8/5 text-b-8 text-[11px] font-medium">
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
        </div>
    );
}