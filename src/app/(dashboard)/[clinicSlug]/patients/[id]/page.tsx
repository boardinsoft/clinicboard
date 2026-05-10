import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PatientDetailView from './PatientDetailView';

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        console.error('Invalid patient ID format:', id);
        return notFound();
    }

    const supabase = await createServerSupabaseClient();

    // Fetch Patient, Conditions, and Allergies in parallel (Next.js 15 pattern)
    const [patientResult, conditionsResult, allergiesResult] = await Promise.all([
        supabase.from('patients').select('*').eq('id', id).single(),
        supabase.from('conditions').select('*').eq('patient_id', id),
        supabase.from('allergy_intolerances').select('*').eq('patient_id', id)
    ]);

    if (patientResult.error || !patientResult.data) {
        console.error('Error fetching patient:', patientResult.error);
        return notFound();
    }

    return (
        <PatientDetailView
            patient={patientResult.data}
            conditions={conditionsResult.data || []}
            allergies={allergiesResult.data || []}
        />
    );
}
