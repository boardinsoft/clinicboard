'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { encounterSchema } from '@/lib/schemas/encounter.schema';
import { EncounterStatus, VitalSigns } from '@/lib/fhir/types';
import type { Json } from '@/types/database.types';

/**
 * FHIR R4 Encounter State Machine
 */
const VALID_ENCOUNTER_TRANSITIONS: Record<EncounterStatus, EncounterStatus[]> = {
    'planned': ['arrived', 'cancelled', 'in-progress'],
    'arrived': ['triaged', 'in-progress', 'cancelled'],
    'triaged': ['in-progress', 'cancelled'],
    'in-progress': ['onleave', 'finished', 'cancelled'],
    'onleave': ['in-progress', 'finished'],
    'finished': [], // Terminal
    'cancelled': [], // Terminal
    'entered-in-error': [],
    'unknown': ['planned', 'arrived', 'triaged', 'in-progress', 'finished', 'cancelled']
};

function validateEncounterTransition(current: EncounterStatus, target: EncounterStatus): { isValid: boolean; error?: string } {
    if (current === target) return { isValid: true };
    const allowed = VALID_ENCOUNTER_TRANSITIONS[current] || [];
    if (allowed.includes(target)) return { isValid: true };
    return {
        isValid: false,
        error: `Transición de encuentro inválida: de '${current}' a '${target}'. Permitidos: [${allowed.join(', ')}]`
    };
}

/**
 * Maps incoming VitalSigns from UI to DB structure.
 */
function mapVitalSigns(signs?: VitalSigns) {
    if (!signs) return undefined;
    return {
        temperature: signs.temperature,
        blood_pressure_systolic: signs.bloodPressureSystolic,
        blood_pressure_diastolic: signs.bloodPressureDiastolic,
        heart_rate: signs.heartRate,
        oxygen_saturation: signs.oxygenSaturation,
        weight: signs.weight,
        height: signs.height,
    };
}

/**
 * createEncounter(data)
 */
export async function createEncounter(formData: {
    patient_id: string;
    encounter_class: 'AMB' | 'IMP' | 'EMER' | 'HH';
    start_time: string;
    appointment_id?: string;
    status?: EncounterStatus;
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const encounterData = {
        ...formData,
        practitioner_id: user.id,
        status: formData.status || 'planned',
    };

    const validation = encounterSchema.safeParse(encounterData);
    if (!validation.success) return { error: validation.error.flatten().fieldErrors };

    const { data, error } = await supabase
        .from('encounters')
        .insert([{
            patient_id: validation.data.patient_id,
            practitioner_id: user.id,
            encounter_class: validation.data.encounter_class,
            status: validation.data.status,
            start_time: validation.data.start_time,
            appointment_id: validation.data.appointment_id,
        }])
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath('/history');
    return { data };
}

/**
 * saveEncounterDraft(id, formData)
 * Auto-save or draft update. Keep status 'in-progress'.
 */
export async function saveEncounterDraft(id: string, formData: {
    subjective?: string;
    objective?: string;
    analysis?: string;
    plan?: string;
    evolution_note?: string;
    vital_signs?: VitalSigns;
    physical_exam?: Json;
    diagnosis?: Json;
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    // Get current status to ensure it's in-progress or similar
    const { data: encounter } = await supabase
        .from('encounters')
        .select('status')
        .eq('id', id)
        .single();

    if (!encounter) return { error: 'Encuentro no encontrado' };
    if (encounter.status === 'finished') return { error: 'No se puede editar un encuentro finalizado.' };

    const { data, error } = await supabase
        .from('encounters')
        .update({
            subjective: formData.subjective,
            objective: formData.objective,
            analysis: formData.analysis,
            plan: formData.plan,
            evolution_note: formData.evolution_note,
            vital_signs: mapVitalSigns(formData.vital_signs),
            physical_exam: formData.physical_exam,
            diagnosis: formData.diagnosis,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('practitioner_id', user.id)
        .select()
        .single();

    if (error) return { error: error.message };
    return { data };
}

/**
 * finalizeEncounter(id)
 * Close and Sign. Transition to 'finished'.
 */
export async function finalizeEncounter(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const { data: encounter } = await supabase
        .from('encounters')
        .select('status')
        .eq('id', id)
        .single();

    if (!encounter) return { error: 'Encuentro no encontrado' };

    const transition = validateEncounterTransition(encounter.status as EncounterStatus, 'finished');
    if (!transition.isValid) return { error: transition.error };

    const { data, error } = await supabase
        .from('encounters')
        .update({
            status: 'finished',
            end_time: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('practitioner_id', user.id)
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath('/history');
    return { data };
}

export async function getEncounters(patientId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: [] };

    const { data, error } = await supabase
        .from('encounters')
        .select(`
            *,
            practitioner:practitioners(name_given, name_family, specialty)
        `)
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false });

    if (error) {
        console.error('Error fetching encounters:', error);
        return { data: [] };
    }

    return { data: data || [] };
}

/**
 * createAddendum(encounterId, content)
 * Adds an immutable note to a finished encounter.
 */
export async function createAddendum(encounterId: string, content: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const { data, error } = await supabase
        .from('encounter_addenda')
        .insert([{
            encounter_id: encounterId,
            author_id: user.id,
            content,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath('/history');
    return { data };
}

/**
 * getAddenda(encounterId)
 */
export async function getAddenda(encounterId: string) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from('encounter_addenda')
        .select(`
            *,
            author:practitioners(name_family, name_given)
        `)
        .eq('encounter_id', encounterId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching addenda:', error);
        return { data: [] };
    }

    return { data: data || [] };
}
