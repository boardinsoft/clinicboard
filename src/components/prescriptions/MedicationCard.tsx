'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { MedicationItemInput } from '@/lib/schemas/prescription.schema';
import { ROUTES, FREQUENCIES, DURATION_UNITS } from '@/lib/schemas/prescription.schema';

interface MedicationCardProps {
    item: MedicationItemInput;
    index: number;
    onUpdate: (field: keyof MedicationItemInput, value: string) => void;
    onRemove: () => void;
}

export default function MedicationCard({ item, index, onUpdate, onRemove }: MedicationCardProps) {
    return (
        <Card className="border border-n-5/30 bg-n-1 shadow-none overflow-hidden">
            <CardHeader className="flex-row items-center justify-between py-3 px-5 border-b border-n-5/30 bg-n-2/50">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-b-8/10 text-b-8 text-[11px] font-bold flex items-center justify-center">
                        {index}
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-n-11">{item.medication_display}</p>
                        <p className="text-[10px] text-n-8 mono">{item.medication_code}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-s-danger hover:text-s-danger hover:bg-s-danger/10 -mr-1"
                    onClick={onRemove}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-n-8 uppercase tracking-wider">
                            Dosis <span className="text-s-danger">*</span>
                        </Label>
                        <Input
                            placeholder="Ej: 500mg"
                            value={item.dose}
                            onChange={(e) => onUpdate('dose', e.target.value)}
                            className="h-9 text-[13px]"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-n-8 uppercase tracking-wider">
                            Frecuencia <span className="text-s-danger">*</span>
                        </Label>
                        <Select value={item.frequency} onValueChange={(v) => onUpdate('frequency', v)}>
                            <SelectTrigger className="h-9 text-[13px]">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent className="text-[13px]">
                                {FREQUENCIES.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>
                                        {f.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-n-8 uppercase tracking-wider">
                            Vía <span className="text-s-danger">*</span>
                        </Label>
                        <Select value={item.route} onValueChange={(v) => onUpdate('route', v)}>
                            <SelectTrigger className="h-9 text-[13px]">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent className="text-[13px]">
                                {ROUTES.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-n-8 uppercase tracking-wider">
                            Duración <span className="text-s-danger">*</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="7"
                                value={item.duration_value}
                                onChange={(e) => onUpdate('duration_value', e.target.value)}
                                className="h-9 text-[13px] w-20"
                                min="1"
                            />
                            <Select value={item.duration_unit} onValueChange={(v) => onUpdate('duration_unit', v)}>
                                <SelectTrigger className="h-9 text-[13px] flex-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="text-[13px]">
                                    {DURATION_UNITS.map((d) => (
                                        <SelectItem key={d.value} value={d.value}>
                                            {d.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-n-8 uppercase tracking-wider">
                        Indicaciones especiales
                    </Label>
                    <Textarea
                        placeholder="Ej: Tomar con alimentos, evitar alcohol, controlar tensión..."
                        value={item.indications}
                        onChange={(e) => onUpdate('indications', e.target.value)}
                        className="resize-none text-[13px] min-h-[60px]"
                        rows={2}
                    />
                </div>
            </CardContent>
        </Card>
    );
}