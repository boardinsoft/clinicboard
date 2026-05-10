'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { searchPatients } from '@/actions/patients';
import type { Patient } from '@/types/database.types';

interface UsePatientSearchOptions {
    clinicId?: string;
    pageSize?: number;
    debounceMs?: number;
}

interface UsePatientSearchResult {
    patients: Patient[];
    isLoading: boolean;
    error: string | null;
    total: number;
    query: string;
    setQuery: (query: string) => void;
    totalPages: number;
    currentPage: number;
    setPage: (page: number) => void;
}

interface SearchResult {
    patients: Patient[];
    total: number;
}

interface SearchCache {
    [key: string]: {
        result: SearchResult;
        timestamp: number;
    };
}

const CACHE_TTL = 30000; // 30 seconds

let searchCache: SearchCache = {};

export function usePatientSearch({
    clinicId,
    pageSize = 10,
    debounceMs = 300,
}: UsePatientSearchOptions = {}): UsePatientSearchResult {
    const [query, setQueryState] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPageState] = useState(1);

    // Debounce the query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [query, debounceMs]);

    const fetchPatients = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const cacheKey = `${debouncedQuery}-${clinicId || 'no-clinic'}-${page}`;
            const cached = searchCache[cacheKey];

            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                setPatients(cached.result.patients);
                setTotal(cached.result.total);
                setIsLoading(false);
                return;
            }

            const result = await searchPatients({
                query: debouncedQuery,
                clinicId,
                page,
                pageSize,
            });

            if ('error' in result) {
                setError(result.error as string);
                setPatients([]);
                setTotal(0);
            } else {
                setPatients(result.patients as Patient[]);
                setTotal(result.total);
                searchCache[cacheKey] = {
                    result: { patients: result.patients as Patient[], total: result.total },
                    timestamp: Date.now(),
                };
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching patients');
            setPatients([]);
            setTotal(0);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedQuery, clinicId, page, pageSize]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const setQuery = useCallback((newQuery: string) => {
        setQueryState(newQuery);
        setPageState(1); // Reset to first page on query change
    }, []);

    const setPage = useCallback((newPage: number) => {
        setPageState(newPage);
    }, []);

    const totalPages = useMemo(() => {
        return Math.ceil(total / pageSize);
    }, [total, pageSize]);

    return {
        patients,
        isLoading,
        error,
        total,
        query,
        setQuery,
        totalPages,
        currentPage: page,
        setPage,
    };
}

export function clearPatientSearchCache() {
    searchCache = {};
}