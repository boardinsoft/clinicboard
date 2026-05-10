import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPractitionerClinics } from '@/lib/supabase/clinic-utils';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: practitioner } = await supabase
        .from('practitioners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    const clinics = await getPractitionerClinics(supabase, practitioner?.id);

    if (clinics.length === 0) {
        redirect('/onboarding');
    }

    redirect(`/${clinics[0].slug}/dashboard`);
}
