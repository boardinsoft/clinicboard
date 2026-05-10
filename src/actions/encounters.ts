'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { encounterSchema } from '@/lib/schemas/encounter.schema';
import { EncounterStatus, VitalSigns } from '@/lib/fhir/types';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';
import type { Json, EncounterWithClinicalNote, Database } from '@/types/database.types';

/**
 * FHIR R4 Encounter State Machine
 */
const VALID_ENCOUNTER_TRANSITIONS: Record<EncounterStatus, EncounterStatus[]> = {
    'planned': ['arrived', 'cancelled', 'in-progress'],
    'arrived': ['triaged', 'in-progress', 'cancelled'],
    'triaged': ['in-progress', 'cancelled'],
    'in-progress': ['onleave', 'finished', 'cancelled'],
    'onleave': ['in-progress', 'finished'],
    'finished': [],
    'cancelled': [],
    'entered-in-error': [],
    'unknown': ['planned', 'arrived', 'triaged', 'in-progress', 'finished', 'cancelled'],
};

function validateEncounterTransition(current: EncounterStatus, target: EncounterStatus): { isValid: boolean; error?: string } {
    if (current === target) return { isValid: true };
    const allowed = VALID_ENCOUNTER_TRANSITIONS[current] || [];
    if (allowed.includes(target)) return { isValid: true };
    return {
        isValid: false,
        error: `Transición de encuentro inválida: de '${current}' a '${target}'. Permitidos: [${allowed.join(', ')}]`,
    };
}

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
 * appointment_id es REQUERIDO — un encuentro siempre debe tener una cita asociada.
 */
