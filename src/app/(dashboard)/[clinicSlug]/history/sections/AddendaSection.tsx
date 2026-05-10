'use client';

import React, { useState } from 'react';
import { Plus, Save, RefreshCw, Shield, ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AddendumRow {
    id: string;
    encounter_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author?: {
        name_family: string;
        name_given: string[];
    };
}

interface AddendaSectionProps {
    isReadOnly: boolean;
    activeEncounterId: string | null;
    addenda: AddendumRow[];
    isAddingAddendum: boolean;
    setIsAddingAddendum: React.Dispatch<React.SetStateAction<boolean>>;
    newAddendumContent: string;
    setNewAddendumContent: React.Dispatch<React.SetStateAction<string>>;
    isSavingAddendum: boolean;
    setIsSavingAddendum: React.Dispatch<React.SetStateAction<boolean>>;
    setAddenda: React.Dispatch<React.SetStateAction<AddendumRow[]>>;
}

export default function AddendaSection({
    isReadOnly,
    activeEncounterId,
    addenda,
    isAddingAddendum,
    setIsAddingAddendum,
    newAddendumContent,
    setNewAddendumContent,
    isSavingAddendum,
    setIsSavingAddendum,
    setAddenda,
}: AddendaSectionProps) {
    if (!isReadOnly || !activeEncounterId) return null;

    const handleAddAddendum = async () => {
        if (!activeEncounterId || !newAddendumContent.trim()) return;
        setIsSavingAddendum(true);
        try {
            const { createAddendum, getAddenda } = await import('@/actions/encounters');
            const res = await createAddendum(activeEncounterId, newAddendumContent);
            if (res.error) {
                import('sonner').then(({ toast }) => toast.error('Error al guardar addenda: ' + res.error));
            } else {
                import('sonner').then(({ toast }) => toast.success('Addenda guardada correctamente'));
                setNewAddendumContent('');
                setIsAddingAddendum(false);
                const list = await getAddenda(activeEncounterId);
                setAddenda(list.data || []);
            }
        } catch {
            import('sonner').then(({ toast }) => toast.error('Error inesperado'));
        } finally {
            setIsSavingAddendum(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto px-6 py-6 pb-24">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-n-8">Notas Evolutivas</span>
                <div className="flex-1 h-px bg-n-5/40" />
            </div>
            <div className="space-y-6">
                <Alert className="bg-s-warning-bg/80 border-s-warning-br text-s-warning">
                    <Shield className="w-4 h-4 text-s-warning" />
                    <AlertTitle className="text-sm font-bold text-s-warning">Registro Permanente</AlertTitle>
                    <AlertDescription className="text-xs text-n-11">
                        Este acto médico ha sido finalizado y firmado. No es posible editar la nota original, pero puede añadir aclaraciones o información complementaria mediante una <b>Addenda</b>.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold flex items-center gap-2 text-n-11">
                            <ClipboardList className="w-4 h-4 text-b-8" /> Historial de Addendas
                        </h3>
                        {!isAddingAddendum && (
                            <Button size="sm" onClick={() => setIsAddingAddendum(true)} className="gap-2">
                                <Plus className="w-4 h-4" /> Nueva Addenda
                            </Button>
                        )}
                    </div>

                    {isAddingAddendum && (
                        <Card className="border-s-warning-br bg-s-warning-bg/50 overflow-hidden shadow-none animate-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-s-warning-br bg-s-warning-bg/80">
                                <span className="text-xs font-bold text-s-warning">Nueva Nota Aclaratoria</span>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <Textarea
                                    value={newAddendumContent}
                                    onChange={(e) => setNewAddendumContent(e.target.value)}
                                    placeholder="Escriba la información complementaria aquí..."
                                    className="resize-none min-h-[120px] bg-n-1 border-n-5/30 focus:ring-s-warning/20"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsAddingAddendum(false)} disabled={isSavingAddendum} className="text-n-8 hover:text-n-11">Cancelar</Button>
                                    <Button size="sm" onClick={handleAddAddendum} disabled={isSavingAddendum || !newAddendumContent.trim()} className="bg-s-warning hover:bg-s-warning/90 text-white gap-2">
                                        {isSavingAddendum ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Guardar Addenda
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-4">
                        {addenda.length === 0 && !isAddingAddendum ? (
                            <div className="text-center py-12 border-2 border-dashed border-n-5/20 rounded-xl bg-n-2/30">
                                <p className="text-sm text-n-8 font-medium">No se han registrado addendas para este encuentro.</p>
                            </div>
                        ) : (
                            addenda.map((ad, idx) => (
                                <Card key={ad.id} className="border-n-5/30 overflow-hidden shadow-none bg-n-1">
                                    <div className="px-4 py-3 border-b border-n-5/30 bg-n-2/50 flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-b-8/10 flex items-center justify-center text-[10px] font-bold text-b-8">
                                                {idx + 1}
                                            </div>
                                            <span className="text-xs font-bold text-n-11">
                                                {ad.author?.name_family}, {ad.author?.name_given?.join(' ')}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-n-8">
                                            {new Date(ad.created_at).toLocaleString('es-ES', {
                                                year: 'numeric', month: 'short', day: '2-digit',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <CardContent className="p-4 text-sm text-n-11 leading-relaxed whitespace-pre-wrap">
                                        {ad.content}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}