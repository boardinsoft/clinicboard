'use client';

import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Condition, AllergyIntolerance } from '@/types/database.types';

interface ConditionsAllergiesProps {
    clinicalData: { conditions: Condition[]; allergies: AllergyIntolerance[] };
    selectedPatient: { id: string; name_family: string; name_given: string[] | null } | null;
}

export default function ConditionsAllergiesSection({ clinicalData, selectedPatient }: ConditionsAllergiesProps) {
    return (
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
    );
}