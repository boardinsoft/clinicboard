'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prescriptionSchema, createPrescriptionFormSchema } from '@/lib/schemas/prescription.schema';
import { MedicationRequestStatus } from '@/lib/fhir/types';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';
import type { MedicationItemInput } from '@/lib/schemas/prescription.schema';

const VALID_TRANSITIONS: Record<MedicationRequestStatus, MedicationRequestStatus[]> = {
    'draft': ['active'],
    'active': ['completed', 'cancelled', 'on-hold'],
    'on-hold': ['active', 'cancelled'],
    'completed': [],
    'cancelled': [],
    'stopped': [],
    'unknown': [],
};

function canTransition(from: MedicationRequestStatus, to: MedicationRequestStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

async function logPrescriptionAudit(
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
    prescriptionId: string,
    action: string,
    oldStatus: MedicationRequestStatus,
    newStatus: MedicationRequestStatus,
    practitionerId: string,
    reason?: string
) {
    const { error } = await (supabase as any)
        .from('prescription_audit_log')
        .insert({
            prescription_id: prescriptionId,
            action,
            old_status: oldStatus,
            new_status: newStatus,
            changed_by: practitionerId,
            reason: reason || null,
        });

    if (error) {
        console.error('Error logging prescription audit:', error);
    }
}

interface AllergyConflict {
    medication_code: string;
    medication_display: string;
    allergy_code: string;
    allergy_display: string;
}

async function checkPatientAllergies(
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
    patientId: string,
    items: MedicationItemInput[]
): Promise<AllergyConflict[]> {
    const { data: allergies } = await supabase
        .from('allergy_intolerances')
        .select('code, code_display')
        .eq('patient_id', patientId);

    if (!allergies || allergies.length === 0) {
        return [];
    }

    const conflicts: AllergyConflict[] = [];

    for (const item of items) {
        for (const allergy of allergies) {
            const allergyCodeLower = (allergy.code || '').toLowerCase();
            const allergyDisplayLower = (allergy.code_display || '').toLowerCase();
            const medCodeLower = item.medication_code.toLowerCase();
            const medDisplayLower = item.medication_display.toLowerCase();

            const codeMatch = allergyCodeLower.length > 0 && (
                medCodeLower.includes(allergyCodeLower) ||
                allergyCodeLower.includes(medCodeLower)
            );

            const displayMatch = allergyDisplayLower.length > 0 && (
                medDisplayLower.includes(allergyDisplayLower) ||
                allergyDisplayLower.includes(medDisplayLower)
            );

            if (codeMatch || displayMatch) {
                conflicts.push({
                    medication_code: item.medication_code,
                    medication_display: item.medication_display,
                    allergy_code: allergy.code,
                    allergy_display: allergy.code_display,
                });
            }
        }
    }

    return conflicts;
}

const cancelPrescriptionSchema = z.object({
    id: z.string().uuid(),
    cancellationReason: z.string().min(5, 'El motivo de cancelación debe tener al menos 5 caracteres'),
});

async function transitionPrescription(
    id: string,
    targetStatus: MedicationRequestStatus,
    action: string,
    opts?: { reason?: string }
) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data: prescription } = await supabase
        .from('medication_requests')
        .select('id, status')
        .eq('id', id)
        .eq('prescriber_id', practitionerId)
        .single();

    if (!prescription) {
        return { error: 'Receta no encontrada' };
    }

    const currentStatus = prescription.status as MedicationRequestStatus;
    if (!canTransition(currentStatus, targetStatus)) {
        return { error: `No se puede ${action} una receta con estado '${currentStatus}'.` };
    }

    const { data, error } = await supabase
        .from('medication_requests')
        .update({ status: targetStatus as MedicationRequestStatus })
        .eq('id', id)
        .eq('prescriber_id', practitionerId)
        .select()
        .single();

    if (error) {
        console.error(`Error in ${action}Prescription:`, error);
        return { error: error.message };
    }

    await logPrescriptionAudit(supabase, id, action, currentStatus, targetStatus, practitionerId, opts?.reason);
    revalidatePath('/prescriptions');
    return { data };
}