export async function createEncounter(formData: {
    patient_id: string;
    encounter_class: 'AMB' | 'IMP' | 'EMER' | 'HH';
    start_time: string;
    appointment_id: string;          // ← requerido, no opcional
    status?: EncounterStatus;
    encounter_category?: string;
    encounter_subcategory?: string;
    clinic_id: string;
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado. Perfil de profesional no encontrado.' };

    if (!formData.clinic_id) return { error: 'Clínica no especificada.' };

    const encounterData = {
        ...formData,
        practitioner_id: practitionerId,
        status: formData.status || 'planned',
    };

    const validation = encounterSchema.safeParse(encounterData);
    if (!validation.success) return { error: z.flattenError(validation.error).fieldErrors };

    // Verificar que la cita existe y pertenece al practitioner y clínica
    const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .select('id, patient_id, clinic_id')
        .eq('id', formData.appointment_id)
        .eq('practitioner_id', practitionerId)
        .eq('clinic_id', formData.clinic_id)
        .single();

    if (apptError || !appt) {
        return { error: 'Se requiere una cita válida para crear un encuentro. La cita no existe o no te pertenece.' };
    }

    // Crear el encounter
    const { data: encounter, error: encError } = await supabase
        .from('encounters')
        .insert([{
            patient_id: validation.data.patient_id,
            practitioner_id: practitionerId,
            clinic_id: validation.data.clinic_id,
            encounter_class: validation.data.encounter_class,
            encounter_category: validation.data.encounter_category,
            encounter_subcategory: validation.data.encounter_subcategory,
            status: validation.data.status,
            start_time: validation.data.start_time,
            appointment_id: validation.data.appointment_id,
        }])
        .select()
        .single();

    if (encError || !encounter) return { error: encError?.message || 'Error al crear el encuentro.' };

    // Crear la clinical_note vacía (1:1 con encounter)
    const { data: clinicalNote, error: noteError } = await supabase
        .from('clinical_notes')
        .insert([{
            encounter_id: encounter.id,
            patient_id: validation.data.patient_id,
            practitioner_id: practitionerId,
            clinic_id: validation.data.clinic_id,
            is_finalized: false,
        }])
        .select()
        .single();

    if (noteError) {
        // Rollback: eliminar el encounter si no se pudo crear la nota
        await supabase.from('encounters').delete().eq('id', encounter.id);
        console.error('[createEncounter] Clinical note insert error:', noteError);
        return {
            error: 'Error al crear la nota clínica del encuentro.',
            details: noteError?.message || null,
        };
    }

    revalidatePath('/history');
    return { data: { encounter, clinical_note: clinicalNote } };
}

/**
 * startWalkInEncounter(payload)
 * Crea un encounter para un paciente sin cita previa: genera la cita de cola
 * (walk-in, status=arrived) y el encuentro clínico asociado en un solo paso.
 */
export async function startWalkInEncounter(payload: {
    patient_id: string;
    clinic_id: string;
    encounter_class?: 'AMB' | 'IMP' | 'EMER' | 'HH';
    encounter_category?: string;
    appointment_type?: string;
    description?: string;
}) {
    const { patient_id: patientId, clinic_id: clinicId, encounter_class: encClass, encounter_category: encCategory, appointment_type: apptType, description: apptDesc } = payload;
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };
    if (!clinicId) return { error: 'Clínica no especificada.' };

    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil((minutes + 1) / 15) * 15;
    now.setMinutes(roundedMinutes, 0, 0);
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + 15 * 60000).toISOString();

    const { nowInVE, toISODate } = await import('@/lib/date-utils');
    const localToday = toISODate(nowInVE());
    const startOfLocalDay = `${localToday}T00:00:00-04:00`;

    const { data: lastInQueue } = await supabase
        .from('appointments')
        .select('queue_position')
        .eq('practitioner_id', practitionerId)
        .eq('clinic_id', clinicId)
        .gte('start_time', startOfLocalDay)
        .order('queue_position', { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextPosition = (lastInQueue?.queue_position || 0) + 1;

    const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .insert([{
            patient_id: patientId,
            practitioner_id: practitionerId,
            clinic_id: clinicId,
            status: 'arrived',
            start_time: startTime,
            end_time: endTime,
            description: apptDesc || 'Consulta por orden de llegada (Walk-In)',
            queue_position: nextPosition,
            appointment_type: apptType || 'walk-in',
        }])
        .select()
        .single();

    if (apptError || !appointment) {
        console.error('[startWalkInEncounter] Appointment insert error:', apptError);
        return { error: apptError?.message || 'Error al registrar la cita de llegada.' };
    }

    const { data: encounter, error: encError } = await supabase
        .from('encounters')
        .insert([{
            patient_id: patientId,
            practitioner_id: practitionerId,
            clinic_id: clinicId,
            encounter_class: encClass || 'AMB',
            encounter_category: encCategory || 'Consulta General',
            status: 'arrived',
            start_time: startTime,
            appointment_id: appointment.id,
        }])
        .select()
        .single();

    if (encError || !encounter) {
        await supabase.from('appointments').delete().eq('id', appointment.id);
        console.error('[startWalkInEncounter] Encounter insert error:', encError);
        return { error: encError?.message || 'Error al crear el encuentro.' };
    }

    const { data: clinicalNote, error: noteError } = await supabase
        .from('clinical_notes')
        .insert([{
            encounter_id: encounter.id,
            patient_id: patientId,
            practitioner_id: practitionerId,
            clinic_id: clinicId,
            is_finalized: false,
        }])
        .select()
        .single();

    if (noteError || !clinicalNote) {
        await supabase.from('encounters').delete().eq('id', encounter.id);
        await supabase.from('appointments').delete().eq('id', appointment.id);
        console.error('[startWalkInEncounter] Clinical note insert error:', noteError);
        return {
            error: 'Error al crear la nota clínica del encuentro.',
            details: noteError?.message || null,
        };
    }

    revalidatePath('/appointments');
    revalidatePath('/history');
    return { data: { encounter, clinical_note: clinicalNote } };
}

/**
 * saveEncounterDraft(id, formData)
 * Guarda vitales en encounters y datos SOAP en clinical_notes en paralelo.
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
    reason_code?: Json;
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    const { data: encounter } = await supabase
        .from('encounters')
        .select('status')
        .eq('id', id)
        .eq('practitioner_id', practitionerId)
        .single();

    if (!encounter) return { error: 'Encuentro no encontrado o sin permisos.' };
    if (encounter.status === 'finished') return { error: 'No se puede editar un encuentro finalizado.' };

    const [encResult, noteResult] = await Promise.all([
        // Actualizar datos del evento (vitales) en encounters
        supabase
            .from('encounters')
            .update({
                vital_signs: mapVitalSigns(formData.vital_signs),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('practitioner_id', practitionerId)
            .select()
            .single(),
        // Actualizar notas SOAP en clinical_notes
        supabase
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
            .eq('encounter_id', id)
            .eq('practitioner_id', practitionerId)
            .select()
            .single(),
    ]);

    if (encResult.error) return { error: encResult.error.message };
    if (noteResult.error) return { error: noteResult.error.message };

    return { data: { encounter: encResult.data, clinical_note: noteResult.data } };
}

/**
 * finalizeEncounter(id)
 * Cierra y firma el encuentro. Transiciona a 'finished'.
 */
export async function finalizeEncounter(id: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    const { data: encounter } = await supabase
        .from('encounters')
        .select('status')
        .eq('id', id)
        .single();

    if (!encounter) return { error: 'Encuentro no encontrado' };

    const transition = validateEncounterTransition(encounter.status as EncounterStatus, 'finished');
    if (!transition.isValid) return { error: transition.error };

    const now = new Date().toISOString();

    const [encResult, noteResult] = await Promise.all([
        supabase
            .from('encounters')
            .update({ status: 'finished', end_time: now })
            .eq('id', id)
            .eq('practitioner_id', practitionerId)
            .select()
            .single(),
        supabase
            .from('clinical_notes')
            .update({ is_finalized: true, updated_at: now })
            .eq('encounter_id', id)
            .eq('practitioner_id', practitionerId)
            .select()
            .single(),
    ]);

    if (encResult.error) return { error: encResult.error.message };

    revalidatePath('/history');
    return { data: { encounter: encResult.data, clinical_note: noteResult.data } };
}

/**
 * getEncounters(patientId)
 * Retorna encuentros con su nota clínica y datos del profesional.
 */
export async function getEncounters(patientId: string): Promise<{ data: EncounterWithClinicalNote[] }> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: [] };

    const { data, error } = await supabase
        .from('encounters')
        .select(`
            *,
            practitioner:practitioners(name_given, name_family, specialty),
            clinical_note:clinical_notes(*)
        `)
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false });

    if (error) {
        console.error('Error fetching encounters:', error);
        return { data: [] };
    }

    return { data: (data || []) as EncounterWithClinicalNote[] };
}

