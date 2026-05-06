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
import { PageHeader, PageContainer } from '@/components/ui/PageLayout';

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
        <div className="h-full flex flex-col bg-background overflow-hidden">
            <PageHeader
                title="Recetas Médicas"
                description="Diseñador de recetas médicas — Basado en MedicationRequest FHIR R4."
                breadcrumbs={[{ label: 'Recetas' }]}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 px-3 font-bold text-[11px] gap-2">
                            <Printer className="w-3.5 h-3.5" />
                            Imprimir
                        </Button>
                        <Button size="sm" className="h-8 px-3 font-bold text-[11px] gap-2 shadow-sm">
                            <FileText className="w-3.5 h-3.5" />
                            Generar PDF
                        </Button>
                    </div>
                }
                className="py-6 border-b-0"
            />

            <PageContainer size="full" className="flex-1 p-0 flex flex-col overflow-hidden border-t border-border/40">
                <div className="flex flex-1 overflow-hidden">
                    {/* Prescription Form */}
                    <div className="flex-1 overflow-y-auto bg-background border-r border-border/40">
                        {/* Patient Info Bar */}
                        <div className="flex items-center gap-4 px-8 py-4 bg-muted/20 border-b border-border/40">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <span className="font-bold text-sm text-foreground">María García López</span>
                                <span className="text-xs text-muted-foreground ml-4">
                                    Cédula: <span className="font-mono text-[11px] font-medium">001-1234567-8</span> · 41 años
                                </span>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-auto text-[11px] font-bold h-7 hover:bg-primary/5 hover:text-primary transition-colors">
                                Cambiar paciente
                            </Button>
                        </div>

                        {/* Medications List */}
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-primary" />
                                    <span className="font-bold text-sm">Medicamentos</span>
                                    <Badge variant="pill" className="ml-1 text-[10px]">{items.length}</Badge>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-primary hover:bg-primary/5 transition-colors" onClick={addItem}>
                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                    Agregar Medicamento
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {items.map((item, index) => (
                                    <Card key={item.id} className="border border-border/60 shadow-none overflow-hidden hover:border-primary/30 transition-colors group">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wider">
                                                    MEDICAMENTO #{index + 1}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2 transition-colors opacity-0 group-hover:opacity-100"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                <div className="md:col-span-2 space-y-1.5">
                                                    <Label htmlFor={`med-${item.id}`} className="text-[11px] font-bold text-muted-foreground">Medicamento</Label>
                                                    <Input
                                                        id={`med-${item.id}`}
                                                        placeholder="Nombre del medicamento"
                                                        value={item.medication}
                                                        onChange={e => updateItem(item.id, 'medication', e.target.value)}
                                                        className="h-9 text-[13px] bg-muted/5 focus-visible:ring-primary/20"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor={`dose-${item.id}`} className="text-[11px] font-bold text-muted-foreground">Dosis</Label>
                                                    <Input
                                                        id={`dose-${item.id}`}
                                                        placeholder="Ej: 500mg"
                                                        value={item.dose}
                                                        onChange={e => updateItem(item.id, 'dose', e.target.value)}
                                                        className="h-9 text-[13px] bg-muted/5 focus-visible:ring-primary/20"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor={`route-${item.id}`} className="text-[11px] font-bold text-muted-foreground">Vía</Label>
                                                    <Select value={item.route} onValueChange={(value) => updateItem(item.id, 'route', value)}>
                                                        <SelectTrigger id={`route-${item.id}`} className="h-9 text-[13px] bg-muted/5">
                                                            <SelectValue placeholder="Vía" />
                                                        </SelectTrigger>
                                                        <SelectContent className="text-[13px]">
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
                                                <div className="space-y-1.5">
                                                    <Label htmlFor={`freq-${item.id}`} className="text-[11px] font-bold text-muted-foreground">Frecuencia</Label>
                                                    <Input
                                                        id={`freq-${item.id}`}
                                                        placeholder="Ej: Cada 8 horas"
                                                        value={item.frequency}
                                                        onChange={e => updateItem(item.id, 'frequency', e.target.value)}
                                                        className="h-9 text-[13px] bg-muted/5 focus-visible:ring-primary/20"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor={`dur-${item.id}`} className="text-[11px] font-bold text-muted-foreground">Duración</Label>
                                                    <Input
                                                        id={`dur-${item.id}`}
                                                        placeholder="Ej: 7 días"
                                                        value={item.duration}
                                                        onChange={e => updateItem(item.id, 'duration', e.target.value)}
                                                        className="h-9 text-[13px] bg-muted/5 focus-visible:ring-primary/20"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor={`inst-${item.id}`} className="text-[11px] font-bold text-muted-foreground">Indicaciones Especiales</Label>
                                                <Input
                                                    id={`inst-${item.id}`}
                                                    placeholder="Ej: Tomar con alimentos, evitar alcohol..."
                                                    value={item.instructions}
                                                    onChange={e => updateItem(item.id, 'instructions', e.target.value)}
                                                    className="h-9 text-[13px] bg-muted/5 focus-visible:ring-primary/20"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Notes */}
                            <div className="mt-8 space-y-2">
                                <Label htmlFor="rx-notes" className="text-[11px] font-bold text-muted-foreground">Notas Adicionales</Label>
                                <Textarea
                                    id="rx-notes"
                                    placeholder="Indicaciones generales, dieta, reposo, próxima cita..."
                                    rows={3}
                                    className="resize-none text-[13px] bg-muted/5 focus-visible:ring-primary/20 border-border/60"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="w-[480px] bg-sidebar flex-shrink-0 p-8 overflow-y-auto border-l border-border/40">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block mb-6">
                            VISTA PREVIA DEL DOCUMENTO
                        </span>

                        {/* Prescription Preview */}
                        <Card className="bg-white text-black min-h-[700px] border border-border/40 rounded-sm overflow-hidden transform-gpu shadow-xs">
                            <CardContent className="p-10 font-sans">
                                {/* Header */}
                                <div className="text-center mb-8 pb-6 border-b-2 border-primary/20">
                                    <div className="font-bold text-xl text-brand-8 tracking-tight">Dr. Juan Pérez</div>
                                    <div className="text-[11px] font-bold text-neutral-8 mt-1 uppercase tracking-wider">Médico Internista</div>
                                    <div className="text-[10px] text-neutral-8 mt-1 mono">Colegio Médico #12345 · Tel: +1 809-555-0000</div>
                                </div>

                                {/* Patient & Date */}
                                <div className="flex justify-between items-start mb-8 text-[12px]">
                                    <div>
                                        <div className="text-[10px] text-neutral-8 font-bold uppercase mb-1 tracking-wider">Paciente</div>
                                        <div className="font-bold text-sm text-foreground">María García López</div>
                                        <div className="text-neutral-9 mono">Cédula: 001-1234567-8 · 41 años</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-neutral-8 font-bold uppercase mb-1 tracking-wider">Fecha</div>
                                        <div className="font-bold text-foreground mono">{new Date().toLocaleDateString('es-VE')}</div>
                                    </div>
                                </div>

                                {/* Rx Symbol */}
                                <div className="text-4xl font-serif italic text-brand-8/80 mb-8 border-b border-brand-8/10 pb-2">Rx</div>

                                {/* Items */}
                                <div className="space-y-8 min-h-[300px]">
                                    {items.some(i => i.medication) ? items.filter(i => i.medication).map((item, index) => (
                                        <div key={item.id} className="pb-4 border-b border-black/5 last:border-0">
                                            <div className="font-bold text-[14px] mb-1.5 flex items-baseline gap-2">
                                                <span className="text-brand-8/60 text-[11px] mono">{index + 1}.</span>
                                                {item.medication} <span className="text-neutral-8 font-medium ml-1 mono">{item.dose}</span>
                                            </div>
                                            <div className="text-[12px] text-neutral-11 leading-relaxed pl-5 flex flex-wrap gap-x-2 gap-y-1">
                                                <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-border text-neutral-8 bg-neutral-2">{item.route}</Badge>
                                                {item.frequency && <span className="text-neutral-5">·</span>}
                                                <span className="font-medium mono">{item.frequency}</span>
                                                {item.duration && <span className="text-neutral-5">·</span>}
                                                <span className="font-medium italic mono">{item.duration}</span>
                                            </div>
                                            {item.instructions && (
                                                <div className="mt-2 text-[11px] font-medium text-black/70 bg-amber-50/50 p-1.5 rounded border border-amber-200/30 ml-5">
                                                    Indicación: {item.instructions}
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="h-full flex items-center justify-center border-2 border-dashed border-black/5 rounded-xl py-12">
                                            <p className="text-[11px] text-black/30 font-bold uppercase tracking-widest italic">Documento sin contenido</p>
                                        </div>
                                    )}
                                </div>

                                {/* Signature */}
                                <div className="mt-24 text-center">
                                    <div className="border-t border-black/20 w-56 mx-auto pt-3">
                                        <div className="text-[11px] font-bold text-black/80">Dr. Juan Pérez</div>
                                        <div className="text-[9px] text-black/40 font-bold uppercase tracking-widest mt-1">Firma y Sello Autorizado</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
