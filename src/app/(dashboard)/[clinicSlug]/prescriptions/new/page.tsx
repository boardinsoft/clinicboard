import { redirect } from 'next/navigation';
import { getEncounterById } from '@/actions/encounters';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';
import PrescriptionCreator from '@/components/prescriptions/PrescriptionCreator';
import type { Tables } from '@/types/database.types';

interface PageProps {
    searchParams: Promise<{
        encounterId?: string;
    }>;
    params: Promise<{
        clinicSlug: string;
    }>;
}

export default async function NewPrescriptionPage({ searchParams, params }: PageProps) {
    const { encounterId } = await searchParams;
    const { clinicSlug } = await params;

    if (!encounterId) {
        redirect(`/${clinicSlug}/history`);
    }

    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        redirect(`/${clinicSlug}/history`);
    }

    const { data: encounter } = await getEncounterById(encounterId);

    if (!encounter) {
        redirect(`/${clinicSlug}/history`);
    }

    if (encounter.practitioner_id !== practitionerId) {
        redirect(`/${clinicSlug}/history`);
    }

    if (encounter.status !== 'in-progress') {
        redirect(`/${clinicSlug}/history?encounterId=${encounterId}`);
    }

    if (!encounter.clinic_id) {
        redirect(`/${clinicSlug}/history`);
    }

    const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', encounter.patient_id)
        .single();

    const { data: clinic } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('id', encounter.clinic_id)
        .single();

    const { data: practitioner } = await supabase
        .from('practitioners')
        .select('name_given, name_family, specialty, license_number')
        .eq('id', practitionerId)
        .single();

    return (
        <PrescriptionCreator
            encounterId={encounterId}
            clinicSlug={clinicSlug}
            encounter={encounter}
            patient={patient as Tables<'patients'> | null}
            clinic={clinic}
            practitioner={practitioner}
        />
    );
}