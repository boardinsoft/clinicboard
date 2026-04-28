import React from 'react';
import AppShell from '@/components/ui/AppShell';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getPractitionerClinics, Clinic } from '@/lib/supabase/clinic-utils';
import { ActiveClinicProvider } from '@/providers/ActiveClinicContext';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: practitioner } = await supabase
        .from('practitioners')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

    const clinics: Clinic[] = await getPractitionerClinics(supabase, practitioner?.id);
    const initialClinic: Clinic | null = clinics[0] || null;

    return (
        <ActiveClinicProvider initialClinic={initialClinic} initialClinics={clinics}>
            <AppShell
                user={user}
                practitioner={practitioner}
                clinics={clinics}
                initialClinic={initialClinic}
            >
                {children}
            </AppShell>
        </ActiveClinicProvider>
    );
}