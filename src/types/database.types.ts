export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            allergy_intolerances: {
                Row: {
                    allergy_type: string | null
                    category: string[] | null
                    clinical_status: string | null
                    code: string
                    code_display: string
                    created_at: string | null
                    criticality: string | null
                    fhir_id: string
                    id: string
                    patient_id: string
                    reactions: Json | null
                }
                Insert: {
                    allergy_type?: string | null
                    category?: string[] | null
                    clinical_status?: string | null
                    code: string
                    code_display: string
                    created_at?: string | null
                    criticality?: string | null
                    fhir_id?: string
                    id?: string
                    patient_id: string
                    reactions?: Json | null
                }
                Update: {
                    allergy_type?: string | null
                    category?: string[] | null
                    clinical_status?: string | null
                    code?: string
                    code_display?: string
                    created_at?: string | null
                    criticality?: string | null
                    fhir_id?: string
                    id?: string
                    patient_id?: string
                    reactions?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "allergy_intolerances_patient_id_fkey"
                        columns: ["patient_id"]
                        isOneToOne: false
                        referencedRelation: "patients"
                        referencedColumns: ["id"]
                    },
                ]
            }
            appointments: {
                Row: {
                    appointment_type: string | null
                    created_at: string | null
                    description: string | null
                    end_time: string
                    fhir_id: string
                    id: string
                    patient_id: string
                    practitioner_id: string
                    reason_code: Json | null
                    start_time: string
                    status: Database["public"]["Enums"]["appointment_status"] | null
                    updated_at: string | null
                }
                Insert: {
                    appointment_type?: string | null
                    created_at?: string | null
                    description?: string | null
                    end_time: string
                    fhir_id?: string
                    id?: string
                    patient_id: string
                    practitioner_id: string
                    reason_code?: Json | null
                    start_time: string
                    status?: Database["public"]["Enums"]["appointment_status"] | null
                    updated_at?: string | null
                }
                Update: {
                    appointment_type?: string | null
                    created_at?: string | null
                    description?: string | null
                    end_time?: string
                    fhir_id?: string
                    id?: string
                    patient_id?: string
                    practitioner_id?: string
                    reason_code?: Json | null
                    start_time?: string
                    status?: Database["public"]["Enums"]["appointment_status"] | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            cie10: {
                Row: {
                    code: string
                    description: string
                    search_vector: unknown
                }
                Insert: {
                    code: string
                    description: string
                    search_vector?: unknown
                }
                Update: {
                    code?: string
                    description?: string
                    search_vector?: unknown
                }
                Relationships: []
            }
            conditions: {
                Row: {
                    category: string | null
                    clinical_status: string | null
                    code: string
                    code_display: string
                    code_system: string | null
                    created_at: string | null
                    fhir_id: string
                    id: string
                    note: string | null
                    onset_date: string | null
                    patient_id: string
                    verification_status: string | null
                }
                Insert: {
                    category?: string | null
                    clinical_status?: string | null
                    code: string
                    code_display: string
                    code_system?: string | null
                    created_at?: string | null
                    fhir_id?: string
                    id?: string
                    note?: string | null
                    onset_date?: string | null
                    patient_id: string
                    verification_status?: string | null
                }
                Update: {
                    category?: string | null
                    clinical_status?: string | null
                    code?: string
                    code_display?: string
                    code_system?: string | null
                    created_at?: string | null
                    fhir_id?: string
                    id?: string
                    note?: string | null
                    onset_date?: string | null
                    patient_id?: string
                    verification_status?: string | null
                }
                Relationships: []
            }
            encounters: {
                Row: {
                    appointment_id: string | null
                    created_at: string | null
                    diagnosis: Json | null
                    encounter_class: string | null
                    end_time: string | null
                    evolution_note: string | null
                    fhir_id: string
                    id: string
                    patient_id: string
                    plan: string | null
                    practitioner_id: string
                    reason_code: Json | null
                    start_time: string
                    status: Database["public"]["Enums"]["encounter_status"] | null
                    updated_at: string | null
                    vital_signs: Json | null
                }
                Insert: {
                    appointment_id?: string | null
                    created_at?: string | null
                    diagnosis?: Json | null
                    encounter_class?: string | null
                    end_time?: string | null
                    evolution_note?: string | null
                    fhir_id?: string
                    id?: string
                    patient_id: string
                    plan?: string | null
                    practitioner_id: string
                    reason_code?: Json | null
                    start_time?: string
                    status?: Database["public"]["Enums"]["encounter_status"] | null
                    updated_at?: string | null
                    vital_signs?: Json | null
                }
                Update: {
                    appointment_id?: string | null
                    created_at?: string | null
                    diagnosis?: Json | null
                    encounter_class?: string | null
                    end_time?: string | null
                    evolution_note?: string | null
                    fhir_id?: string
                    id?: string
                    patient_id?: string
                    plan?: string | null
                    practitioner_id?: string
                    reason_code?: Json | null
                    start_time?: string
                    status?: Database["public"]["Enums"]["encounter_status"] | null
                    updated_at?: string | null
                    vital_signs?: Json | null
                }
                Relationships: []
            }
            medication_requests: {
                Row: {
                    authored_on: string | null
                    created_at: string | null
                    dispense_request: Json | null
                    dosage_instruction: Json | null
                    encounter_id: string | null
                    fhir_id: string
                    id: string
                    intent: string | null
                    medication_code: string
                    medication_display: string
                    note: string | null
                    patient_id: string
                    prescriber_id: string
                    status: Database["public"]["Enums"]["medication_status"] | null
                }
                Insert: {
                    authored_on?: string | null
                    created_at?: string | null
                    dispense_request?: Json | null
                    dosage_instruction?: Json | null
                    encounter_id?: string | null
                    fhir_id?: string
                    id?: string
                    intent?: string | null
                    medication_code: string
                    medication_display: string
                    note?: string | null
                    patient_id: string
                    prescriber_id: string
                    status?: Database["public"]["Enums"]["medication_status"] | null
                }
                Update: {
                    authored_on?: string | null
                    created_at?: string | null
                    dispense_request?: Json | null
                    dosage_instruction?: Json | null
                    encounter_id?: string | null
                    fhir_id?: string
                    id?: string
                    intent?: string | null
                    medication_code?: string
                    medication_display?: string
                    note?: string | null
                    patient_id?: string
                    prescriber_id?: string
                    status?: Database["public"]["Enums"]["medication_status"] | null
                }
                Relationships: []
            }
            patients: {
                Row: {
                    active: boolean | null
                    address: Json | null
                    birth_date: string | null
                    created_at: string | null
                    encrypted_notes: string | null
                    extensions: Json | null
                    fhir_id: string
                    gender: Database["public"]["Enums"]["gender_type"] | null
                    id: string
                    identifiers: Json | null
                    name_family: string
                    name_given: string[]
                    practitioner_id: string | null
                    telecom: Json | null
                    updated_at: string | null
                }
                Insert: {
                    active?: boolean | null
                    address?: Json | null
                    birth_date?: string | null
                    created_at?: string | null
                    encrypted_notes?: string | null
                    extensions?: Json | null
                    fhir_id?: string
                    gender?: Database["public"]["Enums"]["gender_type"] | null
                    id?: string
                    identifiers?: Json | null
                    name_family: string
                    name_given: string[]
                    practitioner_id?: string | null
                    telecom?: Json | null
                    updated_at?: string | null
                }
                Update: {
                    active?: boolean | null
                    address?: Json | null
                    birth_date?: string | null
                    created_at?: string | null
                    encrypted_notes?: string | null
                    extensions?: Json | null
                    fhir_id?: string
                    gender?: Database["public"]["Enums"]["gender_type"] | null
                    id?: string
                    identifiers?: Json | null
                    name_family?: string
                    name_given?: string[]
                    practitioner_id?: string | null
                    telecom?: Json | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            practitioners: {
                Row: {
                    active: boolean | null
                    auth_user_id: string | null
                    created_at: string | null
                    fhir_id: string
                    gender: Database["public"]["Enums"]["gender_type"] | null
                    id: string
                    license_number: string | null
                    name_family: string
                    name_given: string[]
                    specialty: string | null
                    telecom: Json | null
                    updated_at: string | null
                }
                Insert: {
                    active?: boolean | null
                    auth_user_id?: string | null
                    created_at?: string | null
                    fhir_id?: string
                    gender?: Database["public"]["Enums"]["gender_type"] | null
                    id?: string
                    license_number?: string | null
                    name_family: string
                    name_given: string[]
                    specialty?: string | null
                    telecom?: Json | null
                    updated_at?: string | null
                }
                Update: {
                    active?: boolean | null
                    auth_user_id?: string | null
                    created_at?: string | null
                    fhir_id?: string
                    gender?: Database["public"]["Enums"]["gender_type"] | null
                    id?: string
                    license_number?: string | null
                    name_family?: string
                    name_given?: string[]
                    specialty?: string | null
                    telecom?: Json | null
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            search_patients_fuzzy: {
                Args: { p_id: string; search_term: string }
                Returns: {
                    id: string
                    name_family: string
                    name_given: string[]
                    similarity_score: number
                }[]
            }
            show_limit: { Args: never; Returns: number }
            show_trgm: { Args: { "": string }; Returns: string[] }
        }
        Enums: {
            appointment_status:
            | "proposed"
            | "pending"
            | "booked"
            | "arrived"
            | "fulfilled"
            | "cancelled"
            | "noshow"
            encounter_status:
            | "planned"
            | "arrived"
            | "triaged"
            | "in-progress"
            | "onleave"
            | "finished"
            | "cancelled"
            gender_type: "male" | "female" | "other" | "unknown"
            medication_status:
            | "draft"
            | "active"
            | "on-hold"
            | "cancelled"
            | "completed"
            | "stopped"
            | "unknown"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// ─── Convenience row types ────────────────────────────────────────────────────

export type Patient = Database["public"]["Tables"]["patients"]["Row"];
export type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
export type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"];

export type Practitioner = Database["public"]["Tables"]["practitioners"]["Row"];

// Base DB encounter row
export type Encounter = Database["public"]["Tables"]["encounters"]["Row"];

// Encounter as returned by getEncounters() Supabase join — FK fields may be
// nullable from the query even if the DB schema marks them non-null.
export interface EncounterWithSpecialty {
    id: string;
    fhir_id: string;
    patient_id?: string | null;
    practitioner_id?: string | null;
    appointment_id?: string | null;
    status?: Database["public"]["Enums"]["encounter_status"] | null;
    encounter_class?: string | null;
    start_time: string;
    end_time?: string | null;
    evolution_note?: string | null;
    plan?: string | null;
    reason_code?: Database["public"]["Tables"]["encounters"]["Row"]["reason_code"];
    diagnosis?: Database["public"]["Tables"]["encounters"]["Row"]["diagnosis"];
    vital_signs?: Database["public"]["Tables"]["encounters"]["Row"]["vital_signs"];
    created_at?: string | null;
    updated_at?: string | null;
    practitioner?: {
        name_given: string[];
        name_family: string;
        specialty?: string | null;
    } | null;
}

export type Condition = Database["public"]["Tables"]["conditions"]["Row"];
export type AllergyIntolerance = Database["public"]["Tables"]["allergy_intolerances"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type MedicationRequest = Database["public"]["Tables"]["medication_requests"]["Row"];
export type Cie10Entry = Database["public"]["Tables"]["cie10"]["Row"];

// ─── Enums ─────────────────────────────────────────────────────────────────────
export type GenderType = Database["public"]["Enums"]["gender_type"];
export type EncounterStatus = Database["public"]["Enums"]["encounter_status"];
export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

// ─── JSON sub-structures (used in encounters/patients) ────────────────────────
export interface TelecomEntry {
    system: "phone" | "email" | "fax" | "url" | "sms" | "other";
    value: string;
    use?: "home" | "work" | "mobile" | "temp" | "old";
}

export interface AddressEntry {
    text?: string;
    line?: string[];
    city?: string;
    state?: string;
    country?: string;
}

export interface IdentifierEntry {
    system: string;
    value: string;
}

export interface VitalSigns {
    systolic?: string | number;
    diastolic?: string | number;
    heartRate?: string | number;
    temperature?: string | number;
    weight?: string | number;
    height?: string | number;
    respiratoryRate?: string | number;
    oxygenSaturation?: string | number;
}

export interface DiagnosisEntry {
    code: string;
    display?: string;
    type?: "primary" | "secondary" | "comorbidity";
}