export async function createPrescription(formData: {
    patient_id: string;
    encounter_id?: string;
    medication_code: string;
    medication_display: string;
    dosage_instruction: string[];
    note?: string;
    clinic_id: string;
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado. Sesión no encontrada.' };
    }

    if (!formData.clinic_id) {
        return { error: 'Clínica no especificada.' };
    }

    const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('id', formData.patient_id)
        .eq('practitioner_id', practitionerId)
        .eq('clinic_id', formData.clinic_id)
        .single();

    if (!patient) {
        return { error: 'Paciente no encontrado o sin permisos.' };
    }

    const prescriptionData = {
        ...formData,
        prescriber_id: practitionerId,
        status: 'draft' as MedicationRequestStatus,
    };

    const validation = prescriptionSchema.safeParse(prescriptionData);

    if (!validation.success) {
        return { error: z.flattenError(validation.error).fieldErrors };
    }

    const { data, error } = await supabase
        .from('medication_requests')
        .insert([{
            patient_id: validation.data.patient_id,
            encounter_id: formData.encounter_id,
            prescriber_id: validation.data.prescriber_id,
            clinic_id: validation.data.clinic_id,
            medication_code: validation.data.medication_code,
            medication_display: validation.data.medication_display,
            status: validation.data.status,
            intent: 'order',
            dosage_instruction: validation.data.dosage_instruction,
            authored_on: new Date().toISOString(),
            note: validation.data.note,
            fhir_id: crypto.randomUUID(),
        }])
        .select()
        .single();

    if (error) {
        console.error('Error in createPrescription:', error);
        return { error: error.message };
    }

    await logPrescriptionAudit(supabase, data.id, 'create', 'unknown', 'draft', practitionerId);
    revalidatePath('/prescriptions');
    return { data };
}

export async function createPrescriptions(formData: {
    encounter_id: string;
    patient_id: string;
    clinic_id: string;
    items: MedicationItemInput[];
    notes?: string;
    intent?: string;
    valid_until?: string;
}) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado. Sesión no encontrada.' };
    }

    const validation = createPrescriptionFormSchema.safeParse({
        encounter_id: formData.encounter_id,
        patient_id: formData.patient_id,
        clinic_id: formData.clinic_id,
        items: formData.items,
        notes: formData.notes,
        intent: formData.intent || 'order',
        valid_until: formData.valid_until,
    });

    if (!validation.success) {
        return { error: z.flattenError(validation.error).fieldErrors };
    }

    const validUntil = formData.valid_until
        ? new Date(formData.valid_until)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const { data: encounter } = await supabase
        .from('encounters')
        .select('id, status, practitioner_id')
        .eq('id', formData.encounter_id)
        .single();

    if (!encounter) {
        return { error: 'Encuentro no encontrado.' };
    }

    if (encounter.practitioner_id !== practitionerId) {
        return { error: 'No tienes permisos sobre este encuentro.' };
    }

    if (encounter.status !== 'in-progress') {
        return { error: 'Solo se pueden crear recetas desde encuentros en curso.' };
    }

    const allergyConflicts = await checkPatientAllergies(supabase, formData.patient_id, formData.items);
    if (allergyConflicts.length > 0) {
        const conflictList = allergyConflicts
            .map(c => `• ${c.medication_display} (${c.allergy_display})`)
            .join('\n');
        return {
            error: `Alergia detectada. Los siguientes medicamentos conflictúan con las alergias del paciente:\n${conflictList}`,
        };
    }

    const now = new Date().toISOString();

    const { data: prescriptionNumberData, error: numberError } = await supabase
        .rpc('generate_prescription_number', { p_clinic_id: formData.clinic_id });

    if (numberError || !prescriptionNumberData) {
        console.error('Error generating prescription number:', numberError);
        return { error: 'No se pudo generar el número de receta.' };
    }

    const prescriptionNumber = prescriptionNumberData as string;

    const prescriptionsToInsert = formData.items.map((item) => {
        const dosage_instruction = [
            item.dose,
            item.frequency,
            `Vía: ${item.route}`,
            `Duración: ${item.duration_value} ${item.duration_unit}`,
            item.indications ? `Indicaciones: ${item.indications}` : '',
        ].filter(Boolean);

        return {
            patient_id: formData.patient_id,
            encounter_id: formData.encounter_id,
            clinic_id: formData.clinic_id,
            prescriber_id: practitionerId,
            medication_code: item.medication_code,
            medication_display: item.medication_display,
            status: 'draft' as MedicationRequestStatus,
            intent: formData.intent || 'order',
            dosage_instruction,
            authored_on: now,
            valid_until: validUntil.toISOString(),
            note: formData.notes || null,
            fhir_id: crypto.randomUUID(),
            prescription_number: prescriptionNumber,
        };
    });

    const { data, error } = await supabase
        .from('medication_requests')
        .insert(prescriptionsToInsert)
        .select();

    if (error) {
        console.error('Error in createPrescriptions:', error);
        return { error: error.message };
    }

    for (const rx of data) {
        await logPrescriptionAudit(supabase, rx.id, 'create', 'unknown', 'draft', practitionerId);
    }

    revalidatePath('/prescriptions');
    revalidatePath(`/history`);

    return { data };
}

