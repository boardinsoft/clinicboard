import type {
    FHIRPatient,
    FHIREncounter,
    FHIRCondition,
    FHIRAllergyIntolerance,
    FHIRMedicationRequest,
    FHIRAppointment,
    FHIRPractitioner,
    ContactPoint,
    Address,
    Identifier,
    HumanName,
    CodeableConcept,
    Reference,
} from '@/lib/fhir/types';
import type { Json } from '@/types/database.types';

// ─── FHIR Bundle Types ───────────────────────────────────────────────────────

interface BundleEntry {
    fullUrl: string;
    resource:
        | FHIRPatient
        | FHIREncounter
        | FHIRCondition
        | FHIRAllergyIntolerance
        | FHIRMedicationRequest
        | FHIRAppointment
        | FHIRPractitioner;
}

interface FHIRBundle {
    resourceType: 'Bundle';
    id: string;
    type: 'document';
    timestamp: string;
    identifier: {
        system: string;
        value: string;
    };
    entry: BundleEntry[];
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function toHumanName(name_given: string[], name_family: string): HumanName {
    return {
        use: 'official',
        family: name_family,
        given: name_given,
    };
}

function toContactPoints(telecom: Json | null): ContactPoint[] {
    if (!telecom || !Array.isArray(telecom)) return [];
    return (telecom as unknown as ContactPoint[]).filter(t => t.system && t.value);
}

function toAddresses(address: Json | null): Address[] {
    if (!address || !Array.isArray(address)) return [];
    return address as unknown as Address[];
}

function toIdentifiers(identifiers: Json | null): Identifier[] {
    if (!identifiers || !Array.isArray(identifiers)) return [];
    return identifiers as unknown as Identifier[];
}

function toCodeableConcept(code: string, display: string): CodeableConcept {
    return {
        coding: [{ code, display }],
        text: display,
    };
}

function toReference(resourceType: string, id: string, display?: string): Reference {
    return {
        reference: `${resourceType}/${id}`,
        display,
    };
}

function getEncounterClassDisplay(encounter_class: string): string {
    const map: Record<string, string> = {
        AMB: 'Ambulatorio',
        IMP: 'Internación',
        EMER: 'Emergencia',
        HH: 'Atención domiciliaria',
    };
    return map[encounter_class] || encounter_class;
}

function getStatusDisplay(status: string): string {
    const map: Record<string, string> = {
        planned: 'Planificado',
        arrived: 'Llegado',
        triaged: 'Triado',
        'in-progress': 'En curso',
        onleave: 'En pausa',
        finished: 'Finalizado',
        cancelled: 'Cancelado',
        'entered-in-error': 'Erróneo',
        unknown: 'Desconocido',
    };
    return map[status] || status;
}

// ─── Resource Builders ───────────────────────────────────────────────────────

function buildPatientResource(patient: Record<string, unknown>): FHIRPatient {
    const name_given = (patient.name_given as string[]) || [];
    const name_family = (patient.name_family as string) || '';

    return {
        resourceType: 'Patient',
        id: patient.fhir_id as string,
        active: patient.active !== false,
        name: [toHumanName(name_given, name_family)],
        telecom: toContactPoints(patient.telecom as Json | null),
        gender: (patient.gender as FHIRPatient['gender']) || 'unknown',
        birthDate: patient.birth_date as string | undefined,
        address: toAddresses(patient.address as Json | null),
        identifier: toIdentifiers(patient.identifiers as Json | null),
        extensions: (patient.extensions as Record<string, unknown>) || {},
    };
}

function buildPractitionerResource(practitioner: Record<string, unknown>): FHIRPractitioner {
    const name_given = (practitioner.name_given as string[]) || [];
    const name_family = (practitioner.name_family as string) || '';

    return {
        resourceType: 'Practitioner',
        id: practitioner.fhir_id as string,
        active: practitioner.active !== false,
        name: [toHumanName(name_given, name_family)],
        telecom: toContactPoints(practitioner.telecom as Json | null),
        specialty: practitioner.specialty as string | undefined,
        licenseNumber: practitioner.license_number as string | undefined,
        qualification: practitioner.license_number
            ? [{
                code: toCodeableConcept('license', 'Licencia Profesional'),
            }]
            : undefined,
    };
}

function buildEncounterResource(
    encounter: Record<string, unknown>,
    patientRef: Reference,
    practitionerRef?: Reference,
): FHIREncounter {
    const reasonCodes = encounter.reason_code as Json | null;
    const reasonCodeArray: CodeableConcept[] = Array.isArray(reasonCodes)
        ? (reasonCodes as unknown as Record<string, unknown>[]).map((r) =>
            toCodeableConcept(r.code as string || 'unknown', r.text as string || 'Sin motivo especificado')
        )
        : [];

    const vitalSigns = encounter.vital_signs as Record<string, unknown> | null;

    return {
        resourceType: 'Encounter',
        id: encounter.fhir_id as string,
        status: (encounter.status as FHIREncounter['status']) || 'unknown',
        class: {
            code: (encounter.encounter_class as FHIREncounter['class']['code']) || 'AMB',
            display: getEncounterClassDisplay(encounter.encounter_class as string),
        },
        subject: patientRef,
        participant: practitionerRef ? [{ individual: practitionerRef }] : undefined,
        period: {
            start: encounter.start_time as string,
            end: (encounter.end_time as string) || undefined,
        },
        reasonCode: reasonCodeArray.length > 0 ? reasonCodeArray : undefined,
        evolutionNote: encounter.evolution_note as string | undefined,
        vitalSigns: vitalSigns || undefined,
        diagnosis: (encounter.diagnosis as unknown as { condition: Reference; rank?: number }[]) || undefined,
    };
}

function buildConditionResource(
    condition: Record<string, unknown>,
    patientRef: Reference,
): FHIRCondition {
    return {
        resourceType: 'Condition',
        id: condition.fhir_id as string,
        clinicalStatus: toCodeableConcept(
            condition.clinical_status as string || 'unknown',
            condition.clinical_status === 'active' ? 'Activa' : 'Resuelta',
        ),
        verificationStatus: condition.verification_status
            ? toCodeableConcept(condition.verification_status as string, condition.verification_status as string)
            : undefined,
        category: condition.category
            ? [toCodeableConcept(condition.category as string, condition.category as string)]
            : undefined,
        code: toCodeableConcept(
            condition.code as string,
            condition.code_display as string,
        ),
        subject: patientRef,
        onsetDateTime: condition.onset_date as string | undefined,
        note: condition.note as string | undefined,
    };
}

function buildAllergyResource(
    allergy: Record<string, unknown>,
    patientRef: Reference,
): FHIRAllergyIntolerance {
    const reactions = allergy.reactions as Json | null;
    const reactionArray = Array.isArray(reactions)
        ? (reactions as unknown as Record<string, unknown>[]).map((r) => ({
            manifestation: [toCodeableConcept(
                (r.substance as string) || 'unknown',
                (r.text as string) || 'Reacción no especificada',
            )],
            severity: (r.severity as 'mild' | 'moderate' | 'severe') || undefined,
        }))
        : undefined;

    return {
        resourceType: 'AllergyIntolerance',
        id: allergy.fhir_id as string,
        clinicalStatus: toCodeableConcept(
            allergy.clinical_status as string || 'unknown',
            allergy.clinical_status as string,
        ),
        type: allergy.allergy_type as FHIRAllergyIntolerance['type'],
        category: allergy.category as FHIRAllergyIntolerance['category'],
        criticality: allergy.criticality as FHIRAllergyIntolerance['criticality'],
        code: toCodeableConcept(
            allergy.code as string,
            allergy.code_display as string,
        ),
        patient: patientRef,
        reaction: reactionArray,
    };
}

function buildMedicationRequestResource(
    prescription: Record<string, unknown>,
    patientRef: Reference,
    practitionerRef?: Reference,
): FHIRMedicationRequest {
    const dosageInstruction = prescription.dosage_instruction as Json | null;
    const dosageArray = Array.isArray(dosageInstruction)
        ? dosageInstruction as unknown as FHIRMedicationRequest['dosageInstruction']
        : undefined;

    const dispenseRequest = prescription.dispense_request as Record<string, unknown> | null;

    return {
        resourceType: 'MedicationRequest',
        id: prescription.fhir_id as string,
        status: prescription.status as FHIRMedicationRequest['status'],
        intent: (prescription.intent as FHIRMedicationRequest['intent']) || 'order',
        medicationCodeableConcept: toCodeableConcept(
            prescription.medication_code as string,
            prescription.medication_display as string,
        ),
        subject: patientRef,
        encounter: prescription.encounter_id
            ? toReference('Encounter', prescription.encounter_id as string)
            : undefined,
        authoredOn: prescription.authored_on as string,
        requester: practitionerRef || toReference('Practitioner', prescription.prescriber_id as string),
        dosageInstruction: dosageArray,
        dispenseRequest: dispenseRequest || undefined,
        note: prescription.note as string | undefined,
    };
}

function buildAppointmentResource(
    appointment: Record<string, unknown>,
    patientRef: Reference,
    practitionerRef?: Reference,
): FHIRAppointment {
    const reasonCodes = appointment.reason_code as Json | null;
    const reasonCodeArray = Array.isArray(reasonCodes)
        ? (reasonCodes as unknown as Record<string, unknown>[]).map((r) =>
            toCodeableConcept(r.code as string || 'unknown', r.text as string || '')
        )
        : undefined;

    return {
        resourceType: 'Appointment',
        id: appointment.fhir_id as string,
        status: appointment.status as FHIRAppointment['status'],
        start: appointment.start_time as string,
        end: appointment.end_time as string,
        description: appointment.description as string | undefined,
        appointmentType: appointment.appointment_type
            ? toCodeableConcept(appointment.appointment_type as string, appointment.appointment_type as string)
            : undefined,
        reasonCode: reasonCodeArray,
        participant: [
            {
                actor: patientRef,
                status: 'accepted' as const,
            },
            ...(practitionerRef ? [{
                actor: practitionerRef,
                status: 'accepted' as const,
            }] : []),
        ],
    };
}

// ─── Main Builder ────────────────────────────────────────────────────────────

interface PatientHistoryData {
    patient: Record<string, unknown> & { fhir_id: string };
    practitioner?: Record<string, unknown> | null;
    encounters: Record<string, unknown>[];
    conditions: Record<string, unknown>[];
    allergies: Record<string, unknown>[];
    prescriptions: Record<string, unknown>[];
    appointments: Record<string, unknown>[];
}

export function buildFHIRBundle(history: PatientHistoryData): FHIRBundle {
    const patient = history.patient;
    const practitioner = history.practitioner;
    const patientFhirId = patient.fhir_id as string;

    // Build references
    const nameGiven = (patient.name_given as string[]) || [];
    const patientRef = toReference('Patient', patientFhirId, `${nameGiven.join(' ') || ''} ${patient.name_family || ''}`.trim());
    const practitionerRef = practitioner
        ? toReference('Practitioner', practitioner.fhir_id as string, `${(practitioner.name_given as string[])?.join(' ') || ''} ${practitioner.name_family || ''}`.trim())
        : undefined;

    // Build all resources
    const entries: BundleEntry[] = [];

    // 1. Patient
    entries.push({
        fullUrl: `Patient/${patientFhirId}`,
        resource: buildPatientResource(patient),
    });

    // 2. Practitioner
    if (practitioner) {
        entries.push({
            fullUrl: `Practitioner/${practitioner.fhir_id}`,
            resource: buildPractitionerResource(practitioner),
        });
    }

    // 3. Encounters
    for (const enc of history.encounters) {
        entries.push({
            fullUrl: `Encounter/${enc.fhir_id}`,
            resource: buildEncounterResource(enc, patientRef, practitionerRef),
        });
    }

    // 4. Conditions
    for (const cond of history.conditions) {
        entries.push({
            fullUrl: `Condition/${cond.fhir_id}`,
            resource: buildConditionResource(cond, patientRef),
        });
    }

    // 5. Allergies
    for (const allergy of history.allergies) {
        entries.push({
            fullUrl: `AllergyIntolerance/${allergy.fhir_id}`,
            resource: buildAllergyResource(allergy, patientRef),
        });
    }

    // 6. Medication Requests
    for (const rx of history.prescriptions) {
        entries.push({
            fullUrl: `MedicationRequest/${rx.fhir_id}`,
            resource: buildMedicationRequestResource(rx, patientRef, practitionerRef),
        });
    }

    // 7. Appointments
    for (const appt of history.appointments) {
        entries.push({
            fullUrl: `Appointment/${appt.fhir_id}`,
            resource: buildAppointmentResource(appt, patientRef, practitionerRef),
        });
    }

    return {
        resourceType: 'Bundle',
        id: crypto.randomUUID(),
        type: 'document',
        timestamp: new Date().toISOString(),
        identifier: {
            system: 'urn:ietf:rfc:3986',
            value: `urn:uuid:${crypto.randomUUID()}`,
        },
        entry: entries,
    };
}
