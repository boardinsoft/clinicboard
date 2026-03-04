'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchCIE10 } from '@/actions/diagnoses';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface DiagnosisSearchProps {
    id: string;
    label: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function DiagnosisSearch({
    id,
    label,
    placeholder,
    value,
    onChange,
    disabled
}: DiagnosisSearchProps) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<{ code: string; description: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (text: string) => {
        setQuery(text);
        onChange(text);

        if (text.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await searchCIE10(text);
            if (res && 'data' in res && res.data) {
                const data = res.data as { code: string; description: string }[];
                setResults(data);
                setIsOpen(data.length > 0);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (item: { code: string; description: string }) => {
        const displayValue = `${item.code} — ${item.description}`;
        setQuery(displayValue);
        onChange(displayValue);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="space-y-2">
                <Label htmlFor={id}>{label}</Label>
                <div className="relative">
                    <Input
                        id={id}
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        disabled={disabled}
                        autoComplete="off"
                    />
                    {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 bg-popover text-popover-foreground rounded-md border border-border shadow-md max-h-60 overflow-y-auto">
                    <ul className="flex flex-col text-sm py-1">
                        {results.map((item) => (
                            <li
                                key={item.code}
                                onClick={() => handleSelect(item)}
                                className="px-3 py-2 cursor-pointer hover:bg-muted/50 hover:text-foreground transition-colors border-b border-border/50 last:border-0 truncate"
                            >
                                <strong className="text-primary font-medium">{item.code}</strong>: <span className="text-muted-foreground">{item.description}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
