import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getPractitionerProfile } from '@/actions/settings';
import { ProfileSettingsForm } from '@/components/settings/ProfileSettingsForm';

export default async function ProfileSettingsPage() {
  const { data: profile, error } = await getPractitionerProfile();

  if (error || !profile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ProfileSettingsForm profile={profile as any} />
    </div>
  );
}
