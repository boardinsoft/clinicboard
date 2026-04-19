'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { getPatients } from '@/actions/patients';
import { Search, User, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
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
    const [isOpen, setIsOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initial search and debounced search
    useEffect(() => {
        const search = async (searchTerm: string) => {
            setIsSearching(true);
            try {
                const res = await getPatients(searchTerm);
                setResults((res.data as unknown as Patient[]) || []);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        };

        if (debouncedQuery.length >= 2) {
            search(debouncedQuery);
            setIsOpen(true);
        } else if (debouncedQuery.length === 0 && !selectedPatient) {
            // Fetch initial 5 patients if query is empty and not selecting an existing one
            search('');
        } else {
            setResults([]);
            if (!selectedPatient) setIsOpen(false);
        }
    }, [debouncedQuery, selectedPatient]);

    // When value is externally cleared (id is empty) or synced initially
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
        setIsOpen(false);
        onChange(patient.id);
    };

    const handleClear = () => {
        setQuery('');
        setSelectedPatient(null);
        setResults([]);
        setIsOpen(false);
        onChange('');
        // Trigger initial search again
        const refreshInitial = async () => {
            const res = await getPatients('');
            setResults((res.data as unknown as Patient[]) || []);
        };
        refreshInitial();
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
        <FormItem className="relative">
            <FormLabel>{label}</FormLabel>
            <div className="relative">
                <Input
                    placeholder={placeholder}
                    className="w-full"
                    value={query}
                    onFocus={() => {
                        if (query.length === 0 || results.length > 0) setIsOpen(true);
                    }}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (selectedPatient) {
                            setSelectedPatient(null);
                            onChange('');
                        }
                    }}
                    autoComplete="off"
                />
                {(isSearching) && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && !selectedPatient && (query.length >= 2 || (query.length === 0 && results.length > 0)) && (
                <div className="absolute z-[100] w-full mt-1 bg-popover border rounded-md shadow-xl max-h-64 overflow-hidden flex flex-col">
                    <div className="p-2 border-b bg-muted/30 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        {query.length >= 2 ? `Resultados para "${query}"` : 'Pacientes Recientes'}
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        {results.length > 0 ? (
                            results.map((p) => (
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
                            ))
                        ) : !isSearching && query.length >= 2 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No se encontraron pacientes
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* Selection indicator */}
            {selectedPatient && (
                <div className="flex items-center justify-between p-2 mt-2 bg-primary/5 border border-primary/10 rounded-lg animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-primary">Paciente vinculado</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px]"
                        onClick={handleClear}
                    >
                        Desvincular
                    </Button>
                </div>
            )}
            <FormMessage />
        </FormItem>
        </div>
    );
}
