// ============================================
// FHIR R4 Type Definitions for Clinicboard
// ============================================

// FHIR Primitives
export type FHIRId = string;
export type FHIRDateTime = string;
export type FHIRDate = string;
export type FHIRCode = string;

// HumanName
export interface HumanName {
    use?: 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
    family: string;
    given: string[];
    prefix?: string[];
    suffix?: string[];
}

// ContactPoint
export interface ContactPoint {
    system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
    value: string;
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

// Address
export interface Address {
    use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
    type?: 'postal' | 'physical' | 'both';
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}

// Identifier
export interface Identifier {
    system?: string;
    value: string;
    type?: {
        text: string;
    };
}

// CodeableConcept
export interface CodeableConcept {
    coding?: {
        system?: string;
        code: string;
        display: string;
    }[];
    text?: string;
}

// Reference
export interface Reference {
    reference: string;
    display?: string;
}

// ============================================
// Patient Resource (FHIR R4)
// ============================================
export interface FHIRPatient {
    resourceType: 'Patient';
    id: FHIRId;
    active: boolean;
    name: HumanName[];
    telecom?: ContactPoint[];
    gender?: 'male' | 'female' | 'other' | 'unknown';
    birthDate?: FHIRDate;
    address?: Address[];
    identifier?: Identifier[];
    // Extensions for regional data
    extensions?: Record<string, unknown>;
}

// ============================================
// Practitioner Resource (FHIR R4)
// ============================================
export interface FHIRPractitioner {
    resourceType: 'Practitioner';
    id: FHIRId;
    active: boolean;
    name: HumanName[];
    telecom?: ContactPoint[];
    qualification?: {
        code: CodeableConcept;
        period?: { start?: FHIRDate; end?: FHIRDate };
    }[];
    specialty?: string;
    licenseNumber?: string;
}

// ============================================
// Appointment Resource (FHIR R4)
// ============================================
export type AppointmentStatus =
    | 'proposed'
    | 'pending'
    | 'booked'
    | 'arrived'
    | 'fulfilled'
    | 'cancelled'
    | 'noshow';

export interface FHIRAppointment {
    resourceType: 'Appointment';
    id: FHIRId;
    status: AppointmentStatus;
    start: FHIRDateTime;
    end: FHIRDateTime;
    description?: string;
    appointmentType?: CodeableConcept;
    reasonCode?: CodeableConcept[];
    participant: {
        actor: Reference;
        status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
    }[];
}

// ============================================
// Encounter Resource (FHIR R4)
// ============================================
export type EncounterStatus =
    | 'planned'
    | 'arrived'
    | 'triaged'
    | 'in-progress'
    | 'onleave'
    | 'finished'
    | 'cancelled'
    | 'entered-in-error'
    | 'unknown';

export interface VitalSigns {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
}

export interface FHIREncounter {
    resourceType: 'Encounter';
    id: FHIRId;
    status: EncounterStatus;
    class: {
        code: 'AMB' | 'IMP' | 'EMER' | 'HH';
        display: string;
    };
    type?: CodeableConcept[];
    subject: Reference;
    participant?: {
        individual: Reference;
    }[];
    period?: {
        start: FHIRDateTime;
        end?: FHIRDateTime;
    };
    reasonCode?: CodeableConcept[];
    // Clinical notes
    evolutionNote?: string;
    vitalSigns?: VitalSigns;
    diagnosis?: {
        condition: Reference;
        rank?: number;
    }[];
}

// ============================================
// MedicationRequest Resource (FHIR R4)
// ============================================
export type MedicationRequestStatus =
    | 'active'
    | 'on-hold'
    | 'cancelled'
    | 'completed'
    | 'stopped'
    | 'draft'
    | 'unknown';

export interface DosageInstruction {
    text: string;
    timing?: {
        repeat?: {
            frequency: number;
            period: number;
            periodUnit: 'h' | 'd' | 'wk' | 'mo';
        };
    };
    route?: CodeableConcept;
    doseAndRate?: {
        doseQuantity?: {
            value: number;
            unit: string;
        };
    }[];
}

export interface FHIRMedicationRequest {
    resourceType: 'MedicationRequest';
    id: FHIRId;
    status: MedicationRequestStatus;
    intent: 'proposal' | 'plan' | 'order' | 'original-order';
    medicationCodeableConcept: CodeableConcept;
    subject: Reference;
    encounter?: Reference;
    authoredOn: FHIRDateTime;
    requester: Reference;
    dosageInstruction?: DosageInstruction[];
    dispenseRequest?: {
        numberOfRepeatsAllowed?: number;
        quantity?: {
            value: number;
            unit: string;
        };
        expectedSupplyDuration?: {
            value: number;
            unit: string;
        };
    };
    note?: string;
}

// ============================================
// Condition Resource (FHIR R4)
// ============================================
export interface FHIRCondition {
    resourceType: 'Condition';
    id: FHIRId;
    clinicalStatus: CodeableConcept;
    verificationStatus?: CodeableConcept;
    category?: CodeableConcept[];
    code: CodeableConcept;
    subject: Reference;
    onsetDateTime?: FHIRDateTime;
    note?: string;
}

// ============================================
// AllergyIntolerance Resource (FHIR R4)
// ============================================
export interface FHIRAllergyIntolerance {
    resourceType: 'AllergyIntolerance';
    id: FHIRId;
    clinicalStatus: CodeableConcept;
    type?: 'allergy' | 'intolerance';
    category?: ('food' | 'medication' | 'environment' | 'biologic')[];
    criticality?: 'low' | 'high' | 'unable-to-assess';
    code: CodeableConcept;
    patient: Reference;
    reaction?: {
        substance?: CodeableConcept;
        manifestation: CodeableConcept[];
        severity?: 'mild' | 'moderate' | 'severe';
    }[];
}

// ============================================
// App-level types (Supabase-mapped)
// ============================================
export interface Patient {
    id: string;
    fhir_id: string;
    active: boolean;
    name_given: string[];
    name_family: string;
    gender?: 'male' | 'female' | 'other' | 'unknown';
    birth_date?: string;
    telecom: ContactPoint[];
    address: Address[];
    identifiers: Identifier[];
    extensions: Record<string, unknown>;
    encrypted_notes?: string;
    practitioner_id: string;
    created_at: string;
    updated_at: string;
}

export interface Appointment {
    id: string;
    fhir_id: string;
    status: AppointmentStatus;
    start_time: string;
    end_time: string;
    patient_id: string;
    practitioner_id: string;
    appointment_type?: string;
    reason_code: CodeableConcept[];
    description?: string;
    cancellation_reason?: string;
    queue_position?: number;
    created_at: string;
    updated_at: string;
    // Joined
    patient?: Patient;
}

export interface Encounter {
    id: string;
    fhir_id: string;
    status: EncounterStatus;
    encounter_class: string;
    patient_id: string;
    practitioner_id: string;
    start_time: string;
    end_time?: string;
    reason_code: CodeableConcept[];
    evolution_note?: string;
    vital_signs?: VitalSigns;
    created_at: string;
}

export interface MedicationRequest {
    id: string;
    fhir_id: string;
    status: MedicationRequestStatus;
    intent: string;
    patient_id: string;
    encounter_id?: string;
    prescriber_id: string;
    medication_code: string;
    medication_display: string;
    dosage_instruction: DosageInstruction[];
    dispense_request: Record<string, unknown>;
    authored_on: string;
    note?: string;
    created_at: string;
}