export async function activatePrescription(id: string) {
    return transitionPrescription(id, 'active', 'activate');
}

export async function cancelPrescription(id: string, cancellationReason?: string) {
    if (cancellationReason !== undefined) {
        const parsed = cancelPrescriptionSchema.safeParse({ id, cancellationReason });
        if (!parsed.success) {
            return { error: z.flattenError(parsed.error).fieldErrors.cancellationReason?.[0] || 'Motivo inválido' };
        }
    }
    return transitionPrescription(id, 'cancelled', 'cancel', { reason: cancellationReason });
}

export async function completePrescription(id: string) {
    return transitionPrescription(id, 'completed', 'complete');
}

export async function pausePrescription(id: string) {
    return transitionPrescription(id, 'on-hold', 'pause');
}

export async function resumePrescription(id: string) {
    return transitionPrescription(id, 'active', 'resume');
}

export async function getPrescriptionById(id: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('medication_requests')
        .select(`
            *,
            patient:patients(
                id, name_given, name_family, birth_date, national_id,
                gender, active,
                allergies:allergy_intolerances(code_display, criticality),
                conditions:conditions(code_display, clinical_status)
            ),
            prescriber:practitioners(id, name_given, name_family, specialty, license_number, national_id, mpps_registration_number, university),
            encounter:encounters(id, status, patient_id)
        `)
        .eq('id', id)
        .eq('prescriber_id', practitionerId)
        .single();

    if (error) {
        console.error('Error in getPrescriptionById:', error);
        return { error: error.message };
    }

    return { data };
}

export async function getPrescriptionAuditLog(prescriptionId: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await (supabase as any)
        .from('prescription_audit_log')
        .select(`
            *,
            changed_by_practitioner:practitioners(name_given, name_family)
        `)
        .eq('prescription_id', prescriptionId)
        .order('changed_at', { ascending: true });

    if (error) {
        console.error('Error in getPrescriptionAuditLog:', error);
        return { error: error.message };
    }

    return { data };
}

export async function getPrescriptionsByPatient(patientId: string, clinicId?: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    let query = supabase
        .from('medication_requests')
        .select('*')
        .eq('patient_id', patientId)
        .eq('prescriber_id', practitionerId)
        .order('authored_on', { ascending: false });

    if (clinicId) {
        query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error in getPrescriptionsByPatient:', error);
        return { error: error.message };
    }

    return { data };
}

export interface PrescriptionFilters {
    status?: MedicationRequestStatus | 'all';
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}

export async function getPrescriptionsForTable(clinicId?: string, filters?: PrescriptionFilters) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('medication_requests')
        .select(`
            id,
            prescription_number,
            authored_on,
            status,
            medication_code,
            medication_display,
            dosage_instruction,
            note,
            valid_until,
            printed_count,
            patient:patients(id, name_given, name_family, birth_date, national_id),
            prescriber:practitioners(name_given, name_family)
        `, { count: 'exact' })
        .eq('prescriber_id', practitionerId)
        .order('authored_on', { ascending: false })
        .range(from, to);

    if (clinicId) {
        query = query.eq('clinic_id', clinicId);
    }

    if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
    }

    if (filters?.dateFrom) {
        query = query.gte('authored_on', filters.dateFrom);
    }

    if (filters?.dateTo) {
        query = query.lte('authored_on', filters.dateTo);
    }

    if (filters?.search) {
        const searchTerm = `%${filters.search.trim()}%`;
        query = query.or(
            `medication_display.ilike.${searchTerm},medication_code.ilike.${searchTerm}`
        );
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error in getPrescriptionsForTable:', error);
        return { error: error.message };
    }

    const result: { data: typeof data; count: typeof count; statusCounts?: Record<string, number> } = { data, count };

    if (!filters?.status || filters.status === 'all') {
        const { count: allCount } = await supabase
            .from('medication_requests')
            .select('id', { count: 'exact', head: true })
            .eq('prescriber_id', practitionerId);

        const statusValues: MedicationRequestStatus[] = ['active', 'draft', 'on-hold', 'completed', 'cancelled', 'stopped', 'unknown'];
        const countsResult: Record<string, number> = { all: allCount ?? 0 };

        const countResponses = await Promise.all(statusValues.map(async (s) => {
            let countQuery = supabase
                .from('medication_requests')
                .select('id', { count: 'exact', head: true })
                .eq('prescriber_id', practitionerId)
                .eq('status', s);

            if (clinicId) countQuery = countQuery.eq('clinic_id', clinicId);
            if (filters?.search) {
                const searchTerm = `%${filters.search.trim()}%`;
                countQuery = countQuery.or(
                    `medication_display.ilike.${searchTerm},medication_code.ilike.${searchTerm}`
                );
            }

            const { count: statusCount } = await countQuery;
            return { s, count: statusCount ?? 0 };
        }));

        for (const { s, count: statusCount } of countResponses) {
            countsResult[s] = statusCount;
        }

        result.statusCounts = countsResult as Record<MedicationRequestStatus | 'all', number>;
    }

    return result;
}

