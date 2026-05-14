'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchCIE10 } from '@/actions/diagnoses';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';

interface DiagnosisSearchProps {
    id: string;
    label: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    labelClassName?: string;
    showBadge?: boolean;
    onClear?: () => void;
}

export default function DiagnosisSearch({
    id,
    label,
    placeholder,
    value,
    onChange,
    disabled,
    labelClassName,
    showBadge = false,
    onClear,
}: DiagnosisSearchProps) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<{ code: string; description: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    const isSelected = value.includes(' — ') && !isOpen;

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

    const handleClear = () => {
        setQuery('');
        onChange('');
        onClear?.();
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="space-y-2">
                {label && <Label htmlFor={id} className={labelClassName}>{label}</Label>}
                <div className="relative">
                    {showBadge && isSelected ? (
                        <div className="flex items-center gap-2 h-9 w-full rounded-[6px] border border-n-5/30 bg-n-1 px-3">
                            <Badge variant="outline" className="font-mono text-[11px] font-semibold text-b-8 border-b-8/30 bg-b-2/20">
                                {value.split(' — ')[0]}
                            </Badge>
                            <span className="flex-1 truncate text-sm text-n-11">{value.split(' — ')[1]}</span>
                            {onClear && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="shrink-0 text-n-8 hover:text-n-11 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <Input
                            id={id}
                            placeholder={placeholder}
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            disabled={disabled}
                            autoComplete="off"
                        />
                    )}
                    {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 bg-n-2 text-n-12 rounded-md border border-n-5/30 shadow-lg max-h-60 overflow-y-auto">
                    <ul className="flex flex-col text-sm py-1">
                        {results.map((item) => (
                            <li
                                key={item.code}
                                onClick={() => handleSelect(item)}
                                className="px-3 py-2 cursor-pointer hover:bg-n-3 transition-colors border-b border-n-5/20 last:border-0 truncate"
                            >
                                <span className="font-mono text-[11px] font-semibold text-b-8 mr-2">{item.code}</span>
                                <span className="text-n-10">{item.description}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}