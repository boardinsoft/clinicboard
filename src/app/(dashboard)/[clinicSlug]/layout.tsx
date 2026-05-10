import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { getPractitionerClinics, Clinic } from '@/lib/supabase/clinic-utils';
import { ActiveClinicProvider } from '@/providers/ActiveClinicContext';
import AppShell from '@/components/ui/AppShell';

export const dynamic = 'force-dynamic';

interface ClinicSlugLayoutProps {
    children: React.ReactNode;
    params: Promise<{ clinicSlug: string }>;
}

export default async function ClinicSlugLayout({ children, params }: ClinicSlugLayoutProps) {
    const { clinicSlug } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    if (!user.email_confirmed_at) {
        redirect(`/verify-email?email=${encodeURIComponent(user.email || '')}`);
    }

    const { data: practitioner } = await supabase
        .from('practitioners')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

    const clinics: Clinic[] = await getPractitionerClinics(supabase, practitioner?.id);

    const clinic = clinics.find(c => c.slug === clinicSlug) ?? null;

    if (!clinic) {
        notFound();
    }

    return (
        <ActiveClinicProvider
            initialClinic={clinic}
            initialClinics={clinics}
            needsOnboarding={clinics.length === 0}
            practitionerId={practitioner?.id}
        >
            <AppShell
                user={user}
                practitioner={practitioner}
                clinics={clinics}
                initialClinic={clinic}
                emailConfirmed={!!user?.email_confirmed_at}
            >
                {children}
            </AppShell>
        </ActiveClinicProvider>
    );
}
