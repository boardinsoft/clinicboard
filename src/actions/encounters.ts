'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { encounterSchema } from '@/lib/schemas/encounter.schema';
import { EncounterStatus, VitalSigns } from '@/lib/fhir/types';
import type { Json } from '@/types/database.types';

/**
 * Maps incoming camelCase VitalSigns from the UI to the snake_case schema/DB structure.
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
 * Create an encounter in 'planned' status.
 */
export async function createEncounter(formData: {
    patient_id: string;
    encounter_class: 'AMB' | 'IMP' | 'EMER' | 'HH';
    start_time: string;
    vital_signs?: VitalSigns;
    evolution_note?: string;
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado. Sesión no encontrada.' };
    }

    // Prepare data with defaults and mapped vital signs
    const encounterData = {
        ...formData,
        vital_signs: mapVitalSigns(formData.vital_signs),
        practitioner_id: user.id,
        status: 'planned' as EncounterStatus,
    };

    // Validate with schema
    const validation = encounterSchema.safeParse(encounterData);

    if (!validation.success) {
        return { error: validation.error.flatten().fieldErrors };
    }

    const { data, error } = await supabase
        .from('encounters')
        .insert([{
            patient_id: validation.data.patient_id,
            practitioner_id: validation.data.practitioner_id,
            encounter_class: validation.data.encounter_class,
            status: validation.data.status,
            start_time: validation.data.start_time,
            vital_signs: validation.data.vital_signs,
            evolution_note: validation.data.evolution_note,
        }])
        .select()
        .single();

    if (error) {
        console.error('Error in createEncounter:', error);
        return { error: error.message };
    }

    revalidatePath('/history');
    return { data };
}

/**
 * startEncounter(id)
 * Transition from 'planned' to 'in-progress'.
 */
export async function startEncounter(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('encounters')
        .update({
            status: 'in-progress',
            start_time: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('practitioner_id', user.id)
        .eq('status', 'planned')
        .select()
        .single();

    if (error) {
        console.error('Error in startEncounter:', error);
        return { error: 'Error al iniciar encuentro. Verifique que el encuentro sea el propietario y esté en estado "planned".' };
    }

    revalidatePath('/history');
    return { data };
}

/**
 * finishEncounter(id, formData)
 * Transition from 'in-progress' to 'finished'.
 */
export async function finishEncounter(id: string, formData: {
    evolution_note?: string;
    vital_signs?: VitalSigns;
    diagnosis?: Json; // FHIR diagnosis structure
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('encounters')
        .update({
            status: 'finished',
            end_time: new Date().toISOString(),
            evolution_note: formData.evolution_note,
            vital_signs: mapVitalSigns(formData.vital_signs),
            diagnosis: formData.diagnosis,
        })
        .eq('id', id)
        .eq('practitioner_id', user.id)
        .eq('status', 'in-progress')
        .select()
        .single();

    if (error) {
        console.error('Error in finishEncounter:', error);
        return { error: 'Error al finalizar encuentro. Verifique que sea el propietario y esté "in-progress".' };
    }

    revalidatePath('/history');
    return { data };
}

/**
 * updateEncounterNote(id, evolution_note)
 * Only update clinical notes.
 */
export async function updateEncounterNote(id: string, evolution_note: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('encounters')
        .update({
            evolution_note,
        })
        .eq('id', id)
        .eq('practitioner_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error in updateEncounterNote:', error);
        return { error: error.message };
    }

    return { data };
}
