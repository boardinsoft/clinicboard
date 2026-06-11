'use client';

import React, { useState, useRef } from 'react';
import { Printer, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { MedicationItemInput } from '@/lib/schemas/prescription.schema';
import { FREQUENCIES, ROUTES } from '@/lib/schemas/prescription.schema';

interface PrescriptionPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: MedicationItemInput[];
    notes: string;
    patientName: string;
    patientDocId: string;
    patientAge: string | null;
    practitionerName: string;
    practitionerSpecialty: string | null;
    practitionerRegNumber: string | null;
    clinicName: string | null;
    clinicAddress: string | null;
    clinicPhone: string | null;
    onSaveDraft: () => void;
    onSaveAndActivate: () => void;
}

function getFrequencyLabel(value: string): string {
    return FREQUENCIES.find(f => f.value === value)?.label || value;
}

function getRouteLabel(value: string): string {
    return ROUTES.find(r => r.value === value)?.label || value;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('es-VE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export default function PrescriptionPreviewModal({
    open,
    onOpenChange,
    items,
    notes,
    patientName,
    patientDocId,
    patientAge,
    practitionerName,
    practitionerSpecialty,
    practitionerRegNumber,
    clinicName,
    clinicAddress,
    clinicPhone,
    onSaveDraft,
    onSaveAndActivate,
}: PrescriptionPreviewModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [documentText, setDocumentText] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    const generateDocumentText = () => {
        const today = formatDate(new Date());
        let text = `${clinicName || 'CLÍNICA MÉDICA'}\n`;
        text += `${clinicAddress || ''}\n`;
        text += `${clinicPhone || ''}\n`;
        text += `\n${'═'.repeat(50)}\n\n`;

        text += `RECETA MÉDICA\n`;
        text += `${'─'.repeat(50)}\n\n`;

        text += `Fecha: ${today}\n`;
        text += `Paciente: ${patientName}\n`;
        text += `Cédula: ${patientDocId}${patientAge ? ` · ${patientAge}` : ''}\n\n`;

        text += `${'─'.repeat(50)}\n`;
        text += `INDICACIÓN FARMACÉUTICA\n`;
        text += `${'─'.repeat(50)}\n\n`;

        items.forEach((item, i) => {
            text += `${i + 1}. ${item.medication_display}\n`;
            text += `   Dosis: ${item.dose}\n`;
            text += `   Frecuencia: ${getFrequencyLabel(item.frequency)}\n`;
            text += `   Vía: ${getRouteLabel(item.route)}\n`;
            text += `   Duración: ${item.duration_value} ${item.duration_unit}\n`;
            if (item.indications) {
                text += `   Indicaciones: ${item.indications}\n`;
            }
            text += '\n';
        });

        if (notes) {
            text += `${'─'.repeat(50)}\n`;
            text += `NOTAS:\n`;
            text += `${'─'.repeat(50)}\n`;
            text += `${notes}\n\n`;
        }

        text += `${'═'.repeat(50)}\n\n`;
        text += `Dr. ${practitionerName}\n`;
        if (practitionerSpecialty) {
            text += `${practitionerSpecialty}\n`;
        }
        if (practitionerRegNumber) {
            text += `Colegio Médico: ${practitionerRegNumber}\n`;
        }

        return text;
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setDocumentText(generateDocumentText());
            setIsEditing(false);
        }
        onOpenChange(newOpen);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const originalContents = document.body.innerHTML;
        const printContents = printContent.innerHTML;

        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="shrink-0 px-6 py-4 border-b border-n-5/30 bg-n-1">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                            <div className="w-8 h-8 rounded-md bg-b-8/10 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-b-8" />
                            </div>
                            Vista previa de receta
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[11px]"
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? 'Ver documento' : 'Editar texto'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[11px]"
                                onClick={handlePrint}
                            >
                                <Printer className="w-3.5 h-3.5 mr-1.5" />
                                Imprimir
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto" ref={printRef}>
                    {isEditing ? (
                        <div className="p-6">
                            <Textarea
                                value={documentText}
                                onChange={(e) => setDocumentText(e.target.value)}
                                className="min-h-[500px] font-mono text-[13px] leading-relaxed resize-none"
                                placeholder="Edita el texto de la receta..."
                            />
                        </div>
                    ) : (
                        <div className="p-8 bg-white text-black">
                            <div className="max-w-[650px] mx-auto">
                                <div className="text-center mb-8 pb-6 border-b-2 border-b-8/20">
                                    <div className="text-xl font-bold text-b-8 tracking-tight">
                                        {clinicName || 'CLÍNICA MÉDICA'}
                                    </div>
                                    {clinicAddress && (
                                        <div className="text-[11px] text-n-8 mt-1">{clinicAddress}</div>
                                    )}
                                    {clinicPhone && (
                                        <div className="text-[11px] text-n-8 mono">{clinicPhone}</div>
                                    )}
                                </div>

                                <div className="mb-8 pb-6 border-b border-n-5/30">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-[10px] font-bold text-n-8 uppercase tracking-widest mb-1">
                                                Paciente
                                            </div>
                                            <div className="text-sm font-bold text-n-11">{patientName}</div>
                                            <div className="text-[11px] text-n-8 mono mt-0.5">
                                                Cédula: {patientDocId}
                                                {patientAge && ` · ${patientAge}`}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-n-8 uppercase tracking-widest mb-1">
                                                Fecha
                                            </div>
                                            <div className="text-sm font-bold text-n-11 mono">
                                                {formatDate(new Date())}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-4xl font-serif italic text-b-8/60 mb-8 border-b border-b-8/10 pb-4 font-bold">
                                    Rx
                                </div>

                                <div className="space-y-6 min-h-[200px]">
                                    {items.map((item, index) => (
                                        <div key={item.id} className="pb-6 border-b border-n-5/20 last:border-0">
                                            <div className="font-bold text-[14px] mb-2 flex items-baseline gap-2">
                                                <span className="text-b-8/60 text-[11px] font-mono">{index + 1}.</span>
                                                {item.medication_display}
                                                <span className="text-n-8 font-medium ml-2 text-[13px] font-mono">
                                                    {item.dose}
                                                </span>
                                            </div>
                                            <div className="text-[12px] text-n-9 leading-relaxed pl-5 flex flex-wrap gap-x-2 gap-y-1">
                                                <span className="px-1.5 py-0.5 bg-n-2 text-n-8 text-[10px] font-medium rounded border border-n-5/30">
                                                    {getRouteLabel(item.route)}
                                                </span>
                                                <span className="text-n-5">·</span>
                                                <span className="font-medium font-mono">{getFrequencyLabel(item.frequency)}</span>
                                                <span className="text-n-5">·</span>
                                                <span className="font-medium italic font-mono">
                                                    {item.duration_value} {item.duration_unit}
                                                </span>
                                            </div>
                                            {item.indications && (
                                                <div className="mt-2 ml-5 text-[11px] font-medium bg-s-warning-bg/50 text-s-warning p-2 rounded border border-s-warning-br/30">
                                                    Indicación: {item.indications}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {notes && (
                                    <div className="mt-6 p-4 bg-n-2/50 rounded border border-n-5/30">
                                        <div className="text-[10px] font-bold text-n-8 uppercase tracking-widest mb-2">
                                            Notas adicionales
                                        </div>
                                        <div className="text-[12px] text-n-9 leading-relaxed">
                                            {notes}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-16 text-center">
                                    <div className="border-t border-n-5/30 w-56 mx-auto pt-3">
                                        <div className="text-[13px] font-bold text-n-11">
                                            Dr. {practitionerName}
                                        </div>
                                        {practitionerSpecialty && (
                                            <div className="text-[10px] text-n-8 uppercase tracking-wider mt-1">
                                                {practitionerSpecialty}
                                            </div>
                                        )}
                                        {practitionerRegNumber && (
                                            <div className="text-[9px] text-n-6 font-mono mt-0.5">
                                                Colegio Médico: {practitionerRegNumber}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 px-6 py-4 border-t border-n-5/30 bg-n-1 flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-[12px]"
                        onClick={() => handleOpenChange(false)}
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                        Volver al form
                    </Button>
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-[12px]"
                        onClick={onSaveDraft}
                    >
                        Guardar borrador
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 text-[12px] bg-b-8 hover:bg-b-9 active:scale-95"
                        onClick={() => {
                            if (isEditing && documentText) {
                                const notesMatch = documentText.match(/Notas adicionales\n[\s\S]*$/);
                                if (notesMatch) {
                                    onSaveAndActivate();
                                }
                            } else {
                                onSaveAndActivate();
                            }
                        }}
                    >
                        Confirmar y guardar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}