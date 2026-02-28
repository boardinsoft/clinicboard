export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
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
                    patient_id: string | null
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
                    patient_id?: string | null
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
                    patient_id?: string | null
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
                    patient_id: string | null
                    practitioner_id: string | null
                    reason_code: Json | null
                    start_time: string
                    status: string | null
                    updated_at: string | null
                }
                Insert: {
                    appointment_type?: string | null
                    created_at?: string | null
                    description?: string | null
                    end_time: string
                    fhir_id?: string
                    id?: string
                    patient_id?: string | null
                    practitioner_id?: string | null
                    reason_code?: Json | null
                    start_time: string
                    status?: string | null
                    updated_at?: string | null
                }
                Update: {
                    appointment_type?: string | null
                    created_at?: string | null
                    description?: string | null
                    end_time?: string
                    fhir_id?: string
                    id?: string
                    patient_id?: string | null
                    practitioner_id?: string | null
                    reason_code?: Json | null
                    start_time?: string
                    status?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "appointments_patient_id_fkey"
                        columns: ["patient_id"]
                        isOneToOne: false
                        referencedRelation: "patients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "appointments_practitioner_id_fkey"
                        columns: ["practitioner_id"]
                        isOneToOne: false
                        referencedRelation: "practitioners"
                        referencedColumns: ["id"]
                    },
                ]
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
                    patient_id: string | null
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
                    patient_id?: string | null
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
                    patient_id?: string | null
                    verification_status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "conditions_patient_id_fkey"
                        columns: ["patient_id"]
                        isOneToOne: false
                        referencedRelation: "patients"
                        referencedColumns: ["id"]
                    },
                ]
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
                    patient_id: string | null
                    plan: string | null
                    practitioner_id: string | null
                    reason_code: Json | null
                    start_time: string
                    status: string | null
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
                    patient_id?: string | null
                    plan?: string | null
                    practitioner_id?: string | null
                    reason_code?: Json | null
                    start_time?: string
                    status?: string | null
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
                    patient_id?: string | null
                    plan?: string | null
                    practitioner_id?: string | null
                    reason_code?: Json | null
                    start_time?: string
                    status?: string | null
                    updated_at?: string | null
                    vital_signs?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "encounters_appointment_id_fkey"
                        columns: ["appointment_id"]
                        isOneToOne: false
                        referencedRelation: "appointments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "encounters_patient_id_fkey"
                        columns: ["patient_id"]
                        isOneToOne: false
                        referencedRelation: "patients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "encounters_practitioner_id_fkey"
                        columns: ["practitioner_id"]
                        isOneToOne: false
                        referencedRelation: "practitioners"
                        referencedColumns: ["id"]
                    },
                ]
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
                    patient_id: string | null
                    prescriber_id: string | null
                    status: string | null
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
                    patient_id?: string | null
                    prescriber_id?: string | null
                    status?: string | null
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
                    patient_id?: string | null
                    prescriber_id?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "medication_requests_encounter_id_fkey"
                        columns: ["encounter_id"]
                        isOneToOne: false
                        referencedRelation: "encounters"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "medication_requests_patient_id_fkey"
                        columns: ["patient_id"]
                        isOneToOne: false
                        referencedRelation: "patients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "medication_requests_prescriber_id_fkey"
                        columns: ["prescriber_id"]
                        isOneToOne: false
                        referencedRelation: "practitioners"
                        referencedColumns: ["id"]
                    },
                ]
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
                    gender: string | null
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
                    gender?: string | null
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
                    gender?: string | null
                    id?: string
                    identifiers?: Json | null
                    name_family?: string
                    name_given?: string[]
                    practitioner_id?: string | null
                    telecom?: Json | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "patients_practitioner_id_fkey"
                        columns: ["practitioner_id"]
                        isOneToOne: false
                        referencedRelation: "practitioners"
                        referencedColumns: ["id"]
                    },
                ]
            }
            practitioners: {
                Row: {
                    active: boolean | null
                    auth_user_id: string | null
                    created_at: string | null
                    fhir_id: string
                    gender: string | null
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
                    gender?: string | null
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
                    gender?: string | null
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
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {},
    },
} as const
