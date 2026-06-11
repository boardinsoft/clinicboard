'use client';

import React, { useState } from 'react';
import { Pill, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface AddMedicationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (medication: { code: string; display: string }) => void;
}

export default function AddMedicationDialog({ open, onOpenChange, onSelect }: AddMedicationDialogProps) {
    const [medicationName, setMedicationName] = useState('');
    const [medicationCode, setMedicationCode] = useState('');

    const handleAdd = () => {
        if (!medicationName.trim()) return;
        onSelect({
            code: medicationCode.trim() || `RX-${Date.now()}`,
            display: medicationName.trim(),
        });
        setMedicationName('');
        setMedicationCode('');
    };

    const handleClose = () => {
        setMedicationName('');
        setMedicationCode('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-b-8/10 flex items-center justify-center">
                            <Pill className="w-4 h-4 text-b-8" />
                        </div>
                        Agregar medicamento
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Ingresa el nombre y código del medicamento. Puedes usar el nombre comercial o la Denominación Común Internacional (DCI).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-n-8 uppercase tracking-wider">
                            Nombre del medicamento <span className="text-s-danger">*</span>
                        </Label>
                        <Input
                            placeholder="Ej: Losartán 50mg, Metformina 850mg"
                            value={medicationName}
                            onChange={(e) => setMedicationName(e.target.value)}
                            className="h-10"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-n-8 uppercase tracking-wider">
                            Código ATC / RXNorm
                        </Label>
                        <Input
                            placeholder="Ej: C09CA01, NDC-0000-0000-00"
                            value={medicationCode}
                            onChange={(e) => setMedicationCode(e.target.value)}
                            className="h-10"
                        />
                        <p className="text-[10px] text-n-6">
                            Si no conoces el código, puedes dejarlo en blanco. Se generará uno automáticamente.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" size="sm" className="h-9" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 bg-b-8 hover:bg-b-9 active:scale-95"
                        onClick={handleAdd}
                        disabled={!medicationName.trim()}
                    >
                        <Pill className="w-3.5 h-3.5 mr-1.5" />
                        Agregar a receta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}