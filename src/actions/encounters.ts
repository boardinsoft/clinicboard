'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { encounterSchema } from '@/lib/schemas/encounter.schema';
import { EncounterStatus, VitalSigns } from '@/lib/fhir/types';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';
import { searchPatientIds, searchClinicalNoteEncounterIds } from '@/actions/search';
import type { Json, EncounterWithClinicalNote, Database } from '@/types/database.types';

const ENCOUNTER_STATUS_LABELS: Record<EncounterStatus, string> = {
    planned: 'Planificada',
    arrived: 'Llegada',
    triaged: 'Triaje',
    'in-progress': 'En Consulta',
    onleave: 'Pausa',
    finished: 'Finalizada',
    cancelled: 'Cancelada',
    'entered-in-error': 'Error de Entrada',
    unknown: 'Desconocido',
};

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
    const currentLabel = ENCOUNTER_STATUS_LABELS[current] || current;
    const targetLabel = ENCOUNTER_STATUS_LABELS[target] || target;
    return {
        isValid: false,
        error: `No se puede cambiar el estado del encuentro de '${currentLabel}' a '${targetLabel}'.`,
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
    source?: string;
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
            source: validation.data.source,
        }])
        .select()
        .single();

    if (encError || !encounter) return { error: 'No se pudo crear el encuentro. Intenta de nuevo.' };

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
            error: 'No se pudo crear la nota clínica. Intenta de nuevo.',
            details: null,
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
    workflow_type?: 'quick' | 'with-evaluation';
    force_create?: boolean;
}) {
    const { patient_id: patientId, clinic_id: clinicId, encounter_class: encClass, encounter_category: encCategory, appointment_type: apptType, description: apptDesc, workflow_type: wfType, force_create } = payload;
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };
    if (!clinicId) return { error: 'Clínica no especificada.' };

    // 1. Check if patient already has an active encounter (in-progress, arrived, or triaged)
    const { data: activeEncounter } = await supabase
        .from('encounters')
        .select('id, status, start_time')
        .eq('patient_id', patientId)
        .in('status', ['in-progress', 'arrived', 'triaged'])
        .maybeSingle();

    if (activeEncounter) {
        const statusLabel = ENCOUNTER_STATUS_LABELS[activeEncounter.status as EncounterStatus] || activeEncounter.status;
        return {
            error: `El paciente ya tiene una consulta activa en estado '${statusLabel}' desde ${new Date(activeEncounter.start_time).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}. Completa o cancela la consulta existente primero.`,
            activeEncounterId: activeEncounter.id,
        };
    }

    // 2. Check if patient already had a walk-in encounter today (prevent duplicates same day)
    const { nowInVE, toISODate } = await import('@/lib/date-utils');
    const localToday = toISODate(nowInVE());
    const startOfLocalDay = `${localToday}T00:00:00-04:00`;
    const endOfLocalDay = `${localToday}T23:59:59-04:00`;

    const { data: todayEncounter } = await supabase
        .from('encounters')
        .select('id, start_time, appointment_id')
        .eq('patient_id', patientId)
        .eq('practitioner_id', practitionerId)
        .eq('clinic_id', clinicId)
        .gte('start_time', startOfLocalDay)
        .lt('start_time', endOfLocalDay)
        .not('status', 'eq', 'cancelled')
        .maybeSingle();

    if (todayEncounter && !force_create) {
        // Get appointment details for context
        const { data: appt } = await supabase
            .from('appointments')
            .select('start_time')
            .eq('id', todayEncounter.appointment_id)
            .maybeSingle();

        return {
            error: 'duplicate_same_day',
            todayEncounterId: todayEncounter.id,
            previousEncounterTime: todayEncounter.start_time,
            previousAppointmentTime: appt?.start_time || null,
        };
    }

    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil((minutes + 1) / 15) * 15;
    now.setMinutes(roundedMinutes, 0, 0);
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + 15 * 60000).toISOString();

    // 3. Use atomic function to get next queue position (prevents race conditions)
    const { data: nextPosition, error: rpcError } = await supabase.rpc('get_next_queue_position_locked' as any, {
        p_practitioner_id: practitionerId,
        p_clinic_id: clinicId,
        p_date: localToday,
    });

    if (rpcError) {
        console.error('[startWalkInEncounter] RPC error:', rpcError);
        return { error: 'Error al calcular la posición en cola. Intenta de nuevo.' };
    }

    if (typeof nextPosition !== 'number') {
        console.error('[startWalkInEncounter] Invalid queue position:', nextPosition, { practitionerId, clinicId, localToday });
        return { error: 'Error al calcular la posición en cola. Intenta de nuevo.' };
    }

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
        return { error: 'No se pudo registrar la cita de llegada. Intenta de nuevo.' };
    }

    // Write audit log for appointment creation (explicit, in addition to DB trigger)
    await supabase.from('appointment_audit_log').insert([{
        appointment_id: appointment.id,
        changed_by: practitionerId,
        old_status: null,
        new_status: 'arrived',
        notes: `Walk-in creado: ${apptDesc || 'Consulta por orden de llegada'}`,
    }]);

    const encounterStatus = wfType === 'quick' ? 'in-progress' : 'arrived';

    const { data: encounter, error: encError } = await supabase
        .from('encounters')
        .insert([{
            patient_id: patientId,
            practitioner_id: practitionerId,
            clinic_id: clinicId,
            encounter_class: encClass || 'AMB',
            encounter_category: encCategory || 'Consulta General',
            status: encounterStatus,
            start_time: startTime,
            appointment_id: appointment.id,
            source: 'walk-in-dialog',
        }])
        .select()
        .single();

    if (encError || !encounter) {
        await supabase.from('appointments').delete().eq('id', appointment.id);
        console.error('[startWalkInEncounter] Encounter insert error:', encError);
        return { error: 'No se pudo crear el encuentro. Intenta de nuevo.' };
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
            error: 'No se pudo crear la nota clínica. Intenta de nuevo.',
            details: null,
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

    // Capture previous state for audit
    const { data: prevEncounter } = await supabase
        .from('encounters').select('vital_signs').eq('id', id).single();
    const { data: prevNote } = await supabase
        .from('clinical_notes').select('subjective, objective, analysis, plan')
        .eq('encounter_id', id).single();

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

    if (encResult.error) return { error: 'No se pudieron guardar los signos vitales. Intenta de nuevo.' };
    if (noteResult.error) return { error: 'No se pudo guardar la nota clínica. Intenta de nuevo.' };

    // Audit the draft save (vital signs and SOAP changes)
    await (supabase as any).from('encounter_draft_audit_log').insert([{
        encounter_id: id,
        changed_by: practitionerId,
        vital_signs_snapshot: prevEncounter?.vital_signs ?? null,
        soap_snapshot: {
            subjective: prevNote?.subjective,
            objective: prevNote?.objective,
            analysis: prevNote?.analysis,
            plan: prevNote?.plan,
        },
        change_type: 'updated',
    }]);

    return { data: { encounter: encResult.data, clinical_note: noteResult.data } };
}

