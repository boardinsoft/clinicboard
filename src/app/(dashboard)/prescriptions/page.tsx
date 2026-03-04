'use client';

import React, { useState } from 'react';
import {
    Plus,
    Trash2,
    Printer,
    FileText,
    Pill,
    User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface PrescriptionItem {
    id: string;
    medication: string;
    dose: string;
    frequency: string;
    duration: string;
    route: string;
    instructions: string;
}

export default function PrescriptionsPage() {
    const [items, setItems] = useState<PrescriptionItem[]>([
        {
            id: '1',
            medication: 'Losartán',
            dose: '50mg',
            frequency: 'Cada 12 horas',
            duration: '30 días',
            route: 'Oral',
            instructions: 'Tomar en ayunas',
        },
        {
            id: '2',
            medication: 'Metformina',
            dose: '850mg',
            frequency: 'Cada 8 horas',
            duration: '30 días',
            route: 'Oral',
            instructions: 'Tomar con alimentos',
        },
    ]);

    const addItem = () => {
        setItems([
            ...items,
            {
                id: String(Date.now()),
                medication: '',
                dose: '',
                frequency: '',
                duration: '',
                route: 'Oral',
                instructions: '',
            },
        ]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof PrescriptionItem, value: string) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    }

    return (
        <div className="h-full flex flex-col pt-8">
            <div className="px-8 pb-6 border-b border-border/50">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Recetas</h1>
                        <p className="text-muted-foreground mt-1">
                            Diseñador de prescripciones — FHIR R4 MedicationRequest Resource
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir
                        </Button>
                        <Button>
                            <FileText className="w-4 h-4 mr-2" />
                            Generar PDF
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden bg-muted/20">
                {/* Prescription Form */}
                <div className="flex-1 overflow-y-auto bg-background border-r border-border/50">
                    {/* Patient Info Bar */}
                    <div className="flex items-center gap-4 px-8 py-4 bg-muted/40 border-b border-border/50">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <span className="font-medium text-sm">María García López</span>
                            <span className="text-xs text-muted-foreground ml-4">
                                Cédula: 001-1234567-8 · 41 años
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" className="ml-auto">Cambiar paciente</Button>
                    </div>

                    {/* Medications List */}
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <Pill className="w-5 h-5 text-primary" />
                                <span className="font-medium">Medicamentos</span>
                                <Badge variant="secondary">{items.length}</Badge>
                            </div>
                            <Button variant="outline" size="sm" onClick={addItem}>
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar Medicamento
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <Card key={item.id} className="border-l-4 border-l-primary shadow-sm">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                Medicamento #{index + 1}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2"
                                                onClick={() => removeItem(item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                            <div className="md:col-span-2 space-y-2">
                                                <Label htmlFor={`med-${item.id}`}>Medicamento</Label>
                                                <Input
                                                    id={`med-${item.id}`}
                                                    placeholder="Nombre del medicamento"
                                                    value={item.medication}
                                                    onChange={e => updateItem(item.id, 'medication', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`dose-${item.id}`}>Dosis</Label>
                                                <Input
                                                    id={`dose-${item.id}`}
                                                    placeholder="Ej: 500mg"
                                                    value={item.dose}
                                                    onChange={e => updateItem(item.id, 'dose', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`route-${item.id}`}>Vía</Label>
                                                <Select value={item.route} onValueChange={(value) => updateItem(item.id, 'route', value)}>
                                                    <SelectTrigger id={`route-${item.id}`}>
                                                        <SelectValue placeholder="Seleccionar vía" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Oral">Oral</SelectItem>
                                                        <SelectItem value="IV">Intravenosa</SelectItem>
                                                        <SelectItem value="IM">Intramuscular</SelectItem>
                                                        <SelectItem value="SC">Subcutánea</SelectItem>
                                                        <SelectItem value="Tópica">Tópica</SelectItem>
                                                        <SelectItem value="Inhalada">Inhalada</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`freq-${item.id}`}>Frecuencia</Label>
                                                <Input
                                                    id={`freq-${item.id}`}
                                                    placeholder="Ej: Cada 8 horas"
                                                    value={item.frequency}
                                                    onChange={e => updateItem(item.id, 'frequency', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`dur-${item.id}`}>Duración</Label>
                                                <Input
                                                    id={`dur-${item.id}`}
                                                    placeholder="Ej: 7 días"
                                                    value={item.duration}
                                                    onChange={e => updateItem(item.id, 'duration', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor={`inst-${item.id}`}>Indicaciones Especiales</Label>
                                            <Input
                                                id={`inst-${item.id}`}
                                                placeholder="Ej: Tomar con alimentos, evitar alcohol..."
                                                value={item.instructions}
                                                onChange={e => updateItem(item.id, 'instructions', e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Notes */}
                        <div className="mt-8 space-y-2">
                            <Label htmlFor="rx-notes">Notas Adicionales</Label>
                            <Textarea
                                id="rx-notes"
                                placeholder="Indicaciones generales, dieta, reposo, próxima cita..."
                                rows={3}
                                className="resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="w-[420px] bg-muted/30 flex-shrink-0 p-8 overflow-y-auto">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">
                        Vista Previa
                    </span>

                    {/* Prescription Preview */}
                    <Card className="bg-white text-black min-h-[600px] border-border shadow-md rounded-none">
                        <CardContent className="p-8">
                            {/* Header */}
                            <div className="text-center mb-6 pb-4 border-b-2 border-primary">
                                <div className="font-bold text-lg text-primary">Dr. Juan Pérez</div>
                                <div className="text-xs text-black/70 mt-1">Médico Internista — Colegio Médico #12345</div>
                                <div className="text-xs text-black/70">Tel: +1 809-555-0000</div>
                            </div>

                            {/* Patient */}
                            <div className="mb-6">
                                <div className="text-[10px] text-black/50 uppercase mb-1 font-semibold tracking-wider">Paciente</div>
                                <div className="text-sm font-semibold">María García López</div>
                                <div className="text-xs text-black/70 mt-1">Cédula: 001-1234567-8 · 41 años</div>
                            </div>

                            {/* Date */}
                            <div className="text-xs text-black/60 mb-8 font-medium">
                                Fecha: {new Date().toLocaleDateString('es-VE')}
                            </div>

                            {/* Rx Header */}
                            <div className="text-2xl font-light text-primary mb-6">Rx</div>

                            {/* Items */}
                            <div className="space-y-6">
                                {items.filter(i => i.medication).map((item, index) => (
                                    <div key={item.id} className="pb-4 border-b border-black/10 last:border-0">
                                        <div className="font-semibold text-sm mb-1">
                                            {index + 1}. {item.medication} {item.dose}
                                        </div>
                                        <div className="text-xs text-black/80 leading-relaxed">
                                            {item.route} {item.route && item.frequency && '·'} {item.frequency} {item.frequency && item.duration && '·'} {item.duration}
                                            {item.instructions && <div className="mt-1 font-medium">{item.instructions}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Signature */}
                            <div className="mt-24 text-center">
                                <div className="border-t border-black/80 w-48 mx-auto pt-2">
                                    <div className="text-xs font-semibold">Dr. Juan Pérez</div>
                                    <div className="text-[10px] text-black/60 mt-0.5">Firma y Sello</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
