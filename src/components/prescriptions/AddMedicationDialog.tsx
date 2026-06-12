'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pill, Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function AddMedicationDialog({ open, onOpenChange, onSelect }: AddMedicationDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<MedicationResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showDropdown, setShowDropdown] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [medicationName, setMedicationName] = useState('');
    const [medicationCode, setMedicationCode] = useState('');
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!manualMode && searchQuery.trim().length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                searchMedications(searchQuery);
            }, 300);
        } else {
            setResults([]);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, manualMode, searchMedications]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectResult = (med: MedicationResult) => {
        onSelect({
            code: med.code,
            display: `${med.name} (${med.generic_name})`,
        });
        setSearchQuery('');
        setResults([]);
        setShowDropdown(false);
        setManualMode(false);
        setMedicationName('');
        setMedicationCode('');
        onOpenChange(false);
    };

    const handleManualAdd = () => {
        if (!medicationName.trim()) return;
        onSelect({
            code: medicationCode.trim() || `RX-${Date.now()}`,
            display: medicationName.trim(),
        });
        setMedicationName('');
        setMedicationCode('');
        setSearchQuery('');
        setManualMode(false);
        onOpenChange(false);
    };

    const handleClose = () => {
        setSearchQuery('');
        setResults([]);
        setManualMode(false);
        setMedicationName('');
        setMedicationCode('');
        setShowDropdown(false);
        onOpenChange(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelectResult(results[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-b-8/10 flex items-center justify-center">
                            <Pill className="w-4 h-4 text-b-8" />
                        </div>
                        Agregar medicamento
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Busca por nombre comercial o principio activo (DCI).
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    {!manualMode ? (
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-n-6" />
                                <Input
                                    ref={inputRef}
                                    placeholder="Ej: Losartán, Metformina, Amoxicilina..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowDropdown(true);
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                    onKeyDown={handleKeyDown}
                                    className="h-10 pl-9 pr-9"
                                    autoFocus
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-n-6 animate-spin" />
                                )}
                                {searchQuery && !isSearching && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setResults([]);
                                            inputRef.current?.focus();
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        <X className="w-4 h-4 text-n-6 hover:text-n-8" />
                                    </button>
                                )}
                            </div>

                            {showDropdown && results.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute z-50 w-full mt-1 bg-n-1 border border-n-5/30 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                                >
                                    {results.map((med, idx) => (
                                        <button
                                            key={med.id}
                                            type="button"
                                            onClick={() => handleSelectResult(med)}
                                            className={`w-full px-3 py-2.5 text-left hover:bg-n-2 transition-colors flex flex-col gap-0.5 ${
                                                idx === selectedIndex ? 'bg-n-2' : ''
                                            } ${idx === 0 ? 'rounded-t-lg' : ''} ${idx === results.length - 1 ? 'rounded-b-lg' : ''}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-medium text-sm text-n-11 line-clamp-1">
                                                    {med.name}
                                                </span>
                                                <span className="text-[10px] font-mono text-n-6 shrink-0 bg-n-2 px-1.5 py-0.5 rounded">
                                                    {med.code}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-n-8">
                                                <span className="line-clamp-1">{med.generic_name}</span>
                                                {med.pharmaceutical_form && (
                                                    <>
                                                        <span className="text-n-5">·</span>
                                                        <span>{med.pharmaceutical_form}</span>
                                                    </>
                                                )}
                                                {med.concentration && (
                                                    <>
                                                        <span className="text-n-5">·</span>
                                                        <span>{med.concentration}</span>
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {showDropdown && searchQuery.length >= 2 && !isSearching && results.length === 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-n-1 border border-n-5/30 rounded-lg shadow-lg p-4 text-center text-sm text-n-6">
                                    No se encontraron medicamentos para &ldquo;{searchQuery}&rdquo;
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
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
                                    Si no conoces el código, puedes dejarlo en blanco. Se generarÃ¡ uno automáticamente.
                                </p>
                            </div>
                        </div>
                    )}

                    {!manualMode && (
                        <button
                            type="button"
                            onClick={() => {
                                setManualMode(true);
                                setSearchQuery('');
                                setResults([]);
                                setShowDropdown(false);
                            }}
                            className="text-xs text-b-8 hover:text-b-9 font-medium underline-offset-2 hover:underline"
                        >
                            + Ingresar medicamento manualmente (sin buscar)
                        </button>
                    )}

                    {manualMode && (
                        <button
                            type="button"
                            onClick={() => {
                                setManualMode(false);
                                setMedicationName('');
                                setMedicationCode('');
                            }}
                            className="text-xs text-b-8 hover:text-b-9 font-medium underline-offset-2 hover:underline"
                        >
                            ← Volver a buscar en el catálogo
                        </button>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" size="sm" className="h-9" onClick={handleClose}>
                        Cancelar
                    </Button>
                    {manualMode ? (
                        <Button
                            size="sm"
                            className="h-9 bg-b-8 hover:bg-b-9 active:scale-95"
                            onClick={handleManualAdd}
                            disabled={!medicationName.trim()}
                        >
                            <Pill className="w-3.5 h-3.5 mr-1.5" />
                            Agregar a receta
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            className="h-9 bg-b-8 hover:bg-b-9 active:scale-95"
                            onClick={handleManualAdd}
                            disabled={!searchQuery.trim() || results.length === 0}
                        >
                            <Pill className="w-3.5 h-3.5 mr-1.5" />
                            Agregar a receta
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}