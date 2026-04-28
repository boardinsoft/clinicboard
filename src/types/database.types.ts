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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      allergy_intolerances: {
        Row: {
          allergy_type: string | null
          category: string[] | null
          clinical_status: string | null
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
          {
            foreignKeyName: "allergy_intolerances_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_audit_log: {
        Row: {
          appointment_id: string
          changed_at: string | null
          changed_by: string | null
          id: string
          new_status: Database["public"]["Enums"]["appointment_status"] | null
          notes: string | null
          old_status: Database["public"]["Enums"]["appointment_status"] | null
        }
        Insert: {
          appointment_id: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["appointment_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["appointment_status"] | null
        }
        Update: {
          appointment_id?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["appointment_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["appointment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_audit_log_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type: string | null
          clinic_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          fhir_id: string
          id: string
          patient_id: string
          practitioner_id: string
          queue_position: number | null
          reason_code: Json | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string | null
        }
        Insert: {
          appointment_type?: string | null
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          fhir_id?: string
          id?: string
          patient_id: string
          practitioner_id: string
          queue_position?: number | null
          reason_code?: Json | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
        }
        Update: {
          appointment_type?: string | null
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          fhir_id?: string
          id?: string
          patient_id?: string
          practitioner_id?: string
          queue_position?: number | null
          reason_code?: Json | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
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
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
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
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conditions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      encounter_addenda: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          encounter_id: string
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          encounter_id: string
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          encounter_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encounter_addenda_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      encounter_audit_log: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          encounter_id: string
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          encounter_id: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          encounter_id?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encounter_audit_log_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          analysis: string | null
          clinic_id: string | null
          created_at: string | null
          diagnosis: Json | null
          encounter_id: string
          evolution_note: string | null
          id: string
          is_finalized: boolean | null
          objective: string | null
          patient_id: string
          physical_exam: Json | null
          plan: string | null
          practitioner_id: string
          reason_code: Json | null
          subjective: string | null
          updated_at: string | null
        }
        Insert: {
          analysis?: string | null
          clinic_id?: string | null
          created_at?: string | null
          diagnosis?: Json | null
          encounter_id: string
          evolution_note?: string | null
          id?: string
          is_finalized?: boolean | null
          objective?: string | null
          patient_id: string
          physical_exam?: Json | null
          plan?: string | null
          practitioner_id: string
          reason_code?: Json | null
          subjective?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis?: string | null
          clinic_id?: string | null
          created_at?: string | null
          diagnosis?: Json | null
          encounter_id?: string
          evolution_note?: string | null
          id?: string
          is_finalized?: boolean | null
          objective?: string | null
          patient_id?: string
          physical_exam?: Json | null
          plan?: string | null
          practitioner_id?: string
          reason_code?: Json | null
          subjective?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: true
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          appointment_id: string
          clinic_id: string | null
          created_at: string | null
          encounter_class: string | null
          encounter_category: string | null
          encounter_subcategory: string | null
          end_time: string | null
          fhir_id: string
          id: string
          patient_id: string
          practitioner_id: string
          start_time: string
          status: Database["public"]["Enums"]["encounter_status"] | null
          updated_at: string | null
          vital_signs: Json | null
        }
        Insert: {
          appointment_id: string
          clinic_id?: string | null
          created_at?: string | null
          encounter_class?: string | null
          encounter_category?: string | null
          encounter_subcategory?: string | null
          end_time?: string | null
          fhir_id?: string
          id?: string
          patient_id: string
          practitioner_id: string
          start_time?: string
          status?: Database["public"]["Enums"]["encounter_status"] | null
          updated_at?: string | null
          vital_signs?: Json | null
        }
        Update: {
          appointment_id?: string
          clinic_id?: string | null
          created_at?: string | null
          encounter_class?: string | null
          encounter_category?: string | null
          encounter_subcategory?: string | null
          end_time?: string | null
          fhir_id?: string
          id?: string
          patient_id?: string
          practitioner_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["encounter_status"] | null
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
          {
            foreignKeyName: "encounters_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_requests: {
        Row: {
          authored_on: string | null
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
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
          {
            foreignKeyName: "medication_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          active: boolean | null
          address: Json | null
          birth_date: string | null
          clinic_id: string | null
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
          clinic_id?: string | null
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
          clinic_id?: string | null
          created_at?: string | null
          encrypted_notes?: string | null
          extensions?: Json | null
          family_history?: Json | null
          fhir_id?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          habits?: Json | null
          id?: string
          identifiers?: Json | null
          name_family?: string
          name_given?: string[]
          practitioner_id?: string | null
          personal_history?: Json | null
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
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
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
      clinics: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          owner_practitioner_id: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          owner_practitioner_id?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          owner_practitioner_id?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clinic_practitioners: {
        Row: {
          active: boolean | null
          clinic_id: string
          created_at: string | null
          id: string
          is_owner: boolean | null
          practitioner_id: string
          role: string | null
          role_id: string | null
        }
        Insert: {
          active?: boolean | null
          clinic_id: string
          created_at?: string | null
          id?: string
          is_owner?: boolean | null
          practitioner_id: string
          role?: string | null
          role_id?: string | null
        }
        Update: {
          active?: boolean | null
          clinic_id?: string
          created_at?: string | null
          id?: string
          is_owner?: boolean | null
          practitioner_id?: string
          role?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_practitioners_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_practitioners_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
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
      search_patients_v2: {
        Args: { p_id: string; search_term: string }
        Returns: {
          active: boolean
          id: string
          identifiers: Json
          name_family: string
          name_given: string[]
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

export type Patient = Tables<'patients'> & {
  family_history?: string | null;
  habits?: string | null;
  personal_history?: string | null;
  surgical_history?: string | null;
  hospitalization_history?: string | null;
  review_of_systems?: string | null;
};
export type Condition = Tables<'conditions'>;
export type AllergyIntolerance = Tables<'allergy_intolerances'>;
export type Appointment = Tables<'appointments'>;
export type ClinicalNote = Tables<'clinical_notes'>;
export type Encounter = Tables<'encounters'>;
export type EncounterWithClinicalNote = Tables<'encounters'> & {
  clinical_note?: ClinicalNote | null;
  practitioner?: { name_given: string[], name_family: string, specialty: string | null };
};
// Alias de compatibilidad — prefiere EncounterWithClinicalNote para código nuevo
export type EncounterWithSpecialty = EncounterWithClinicalNote;
export type Practitioner = Tables<'practitioners'>;
// Tipo para la vista tabla /history/all — incluye joins de patient y practitioner
export type EncounterForPreview = EncounterWithClinicalNote & {
  patient?: {
    id: string;
    name_given: string[];
    name_family: string;
    birth_date: string | null;
  };
};