export async function getPrescriptionsByEncounter(encounterId: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('medication_requests')
        .select(`
            *,
            patient:patients(id, name_given, name_family, birth_date)
        `)
        .eq('encounter_id', encounterId)
        .eq('prescriber_id', practitionerId)
        .order('authored_on', { ascending: false });

    if (error) {
        console.error('Error in getPrescriptionsByEncounter:', error);
        return { error: error.message };
    }

    return { data };
}

export async function getPrescriptionStats(clinicId?: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    let query = supabase
        .from('medication_requests')
        .select('status', { count: 'exact', head: true });

    if (clinicId) {
        query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error in getPrescriptionStats:', error);
        return { error: error.message };
    }

    return { data };
}

export async function searchMedications(query: string, limit = 20) {
    const supabase = await createServerSupabaseClient();

    if (!query || query.trim().length < 2) {
        return { data: [] };
    }

    const searchTerm = `%${query.trim()}%`;

    const { data, error } = await supabase
        .from('medications')
        .select('id, code, name, generic_name, pharmaceutical_form, concentration')
        .or(`name.ilike.${searchTerm},generic_name.ilike.${searchTerm}`)
        .limit(limit);

    if (error) {
        console.error('Error in searchMedications:', error);
        return { error: error.message };
    }

    return { data };
}

export async function getPrescriptionForPrint(id: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data, error } = await supabase
        .from('medication_requests')
        .select(`
            id,
            medication_code,
            medication_display,
            dosage_instruction,
            note,
            status,
            authored_on,
            valid_until,
            fhir_id,
            prescription_number,
            printed_count,
            clinic_id,
            patient:patients(id, name_given, name_family, birth_date, national_id),
            prescriber:practitioners(id, name_given, name_family, specialty, license_number, national_id, mpps_registration_number, university),
            encounter:encounters(id, clinic_id)
        `)
        .eq('id', id)
        .eq('prescriber_id', practitionerId)
        .single();

    if (error || !data) {
        console.error('Error in getPrescriptionForPrint:', error);
        return { error: error?.message || 'Receta no encontrada' };
    }

    const effectiveClinicId = data.clinic_id || data.encounter?.clinic_id;
    let clinic = null;
    if (effectiveClinicId) {
        const { data: clinicData } = await supabase
            .from('clinics')
            .select('id, name, rif, address, phone')
            .eq('id', effectiveClinicId)
            .single();
        clinic = clinicData;
    }

    return { data: { ...data, clinic } };
}

export async function markPrescriptionPrinted(prescriptionId: string) {
    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        return { error: 'No autorizado' };
    }

    const { data: current } = await supabase
        .from('medication_requests')
        .select('printed_count, status')
        .eq('id', prescriptionId)
        .eq('prescriber_id', practitionerId)
        .single();

    if (!current) {
        return { error: 'Receta no encontrada' };
    }

    const newCount = (current.printed_count || 0) + 1;
    const now = new Date().toISOString();

    const { error } = await supabase
        .from('medication_requests')
        .update({
            printed_count: newCount,
            printed_at: now,
        })
        .eq('id', prescriptionId);

    if (error) {
        console.error('Error in markPrescriptionPrinted:', error);
        return { error: error.message };
    }

    await logPrescriptionAudit(
        supabase,
        prescriptionId,
        'print',
        current.status as MedicationRequestStatus,
        current.status as MedicationRequestStatus,
        practitionerId,
        `PDF generado (impresión #${newCount})`
    );

    revalidatePath(`/prescriptions/${prescriptionId}`);
    return { data: { printed_count: newCount, printed_at: now } };
}