/**
 * updateEncounterStatus(id, newStatus)
 * Transiciona el encuentro a un nuevo estado válido.
 */
export async function updateEncounterStatus(id: string, newStatus: EncounterStatus, reason?: string) {
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

    const oldStatus = encounter.status as EncounterStatus;
    const transition = validateEncounterTransition(oldStatus, newStatus);
    if (!transition.isValid) return { error: transition.error };

    // Update + explicit audit log (in addition to DB trigger for redundancy)
    const [{ data, error }] = await Promise.all([
        supabase
            .from('encounters')
            .update({ status: newStatus as Database['public']['Enums']['encounter_status'], updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('practitioner_id', practitionerId)
            .select()
            .single(),
        // Explicit audit entry (DB trigger also creates one, but this is explicit)
        (supabase as any).from('encounter_audit_log').insert([{
            encounter_id: id,
            changed_by: practitionerId,
            old_status: oldStatus,
            new_status: newStatus,
            notes: reason || 'Cambio de estado manual',
            change_reason: 'manual_transition',
        }]),
    ]);

    if (error) return { error: 'No se pudo actualizar el estado del encuentro. Intenta de nuevo.' };

    revalidatePath('/history');
    return { data };
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

    if (encResult.error) return { error: 'No se pudo finalizar el encuentro. Intenta de nuevo.' };

    // Explicit audit for encounter finalization
    await (supabase as any).from('encounter_audit_log').insert([{
        encounter_id: id,
        changed_by: practitionerId,
        old_status: encounter.status,
        new_status: 'finished',
        notes: 'Encuentro finalizado y firmado',
        change_reason: 'finalized',
    }]);

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
export type EncounterFilters = {
    search?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    clinicId?: string;
    page?: number;
    pageSize?: number;
};

export async function getEncountersFiltered(filters?: EncounterFilters): Promise<{
    data: EncounterWithClinicalNote[];
    count?: number;
    statusCounts?: Record<string, number>;
}> {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { data: [] };

    let searchEncounterIds: string[] | null = null;
    if (filters?.search) {
        const [patientIds, noteEncounterIds] = await Promise.all([
            searchPatientIds(filters.search),
            searchClinicalNoteEncounterIds(filters.search),
        ]);

        if ((!patientIds || patientIds.length === 0) && (!noteEncounterIds || noteEncounterIds.length === 0)) {
            // No matches at all → force empty result
            searchEncounterIds = ['00000000-0000-0000-0000-000000000000'];
        } else {
            // Combine: encounters that match the patient OR the clinical note
            // - If patientIds has results, get all encounter IDs for those patients
            // - Add noteEncounterIds
            // - Dedupe
            const combinedIds = new Set<string>(noteEncounterIds || []);

            if (patientIds && patientIds.length > 0) {
                const { data: patientEncounters } = await supabase
                    .from('encounters')
                    .select('id')
                    .eq('practitioner_id', practitionerId)
                    .in('patient_id', patientIds);
                (patientEncounters || []).forEach((e: { id: string }) => combinedIds.add(e.id));
            }

            searchEncounterIds = Array.from(combinedIds);
        }
    }

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('encounters')
        .select(`
            *,
            patient:patients(id, name_given, name_family, birth_date),
            practitioner:practitioners(name_given, name_family, specialty),
            clinical_note:clinical_notes(reason_code, subjective, plan, is_finalized),
            appointment:appointments(id, start_time, appointment_type, status)
        `, { count: 'exact' })
        .eq('practitioner_id', practitionerId)
        .order('start_time', { ascending: false })
        .range(from, to);

    if (filters?.clinicId) {
        query = query.eq('clinic_id', filters.clinicId);
    }

    if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as Database['public']['Enums']['encounter_status']);
    }
    if (filters?.date_from) {
        query = query.gte('start_time', filters.date_from);
    }
    if (filters?.date_to) {
        const endOfDay = `${filters.date_to}T23:59:59.999Z`;
        query = query.lte('start_time', endOfDay);
    }
    if (searchEncounterIds) {
        if (searchEncounterIds.length === 1 && searchEncounterIds[0] === '00000000-0000-0000-0000-000000000000') {
            // Force empty result
            query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        } else {
            query = query.in('id', searchEncounterIds);
        }
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching filtered encounters:', error);
        return { data: [] };
    }

    const result: { data: EncounterWithClinicalNote[]; count?: number; statusCounts?: Record<string, number> } = {
        data: (data || []) as EncounterWithClinicalNote[],
        count: count ?? 0,
    };

    if (!filters?.status || filters.status === 'all') {
        const countsResult: Record<string, number> = { all: count ?? 0 };

        const dateToArg = filters?.date_to ? `${filters.date_to}T23:59:59.999Z` : null;
        const encounterIdsArg = searchEncounterIds && !(
            searchEncounterIds.length === 1 &&
            searchEncounterIds[0] === '00000000-0000-0000-0000-000000000000'
        ) ? searchEncounterIds : [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: countRows, error: countError } = await (supabase as any).rpc('get_encounter_status_counts', {
            p_practitioner_id: practitionerId,
            p_clinic_id: filters?.clinicId ?? null,
            p_date_from: filters?.date_from ?? null,
            p_date_to: dateToArg,
            p_search_encounter_ids: encounterIdsArg.length > 0 ? encounterIdsArg : null,
        });

        if (!countError && countRows && Array.isArray(countRows)) {
            for (const row of countRows as Array<{ status: string; count: number }>) {
                countsResult[row.status] = row.count;
            }
        }

        result.statusCounts = countsResult;
    }

    return result;
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

    if (error) return { error: 'No se pudo guardar la addenda. Intenta de nuevo.' };

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

const ENCOUNTER_TIMEOUT_GRACE_PERIOD_MINUTES = 15;
const ENCOUNTER_TIMEOUT_MAX_EXTENSIONS = 3;

async function getEncounterTypeConfig(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, encounterClass: string | null): Promise<number> {
    if (!encounterClass) return 45;
    const { data } = await supabase
        .from('encounter_type_config')
        .select('max_duration_minutes')
        .eq('encounter_class', encounterClass)
        .maybeSingle();
    return data?.max_duration_minutes ?? 45;
}

export async function getEncounterTimeStatus(encounterId: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    const { data: encounter, error } = await supabase
        .from('encounters')
        .select('id, status, start_time, notified_at, extended_count, encounter_class')
        .eq('id', encounterId)
        .eq('practitioner_id', practitionerId)
        .single();

    if (error || !encounter) return { error: 'Encuentro no encontrado' };

    if (encounter.status !== 'in-progress') {
        return { data: null };
    }

    const maxDurationMinutes = await getEncounterTypeConfig(supabase, encounter.encounter_class);
    const startTime = new Date(encounter.start_time);
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
    const isExpired = elapsedMinutes > maxDurationMinutes;
    const remainingMinutes = isExpired ? 0 : maxDurationMinutes - elapsedMinutes;

    let gracePeriodRemainingMinutes: number | null = null;
    const shouldAutoCancel = isExpired && encounter.notified_at !== null;

    if (shouldAutoCancel) {
        const notifiedAt = new Date(encounter.notified_at!);
        const gracePeriodEnd = new Date(notifiedAt.getTime() + ENCOUNTER_TIMEOUT_GRACE_PERIOD_MINUTES * 60000);
        gracePeriodRemainingMinutes = Math.max(0, Math.floor((gracePeriodEnd.getTime() - now.getTime()) / 60000));
    }

    const status = {
        encounterId: encounter.id,
        isExpired,
        isNotified: encounter.notified_at !== null,
        extendedCount: encounter.extended_count ?? 0,
        maxExtensions: ENCOUNTER_TIMEOUT_MAX_EXTENSIONS,
        maxDurationMinutes,
        elapsedMinutes,
        remainingMinutes,
        shouldAutoCancel,
        gracePeriodMinutes: ENCOUNTER_TIMEOUT_GRACE_PERIOD_MINUTES,
        gracePeriodRemainingMinutes,
    };

    return { data: status };
}

export async function extendEncounterTimeout(encounterId: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) return { error: 'No autorizado' };

    const { data: encounter, error } = await supabase
        .from('encounters')
        .select('id, status, extended_count, notified_at, encounter_class, start_time')
        .eq('id', encounterId)
        .eq('practitioner_id', practitionerId)
        .single();

    if (error || !encounter) return { error: 'Encuentro no encontrado' };
    if (encounter.status !== 'in-progress') return { error: 'El encuentro no está en consulta' };

    const currentExtendedCount = encounter.extended_count ?? 0;
    if (currentExtendedCount >= ENCOUNTER_TIMEOUT_MAX_EXTENSIONS) {
        return { error: `Se alcanzó el máximo de ${ENCOUNTER_TIMEOUT_MAX_EXTENSIONS} extensiones permitidas` };
    }

    const maxDurationMinutes = await getEncounterTypeConfig(supabase, encounter.encounter_class);
    const actualDurationMinutes = Math.floor((new Date().getTime() - new Date(encounter.start_time).getTime()) / 60000);

    const [{ data, error: updateError }] = await Promise.all([
        supabase
            .from('encounters')
            .update({
                notified_at: null,
                extended_count: currentExtendedCount + 1,
                updated_at: new Date().toISOString(),
            })
            .eq('id', encounterId)
            .select()
            .single(),
        (supabase as any).from('encounter_audit_log').insert([{
            encounter_id: encounterId,
            changed_by: practitionerId,
            old_status: encounter.status,
            new_status: encounter.status,
            notes: `Timeout extendido ${currentExtendedCount + 1}/${ENCOUNTER_TIMEOUT_MAX_EXTENSIONS} veces`,
            change_reason: 'timeout_extended',
            timeout_action: 'extended',
            extended_by: practitionerId,
            original_duration_minutes: maxDurationMinutes,
            actual_duration_minutes: actualDurationMinutes,
        }]),
    ]);

    if (updateError) return { error: 'No se pudo extender el timeout. Intenta de nuevo.' };

    return { data };
}

export async function cleanupExpiredEncounters() {
    const supabase = await createServerSupabaseClient();

    const { data: expiredEncounters, error } = await supabase
        .from('encounters')
        .select('id, notified_at, extended_count, encounter_class, start_time, practitioner_id')
        .eq('status', 'in-progress')
        .not('notified_at', 'is', null);

    if (error) {
        console.error('[cleanupExpiredEncounters] Error fetching expired encounters:', error);
        return { error: 'Error al buscar encuentros expirados' };
    }

    if (!expiredEncounters || expiredEncounters.length === 0) {
        return { data: { processed: 0, cancelled: 0, extended: 0 } };
    }

    let cancelled = 0;
    let extended = 0;

    for (const encounter of expiredEncounters) {
        const maxDuration = await getEncounterTypeConfig(supabase, encounter.encounter_class);
        const notifiedAt = new Date(encounter.notified_at!);
        const gracePeriodEnd = new Date(notifiedAt.getTime() + ENCOUNTER_TIMEOUT_GRACE_PERIOD_MINUTES * 60000);
        const now = new Date();

        const actualDurationMinutes = Math.floor((now.getTime() - new Date(encounter.start_time).getTime()) / 60000);

        if (encounter.extended_count !== null && encounter.extended_count >= ENCOUNTER_TIMEOUT_MAX_EXTENSIONS) {
            await supabase
                .from('encounters')
                .update({
                    status: 'cancelled',
                    timeout_reason: 'timeout',
                    end_time: now.toISOString(),
                    updated_at: now.toISOString(),
                })
                .eq('id', encounter.id);

            await (supabase as any).from('encounter_audit_log').insert([{
                encounter_id: encounter.id,
                changed_by: null,
                old_status: 'in-progress',
                new_status: 'cancelled',
                notes: 'Auto-cancelado: máximo de extensiones alcanzado',
                change_reason: 'timeout_auto_cancelled',
                timeout_action: 'auto_cancelled',
                original_duration_minutes: maxDuration,
                actual_duration_minutes: actualDurationMinutes,
            }]);

            cancelled++;
        } else if (now >= gracePeriodEnd) {
            await supabase
                .from('encounters')
                .update({
                    status: 'cancelled',
                    timeout_reason: 'timeout',
                    end_time: now.toISOString(),
                    updated_at: now.toISOString(),
                })
                .eq('id', encounter.id);

            await (supabase as any).from('encounter_audit_log').insert([{
                encounter_id: encounter.id,
                changed_by: null,
                old_status: 'in-progress',
                new_status: 'cancelled',
                notes: 'Auto-cancelado: período de gracia vencido',
                change_reason: 'timeout_auto_cancelled',
                timeout_action: 'auto_cancelled',
                original_duration_minutes: maxDuration,
                actual_duration_minutes: actualDurationMinutes,
            }]);

            cancelled++;
        }
    }

    return { data: { processed: expiredEncounters.length, cancelled, extended } };
}
