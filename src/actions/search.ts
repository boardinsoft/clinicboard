'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';

export interface SearchResult {
    id: string;
    type: 'patient' | 'appointment' | 'encounter' | 'medication';
    title: string;
    subtitle?: string;
    url: string;
    metadata?: Record<string, unknown>;
}

export interface SearchResultGroup {
    type: 'patient' | 'appointment' | 'encounter' | 'medication';
    label: string;
    icon: string;
    color: string;
    results: SearchResult[];
}

const TYPE_CONFIG = {
    patient: { label: 'Pacientes', icon: 'user', color: 'text-b-8 bg-b-1' },
    appointment: { label: 'Citas', icon: 'calendar', color: 'text-info bg-info-bg' },
    medication: { label: 'Recetas', icon: 'pill', color: 'text-success bg-success-bg' },
    encounter: { label: 'Notas clínicas', icon: 'file-text', color: 'text-warning bg-warning-bg' },
} as const;

export type GroupedSearchResults = SearchResultGroup[];

export async function searchGlobal(queryText: string, clinicSlug: string, context?: string): Promise<GroupedSearchResults> {
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
        .select('id, name_family, name_given, national_id, telecom')
        .or(`name_family.ilike.%${queryText}%,name_given.cs.{${queryText}},telecom->>value.ilike.%${queryText}%,national_id.ilike.%${queryText}%`)
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
        .select('id, patient_id, patients(name_family, name_given), clinical_notes(evolution_note, plan)')
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
                    url: `/${clinicSlug}/patients/${p.id}`,
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
                subtitle: `Paciente • ${phone || p.national_id || 'Sin ID'}`,
                url: `/${clinicSlug}/patients/${p.id}`,
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
            const cn = Array.isArray(e.clinical_notes) ? e.clinical_notes[0] : e.clinical_notes;
            const noteText = cn?.evolution_note || cn?.plan || 'Empezar evaluación clínica...';
            results.push({
                id: e.id,
                type: 'encounter',
                title: `Nota: ${noteText.substring(0, 50)}...`,
                subtitle: `Historia Clínica • ${patientName}`,
                url: `/${clinicSlug}/history?patientId=${e.patient_id}`,
            });
        });
    }

    // Group results by type
    const grouped: Record<string, SearchResult[]> = {
        patient: [],
        appointment: [],
        medication: [],
        encounter: [],
    };

    results.forEach(r => {
        if (grouped[r.type]) {
            grouped[r.type].push(r);
        }
    });

    // Build grouped output, only include types with results
    const groupedResults: GroupedSearchResults = Object.entries(grouped)
        .filter(([, items]) => items.length > 0)
        .map(([type]) => ({
            type: type as 'patient' | 'appointment' | 'encounter' | 'medication',
            label: TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].label,
            icon: TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].icon,
            color: TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].color,
            results: grouped[type],
        }));

    return groupedResults;
}

/**
 * searchPatientIds(queryText)
 * Devuelve IDs de pacientes que coinciden con el término de búsqueda.
 * Usa la misma lógica de `searchGlobal` (ilike en name_family + cs en name_given + ilike en telecom/national_id)
 * con fallback a `search_patients_fuzzy` (pg_trgm similarity) si no hay coincidencias directas.
 *
 * Usado por las tablas de /history/all y /prescriptions para filtrar por paciente
 * sin tener que depender de la sintaxis .or() con columnas join (que no soporta `cs`).
 */
export async function searchPatientIds(queryText: string): Promise<string[]> {
    if (!queryText || queryText.trim().length < 2) return [];

    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return [];

    const trimmed = queryText.trim();

    // 1. Direct match: same logic as searchGlobal (patients table, not a join)
    const { data: directMatches, error: directError } = await supabase
        .from('patients')
        .select('id')
        .or(`name_family.ilike.%${trimmed}%,name_given.cs.{${trimmed}},telecom->>value.ilike.%${trimmed}%,national_id.ilike.%${trimmed}%`)
        .eq('practitioner_id', practitionerId)
        .limit(50);

    if (directError) {
        console.error('[searchPatientIds] direct match error:', directError);
    }

    let ids: string[] = (directMatches || []).map((p: { id: string }) => p.id);

    // 2. Fuzzy fallback: pg_trgm similarity on full name (family + given)
    if (ids.length === 0) {
        const { data: fuzzyMatches } = await (supabase as any).rpc('search_patients_fuzzy', {
            search_term: trimmed,
            p_id: practitionerId,
        });
        if (fuzzyMatches && Array.isArray(fuzzyMatches)) {
            ids = (fuzzyMatches as Array<{ id: string }>).map((p) => p.id);
        }
    }

    return ids;
}

/**
 * searchClinicalNoteEncounterIds(queryText)
 * Devuelve IDs de encounters cuya nota clínica coincide con el término de búsqueda.
 * Usa la RPC `search_clinical_notes_fuzzy` (pg_trgm similarity) que busca en
 * `subjective`, `plan` y `evolution_note` de clinical_notes.
 *
 * Usado por /history/all para que la búsqueda incluya contenido de las notas
 * SOAP (no solo nombre del paciente).
 */
export async function searchClinicalNoteEncounterIds(queryText: string): Promise<string[]> {
    if (!queryText || queryText.trim().length < 2) return [];

    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return [];

    const trimmed = queryText.trim();

    const { data: matches, error } = await (supabase as any).rpc('search_clinical_notes_fuzzy', {
        search_term: trimmed,
        p_practitioner_id: practitionerId,
    });

    if (error) {
        console.error('[searchClinicalNoteEncounterIds] RPC error:', error);
        return [];
    }

    if (!matches || !Array.isArray(matches)) return [];
    return (matches as Array<{ encounter_id: string }>).map((m) => m.encounter_id);
}
