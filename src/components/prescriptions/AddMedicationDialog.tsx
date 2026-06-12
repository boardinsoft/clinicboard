'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Pill, Search, X, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface MedicationResult {
    id: string;
    code: string;
    name: string;
    generic_name: string;
    pharmaceutical_form: string | null;
    concentration: string | null;
}

interface AddMedicationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (medication: { code: string; display: string }) => void;
}

type GroupedResults = {
    form: string;
    items: MedicationResult[];
};

export default function AddMedicationDialog({ open, onOpenChange, onSelect }: AddMedicationDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<MedicationResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [medicationName, setMedicationName] = useState('');
    const [medicationCode, setMedicationCode] = useState('');
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const listboxId = 'medications-listbox';

    const groupedResults = useMemo<GroupedResults[]>(() => {
        if (results.length === 0) return [];

        const groups: Record<string, MedicationResult[]> = {};
        for (const med of results) {
            const form = med.pharmaceutical_form || 'Otros';
            if (!groups[form]) groups[form] = [];
            groups[form].push(med);
        }

        return Object.entries(groups)
            .sort(([a], [b]) => {
                const order = ['TABLETAS RECUBIERTAS', 'TABLETAS', 'COMPRIMIDOS', 'CAPSULAS', 'JARABE', 'SOLUCION INYECTABLE', 'SOLUCION ORAL', 'INYECTABLE', 'Otros'];
                const aIdx = order.indexOf(a);
                const bIdx = order.indexOf(b);
                return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
            })
            .map(([form, items]) => ({ form, items }));
    }, [results]);

    const flatResults = useMemo(() => groupedResults.flatMap(g => g.items), [groupedResults]);

    const searchMedications = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const { searchMedications } = await import('@/actions/prescriptions');
            const res = await searchMedications(query);
            if (res.data) {
                setResults(res.data as MedicationResult[]);
                setSelectedIndex(-1);
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error('Error searching medications:', err);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (searchQuery.trim().length >= 2) {
            searchTimeoutRef.current = setTimeout(() => searchMedications(searchQuery), 300);
        } else {
            setResults([]);
        }

        return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
    }, [searchQuery, searchMedications]);

    const handleSelectResult = (med: MedicationResult) => {
        onSelect({ code: med.code, display: `${med.name} (${med.generic_name})` });
        resetAndClose();
    };

    const handleManualAdd = () => {
        if (!medicationName.trim()) return;
        onSelect({ code: medicationCode.trim() || `RX-${Date.now()}`, display: medicationName.trim() });
        resetAndClose();
    };

    const resetAndClose = () => {
        setSearchQuery('');
        setResults([]);
        setShowManualEntry(false);
        setMedicationName('');
        setMedicationCode('');
        setSelectedIndex(-1);
        onOpenChange(false);
    };

    const handleClose = () => resetAndClose();

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showManualEntry || flatResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatResults.length - 1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelectResult(flatResults[selectedIndex]);
        }
    };

    const toggleManualEntry = () => {
        setShowManualEntry(!showManualEntry);
        setSearchQuery('');
        setResults([]);
        setSelectedIndex(-1);
        if (!showManualEntry) {
            setTimeout(() => document.getElementById('manual-med-name')?.focus(), 50);
        }
    };

    const hasSearchResults = results.length > 0;
    const isEmptySearch = searchQuery.length >= 2 && !isSearching && results.length === 0;
    const isLoading = isSearching && results.length === 0;
    const showResults = !showManualEntry && (hasSearchResults || isLoading);
    let globalIndex = -1;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b border-n-5/20">
                    <DialogTitle className="flex items-center gap-2 mb-0.5">
                        <div className="size-8 rounded-md bg-b-8/10 flex items-center justify-center">
                            <Pill className="size-4 text-b-8" />
                        </div>
                        Agregar medicamento
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Busca por nombre comercial o principio activo (DCI).
                    </DialogDescription>
                </DialogHeader>

                {!showManualEntry ? (
                    <>
                        <div className="shrink-0 px-6 py-3 border-b border-n-5/10">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-n-8" />
                                <Input
                                    ref={inputRef}
                                    placeholder="Ej: Losartán, Metformina, Amoxicilina..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); }}
                                    onKeyDown={handleKeyDown}
                                    className="h-12 pl-11 pr-20 text-sm focus-visible:outline-2 focus-visible:outline-b-8 focus-visible:outline-offset-2 rounded-lg"
                                    autoFocus
                                    role="combobox"
                                    aria-label="Buscar medicamento"
                                    aria-expanded={hasSearchResults}
                                    aria-controls={listboxId}
                                    aria-activedescendant={selectedIndex >= 0 ? `med-option-${selectedIndex}` : undefined}
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-b-8 animate-spin" />
                                )}
                                {searchQuery && !isSearching && (
                                    <button
                                        type="button"
                                        aria-label="Limpiar búsqueda"
                                        onClick={() => { setSearchQuery(''); setResults([]); inputRef.current?.focus(); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 active:scale-95 transition-transform"
                                    >
                                        <X className="size-5 text-n-8 hover:text-n-11" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div ref={resultsRef} id={listboxId} role="listbox" aria-label="Resultados de medicamentos" aria-busy={isLoading} className="max-h-[400px] overflow-y-auto">
                            {isLoading ? (
                                <div className="flex flex-col py-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                        <div key={i} className={`px-6 py-3 flex flex-col gap-2 ${i < 8 ? 'border-b border-n-5/10' : ''}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <Skeleton className="h-5 w-48 rounded" />
                                                <Skeleton className="h-5 w-20 rounded" />
                                            </div>
                                            <Skeleton className="h-4 w-64 rounded" />
                                        </div>
                                    ))}
                                </div>
                            ) : hasSearchResults ? (
                                <>
                                    <div className="px-6 py-2.5 border-b border-n-5/10 flex items-center justify-between">
                                        <span className="text-[11px] text-n-8">
                                            <span className="font-mono font-semibold text-b-8">{results.length}</span>
                                            {' '}resultados para{' '}
                                            <span className="font-mono text-n-11">&ldquo;{searchQuery}&rdquo;</span>
                                        </span>
                                    </div>
                                    {groupedResults.map(group => (
                                        <div key={group.form}>
                                            <div className="sticky top-0 z-10 bg-n-2/95 backdrop-blur-sm px-6 py-2 border-b border-b-8/20">
                                                <span className="text-[10px] font-bold text-n-8 uppercase tracking-wider">{group.form}</span>
                                            </div>
                                            {group.items.map(med => {
                                                globalIndex++;
                                                const currentIdx = globalIndex;
                                                return (
                                                    <button
                                                        key={med.id}
                                                        id={`med-option-${currentIdx}`}
                                                        role="option"
                                                        aria-selected={currentIdx === selectedIndex}
                                                        onClick={() => handleSelectResult(med)}
                                                        className={`w-full px-6 py-3 text-left hover:bg-b-2/20 transition-colors flex flex-col gap-1.5 active:scale-[0.99] ${currentIdx === selectedIndex ? 'bg-b-2/20' : ''} ${currentIdx < flatResults.length - 1 ? 'border-b border-n-5/10' : ''}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <span className="font-medium text-sm text-n-11 line-clamp-1">{med.name}</span>
                                                            <Badge variant="outline" className="font-mono text-[10px] shrink-0">{med.code}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-n-8">
                                                            <span className="line-clamp-1">{med.generic_name}</span>
                                                            {med.concentration && (
                                                                <>
                                                                    <span className="text-n-5">·</span>
                                                                    <span className="font-mono">{med.concentration}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                    <div className="px-6 py-2 bg-n-2/50 border-t border-n-5/20 flex items-center justify-center gap-3">
                                        <span className="text-[10px] text-n-8"><kbd className="font-mono bg-n-3 px-1.5 py-0.5 rounded text-n-10">↑↓</kbd> navegar</span>
                                        <span className="text-n-5">·</span>
                                        <span className="text-[10px] text-n-8"><kbd className="font-mono bg-n-3 px-1.5 py-0.5 rounded text-n-10">↵</kbd> seleccionar</span>
                                        <span className="text-n-5">·</span>
                                        <span className="text-[10px] text-n-8"><kbd className="font-mono bg-n-3 px-1.5 py-0.5 rounded text-n-10">esc</kbd> cerrar</span>
                                    </div>
                                </>
                            ) : isEmptySearch ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
                                    <div className="size-14 rounded-full bg-n-3 flex items-center justify-center">
                                        <Pill className="size-7 text-n-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-n-11 mb-1">Sin resultados para &ldquo;{searchQuery}&rdquo;</p>
                                        <p className="text-xs text-n-8">Verifica el nombre o crea el medicamento manualmente.</p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={toggleManualEntry} className="h-8 text-xs gap-1.5 border-b-8/30 text-b-8 hover:bg-b-2/10 hover:border-b-8/50 active:scale-95">
                                        <Plus className="size-3.5" />Crear manualmente
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 text-center">
                                    <div className="size-14 rounded-full bg-n-3 flex items-center justify-center mb-2">
                                        <Search className="size-7 text-n-8" />
                                    </div>
                                    <p className="text-sm font-semibold text-n-11">Busca un medicamento</p>
                                    <p className="text-xs text-n-8 max-w-[260px]">Escribe al menos 2 caracteres para buscar por nombre comercial o principio activo.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-n-8 uppercase tracking-wider">Medicamento personalizado</span>
                            <button type="button" onClick={toggleManualEntry} className="text-xs text-n-8 hover:text-n-11 active:scale-95 transition-all">← Volver a buscar</button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="manual-med-name" className="text-[11px] font-bold text-n-8 uppercase tracking-wider">Nombre del medicamento <span className="text-s-danger">*</span></Label>
                            <Input id="manual-med-name" placeholder="Ej: Losartán 50mg, Metformina 850mg" value={medicationName} onChange={(e) => setMedicationName(e.target.value)} className="h-11 focus-visible:outline-2 focus-visible:outline-b-8 focus-visible:outline-offset-2" autoFocus />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="manual-med-code" className="text-[10px] font-bold text-n-8 uppercase tracking-wider">Código ATC / RXNorm</Label>
                            <Input id="manual-med-code" placeholder="Ej: C09CA01" value={medicationCode} onChange={(e) => setMedicationCode(e.target.value)} className="h-11 focus-visible:outline-2 focus-visible:outline-b-8 focus-visible:outline-offset-2" />
                            <p className="text-[10px] text-n-6">Si no conoces el código, se generará uno automáticamente.</p>
                        </div>
                    </div>
                )}

                {!showManualEntry && (
                    <div className="shrink-0 px-6 py-3 border-t border-n-5/20 bg-n-2/30">
                        <button type="button" onClick={toggleManualEntry} className="flex items-center gap-2 text-xs text-b-8 hover:text-b-9 font-medium active:scale-95 transition-all">
                            <Plus className="size-3.5" />Crear medicamento personalizado
                        </button>
                    </div>
                )}

                <DialogFooter className="shrink-0 gap-2 px-6 pb-4 pt-2 border-t border-n-5/20">
                    <Button variant="ghost" size="sm" className="h-9" onClick={handleClose}>Cancelar</Button>
                    {showManualEntry && (
                        <Button size="sm" className="h-9 bg-b-8 hover:bg-b-9 active:scale-95" onClick={handleManualAdd} disabled={!medicationName.trim()}>
                            <Pill className="size-3.5 mr-1.5" data-icon="inline-start" />Agregar a receta
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}