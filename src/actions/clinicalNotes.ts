'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { clinicalNoteSchema } from '@/lib/schemas/encounter.schema';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';
import type { Json, ClinicalNote } from '@/types/database.types';

/**
 * getClinicalNote(encounterId)
 * Retorna la nota clínica (SOAP) de un encuentro.
 */
export async function getClinicalNote(encounterId: string): Promise<{ data: ClinicalNote | null; error?: string }> {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { data: null, error: 'No autorizado' };

    const { data, error } = await supabase
        .from('clinical_notes')
        .select('*')
        .eq('encounter_id', encounterId)
        .eq('practitioner_id', practitionerId)
        .single();

    if (error) return { data: null, error: error.message };
    return { data };
}

/**
 * updateClinicalNote(encounterId, formData)
 * Guarda borrador de la nota SOAP. Solo si el encuentro no está finalizado.
 */
export async function updateClinicalNote(encounterId: string, formData: {
    subjective?: string;
    objective?: string;
    analysis?: string;
    plan?: string;
    evolution_note?: string;
    physical_exam?: Json;
    diagnosis?: Json;
    reason_code?: Json;
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    // Verificar que la nota no esté finalizada
    const { data: existing } = await supabase
        .from('clinical_notes')
        .select('is_finalized')
        .eq('encounter_id', encounterId)
        .eq('practitioner_id', practitionerId)
        .single();

    if (!existing) return { error: 'Nota clínica no encontrada.' };
    if (existing.is_finalized) return { error: 'No se puede editar una nota clínica finalizada.' };

    const validation = clinicalNoteSchema.safeParse(formData);
    if (!validation.success) return { error: z.flattenError(validation.error).fieldErrors };

    const { data, error } = await supabase
        .from('clinical_notes')
        .update({
            subjective: formData.subjective,
            objective: formData.objective,
            analysis: formData.analysis,
            plan: formData.plan,
            evolution_note: formData.evolution_note,
            physical_exam: formData.physical_exam,
            diagnosis: formData.diagnosis,
            reason_code: formData.reason_code,
            updated_at: new Date().toISOString(),
        })
        .eq('encounter_id', encounterId)
        .eq('practitioner_id', practitionerId)
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath('/history');
    return { data };
}

/**
 * searchClinicalNotes(query)
 * Búsqueda fulltext sobre notas SOAP del practitioner autenticado.
 * Usa el índice GIN creado en la migración.
 */
export async function searchClinicalNotes(query: string): Promise<{ data: ClinicalNote[] }> {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId || !query.trim()) return { data: [] };

    // Búsqueda con operador @@ y to_tsquery en español
    const { data, error } = await supabase
        .from('clinical_notes')
        .select('*')
        .eq('practitioner_id', practitionerId)
        // Fallback con ILIKE si no hay soporte FTS en el cliente
        .or(`subjective.ilike.%${query}%,objective.ilike.%${query}%,analysis.ilike.%${query}%,plan.ilike.%${query}%`)
        .limit(20);

    if (error) {
        console.error('Error searching clinical notes:', error);
        return { data: [] };
    }

    return { data: data || [] };
}
