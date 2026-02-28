import React from 'react';
import AppShell from '@/components/ui/AppShell';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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

    // Optionally fetch practitioner details
    const { data: practitioner } = await supabase
        .from('practitioners')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <AppShell user={user} practitioner={practitioner}>
            {children}
        </AppShell>
    );
}
