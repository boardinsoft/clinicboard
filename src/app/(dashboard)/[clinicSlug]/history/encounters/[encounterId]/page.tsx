import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EncounterDetailView from './EncounterDetailView';

interface PageProps {
    params: Promise<{
        clinicSlug: string;
        encounterId: string;
    }>;
}

export default async function EncounterDetailPage({ params }: PageProps) {
    const { clinicSlug, encounterId } = await params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(encounterId)) {
        console.error('Invalid encounter ID format:', encounterId);
        return notFound();
    }

    const supabase = await createServerSupabaseClient();

    const { data: encounter, error } = await supabase
        .from('encounters')
        .select(`
            *,
            clinical_note:clinical_notes(*),
            patient:patients(id, name_given, name_family, birth_date, gender),
            practitioner:practitioners(name_given, name_family, specialty)
        `)
        .eq('id', encounterId)
        .single();

    if (error || !encounter) {
        console.error('Error fetching encounter:', error);
        return notFound();
    }

    if (encounter.status !== 'finished') {
        redirect(`/${clinicSlug}/history?encounterId=${encounterId}`);
    }

    const { data: addenda } = await supabase
        .from('encounter_addenda')
        .select(`
            *,
            author:practitioners(name_family, name_given)
        `)
        .eq('encounter_id', encounterId)
        .order('created_at', { ascending: true });

    return (
        <EncounterDetailView
            encounter={encounter}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            addenda={(addenda || []) as any}
        />
    );
}