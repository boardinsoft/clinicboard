import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import AppointmentsView from './AppointmentsView';
import { toISODate, nowInVE } from '@/lib/date-utils';
import type { Appointment } from '@/lib/fhir/types';

export default async function AppointmentsPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Default fetch for today in Venezuela
    const today = toISODate(nowInVE());
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;

    const { data: appointments } = await supabase
        .from('appointments')
        .select(`
            *,
            patient:patients(
                id, 
                name_given, 
                name_family, 
                gender, 
                birth_date, 
                telecom, 
                identifiers
            )
        `)
        .eq('practitioner_id', user.id)
        .gte('start_time', startOfDay)
        .lt('start_time', endOfDay)
        .order('start_time', { ascending: true });

    return (
        <AppointmentsView 
            initialAppointments={(appointments as unknown as Appointment[]) || []} 
        />
    );
}