/**
 * getEncounterById(encounterId)
 * Retorna un encuentro por su ID con nota clínica y datos del profesional.
 */
export async function getEncounterById(encounterId: string): Promise<{ data: EncounterWithClinicalNote | null }> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
        .from('encounters')
        .select(`
            *,
            practitioner:practitioners(name_given, name_family, specialty),
            clinical_note:clinical_notes(*)
        `)
        .eq('id', encounterId)
        .single();

    if (error) {
        console.error('Error fetching encounter by id:', error);
        return { data: null };
    }

    return { data: data as EncounterWithClinicalNote };
}

/**
 * getEncountersFiltered(filters)
 * Retorna encuentros del practitioner autenticado con filtros opcionales.
 * Para la vista tabla /history/all.
 */
export async function getEncountersFiltered(filters?: {
    search?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    clinicId?: string;
}): Promise<{ data: EncounterWithClinicalNote[] }> {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { data: [] };

    let query = supabase
        .from('encounters')
        .select(`
            *,
            patient:patients(id, name_given, name_family, birth_date),
            practitioner:practitioners(name_given, name_family, specialty),
            clinical_note:clinical_notes(reason_code, subjective, plan, is_finalized)
        `)
        .eq('practitioner_id', practitionerId)
        .order('start_time', { ascending: false })
        .limit(50);

    if (filters?.clinicId) {
        query = query.eq('clinic_id', filters.clinicId);
    }

    if (filters?.status) {
        query = query.eq('status', filters.status as Database['public']['Enums']['encounter_status']);
    }
    if (filters?.date_from) {
        query = query.gte('start_time', filters.date_from);
    }
    if (filters?.date_to) {
        query = query.lte('start_time', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching filtered encounters:', error);
        return { data: [] };
    }

    // Filtrado por search en memoria (nombre de paciente + motivo)
    let results = (data || []) as EncounterWithClinicalNote[];
    if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(enc => {
            const patient = (enc as unknown as { patient?: { name_given: string[]; name_family: string } }).patient;
            const note = enc.clinical_note;
            const patientName = patient
                ? `${(patient.name_given || []).join(' ')} ${patient.name_family}`.toLowerCase()
                : '';
            const reason = Array.isArray(note?.reason_code)
                ? (note.reason_code as { text?: string }[]).map(r => r.text || '').join(' ').toLowerCase()
                : '';
            return patientName.includes(q) || reason.includes(q);
        });
    }

    return { data: results };
}

/**
 * createAddendum(encounterId, content)
 * Agrega una nota inmutable a un encuentro finalizado.
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
            created_at: new Date().toISOString(),
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .order('created_at', { ascending: true }) as any;

    if (error) {
        console.error('Error fetching addenda:', error);
        return { data: [] };
    }

    return { data: data || [] };
}
