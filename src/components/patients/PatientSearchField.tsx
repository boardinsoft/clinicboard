'use client';

import React, { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { getPatients } from '@/actions/patients';
import { Search, User, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
    FormControl, 
    FormItem, 
    FormLabel, 
    FormMessage 
} from '@/components/ui/form';
import type { Patient } from '@/lib/fhir/types';
import { cn } from '@/lib/utils';

interface PatientSearchFieldProps {
    value: string;
    onChange: (id: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}

export function PatientSearchField({
    value,
    onChange,
    label = "Paciente",
    placeholder = "Buscar por nombre, apellido o CI...",
    className
}: PatientSearchFieldProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Patient[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const debouncedQuery = useDebounce(query, 300);

    // Initial load/Sync with external value if provided (for edit modes etc)
    // For now we just focus on selection
    
    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults([]);
            return;
        }

        const search = async () => {
            setIsSearching(true);
            try {
                const res = await getPatients(debouncedQuery);
                setResults((res.data as unknown as Patient[]) || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        };

        search();
    }, [debouncedQuery]);

    // When value is externally cleared (id is empty)
    useEffect(() => {
        if (!value) {
            setSelectedPatient(null);
            setQuery('');
        }
    }, [value]);

    const handleSelect = (patient: Patient) => {
        const displayName = `${patient.name_family}, ${patient.name_given?.join(' ')}`;
        setQuery(displayName);
        setSelectedPatient(patient);
        setResults([]);
        onChange(patient.id);
    };

    const handleClear = () => {
        setQuery('');
        setSelectedPatient(null);
        onChange('');
    };

    return (
        <FormItem className={cn("relative", className)}>
            <FormLabel>{label}</FormLabel>
            <FormControl>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={placeholder}
                        className="pl-9"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (selectedPatient) {
                                setSelectedPatient(null);
                                onChange('');
                            }
                        }}
                        autoComplete="off"
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />
                    )}
                </div>
            </FormControl>

            {/* Results Dropdown */}
            {results.length > 0 && !selectedPatient && (
                <div className="absolute z-[100] w-full mt-1 bg-popover border rounded-md shadow-xl max-h-48 overflow-y-auto">
                    {results.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            className="w-full px-4 py-2.5 text-left hover:bg-accent flex items-center gap-3 transition-colors group"
                            onClick={() => handleSelect(p)}
                        >
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs shrink-0 group-hover:bg-primary/20">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold truncate capitalize">
                                    {p.name_family}, {p.name_given?.join(' ')}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                    {p.identifiers?.[0]?.value || 'Sin CI'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Selection indicator */}
            {selectedPatient && (
                <div className="flex items-center justify-between p-2 mt-2 bg-emerald-50 border border-emerald-100 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700">Paciente Seleccionado</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/50"
                        onClick={handleClear}
                    >
                        Cambiar
                    </Button>
                </div>
            )}
            <FormMessage />
        </FormItem>
    );
}
