import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getPractitionerClinics } from '@/lib/supabase/clinic-utils';
import { getClinicSettings } from '@/actions/settings';
import { ClinicSettingsForm } from '@/components/settings/ClinicSettingsForm';

export default async function ClinicSettingsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: practitioner } = await supabase
    .from('practitioners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!practitioner) {
    notFound();
  }

  const clinics = await getPractitionerClinics(supabase, practitioner.id);
  const clinic = clinics.find(c => c.slug === clinicSlug);

  if (!clinic) {
    notFound();
  }

  const { data: clinicData, error } = await getClinicSettings(clinic.id);

  if (error || !clinicData) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ClinicSettingsForm clinic={clinicData as any} clinicSlug={clinicSlug} />
    </div>
  );
}
