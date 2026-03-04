'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface SearchResult {
    id: string;
    type: 'patient' | 'appointment' | 'encounter' | 'medication';
    title: string;
    subtitle?: string;
    url: string;
    metadata?: Record<string, unknown>;
}

export async function searchGlobal(queryText: string, context?: string): Promise<SearchResult[]> {
    if (!queryText || queryText.length < 2) return [];

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Get practitioner ID
    const { data: practitioner } = await supabase
        .from('practitioners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!practitioner) return [];

    const practitionerId = practitioner.id;

    // 1. Search Patients (Fuzzy name, Exact phone/email/identifier)
    const patientsQuery = supabase
        .from('patients')
        .select('id, name_family, name_given, identifiers, telecom')
        .or(`name_family.ilike.%${queryText}%,name_given.cs.{${queryText}},telecom->>value.ilike.%${queryText}%,identifiers->>value.ilike.%${queryText}%`)
        .eq('practitioner_id', practitionerId)
        .limit(10);

    // 2. Search Appointments
    const appointmentsQuery = supabase
        .from('appointments')
        .select('id, description, start_time, patient_id, patients(name_family, name_given)')
        .or(`description.ilike.%${queryText}%`)
        .eq('practitioner_id', practitionerId)
        .limit(5);

    // 3. Search Medication
    const medicationQuery = supabase
        .from('medication_requests')
        .select('id, medication_display, patient_id, patients(name_family, name_given)')
        .ilike('medication_display', `%${queryText}%`)
        .eq('prescriber_id', practitionerId)
        .limit(5);

    // 4. Search Clinical Notes (Encounters)
    const encountersQuery = supabase
        .from('encounters')
        .select('id, evolution_note, plan, patient_id, patients(name_family, name_given)')
        .or(`evolution_note.ilike.%${queryText}%,plan.ilike.%${queryText}%`)
        .eq('practitioner_id', practitionerId)
        .limit(8);

    const [patientsRes, appointmentsRes, medicationRes, encountersRes] = await Promise.all([
        patientsQuery,
        appointmentsQuery,
        medicationQuery,
        encountersQuery
    ]);

    const results: SearchResult[] = [];

    // Fuzzy Search Fallback for patients using similarity if no direct matches
    if (!patientsRes.data || patientsRes.data.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC not in generated types
        const { data: fuzzyPatients } = await (supabase as any).rpc('search_patients_fuzzy', {
            search_term: queryText,
            p_id: practitionerId
        });
        if (fuzzyPatients && Array.isArray(fuzzyPatients)) {
            (fuzzyPatients as Array<{ id: string; name_given: string[]; name_family: string }>).forEach((p) => {
                results.push({
                    id: p.id,
                    type: 'patient',
                    title: `${p.name_given.join(' ')} ${p.name_family}`,
                    subtitle: `Paciente • Probable coincidencia`,
                    url: `/patients/${p.id}`,
                });
            });
        }
    }

    // Process Patients (Original results)
    if (patientsRes.data) {
        patientsRes.data.forEach(p => {
            // Avoid duplicates if we already added via fuzzy
            if (results.some(r => r.id === p.id)) return;

            const telecom = p.telecom as Array<{ system?: string; value?: string }> | null;
            const phone = Array.isArray(telecom) ? (telecom.find(t => t.system === 'phone')?.value) : null;

            results.push({
                id: p.id,
                type: 'patient',
                title: `${p.name_given.join(' ')} ${p.name_family}`,
                subtitle: `Paciente • ${phone || (Array.isArray(p.identifiers) && p.identifiers.length > 0 ? (p.identifiers[0] as { value?: string })?.value : 'Sin ID')}`,
                url: `/patients/${p.id}`,
            });
        });
    }

    // Process Appointments
    if (appointmentsRes.data) {
        appointmentsRes.data.forEach((a) => {
            const patientName = a.patients ? `${a.patients.name_given.join(' ')} ${a.patients.name_family}` : 'Paciente desconocido';
            results.push({
                id: a.id,
                type: 'appointment',
                title: a.description || 'Cita médica',
                subtitle: `Cita • ${patientName} • ${new Date(a.start_time).toLocaleDateString()}`,
                url: `/patients/${a.patient_id}`, // Lead to patient detail for now, or appointments tab
            });
        });
    }

    // Process Medications
    if (medicationRes.data) {
        medicationRes.data.forEach((m) => {
            const patientName = m.patients ? `${m.patients.name_given.join(' ')} ${m.patients.name_family}` : 'Paciente desconocido';
            results.push({
                id: m.id,
                type: 'medication',
                title: m.medication_display,
                subtitle: `Receta • ${patientName}`,
                url: `/patients/${m.patient_id}`,
            });
        });
    }

    // Process Encounters (Clinical Notes)
    if (encountersRes.data) {
        encountersRes.data.forEach((e) => {
            const patientName = e.patients ? `${e.patients.name_given.join(' ')} ${e.patients.name_family}` : 'Paciente desconocido';
            const noteText = e.evolution_note || e.plan || 'Empezar evaluación clínica...';
            results.push({
                id: e.id,
                type: 'encounter',
                title: `Nota: ${noteText.substring(0, 50)}...`,
                subtitle: `Historia Clínica • ${patientName}`,
                url: `/history?patientId=${e.patient_id}`, // Direct to history with parameter
            });
        });
    }

    // Prioritization logic
    if (context) {
        results.sort((a, b) => {
            if (a.type === context && b.type !== context) return -1;
            if (a.type !== context && b.type === context) return 1;
            return 0;
        });
    }

    return results;
}
