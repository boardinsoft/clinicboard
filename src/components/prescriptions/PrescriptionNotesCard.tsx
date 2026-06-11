'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PrescriptionNotesCardProps {
    notes: string;
    onChange: (notes: string) => void;
}

export default function PrescriptionNotesCard({ notes, onChange }: PrescriptionNotesCardProps) {
    return (
        <Card className="border border-n-5/30 bg-n-1 shadow-none overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-n-5/30 bg-n-2/50">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-5 rounded-full bg-b-8" />
                    <div>
                        <CardTitle className="text-xs font-semibold text-n-11 uppercase tracking-tight">
                            Notas adicionales
                        </CardTitle>
                        <CardDescription className="text-[11px] text-n-8 mt-0.5">
                            Reposo, dieta, próxima cita u observaciones generales
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-5">
                <Textarea
                    placeholder="Ej: Reposo por 3 días, dieta blanda, próxima cita en 2 semanas..."
                    value={notes}
                    onChange={(e) => onChange(e.target.value)}
                    className="resize-none text-[13px] min-h-[80px]"
                    rows={3}
                />
            </CardContent>
        </Card>
    );
}