import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import PatientsListView from './PatientsListView';

export default async function PatientsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
    const params = await searchParams;
    const q = params.q || '';
    const page = parseInt(params.page || '1');
    const pageSize = parseInt(params.pageSize || '10');

    const supabase = await createServerSupabaseClient();

    let query = supabase
        .from('patients')
        .select('*', { count: 'exact' });

    if (q) {
        // ILIKE search on family name or array check on given names
        query = query.or(`name_family.ilike.%${q}%,name_given.cs.{${q}}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
        .order('name_family', { ascending: true })
        .range(from, to);

    if (error) {
        console.error('Error fetching patients:', error);
    }

    return (
        <PatientsListView
            patients={data || []}
            totalItems={count || 0}
            page={page}
            pageSize={pageSize}
        />
    );
}
