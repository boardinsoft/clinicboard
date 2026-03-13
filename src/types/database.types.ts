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
          analysis: string | null
          appointment_id: string | null
          created_at: string | null
          diagnosis: Json | null
          encounter_category: string | null
          encounter_class: string | null
          encounter_subcategory: string | null
          end_time: string | null
          evolution_note: string | null
          fhir_id: string
          id: string
          objective: string | null
          patient_id: string
          physical_exam: Json | null
          plan: string | null
          practitioner_id: string
          reason_code: Json | null
          start_time: string
          status: Database["public"]["Enums"]["encounter_status"] | null
          subjective: string | null
          updated_at: string | null
          vital_signs: Json | null
        }
        Insert: {
          analysis?: string | null
          appointment_id?: string | null
          created_at?: string | null
          diagnosis?: Json | null
          encounter_category?: string | null
          encounter_class?: string | null
          encounter_subcategory?: string | null
          end_time?: string | null
          evolution_note?: string | null
          fhir_id?: string
          id?: string
          objective?: string | null
          patient_id: string
          physical_exam?: Json | null
          plan?: string | null
          practitioner_id: string
          reason_code?: Json | null
          start_time?: string
          status?: Database["public"]["Enums"]["encounter_status"] | null
          subjective?: string | null
          updated_at?: string | null
          vital_signs?: Json | null
        }
        Update: {
          analysis?: string | null
          appointment_id?: string | null
          created_at?: string | null
          diagnosis?: Json | null
          encounter_category?: string | null
          encounter_class?: string | null
          encounter_subcategory?: string | null
          end_time?: string | null
          evolution_note?: string | null
          fhir_id?: string
          id?: string
          objective?: string | null
          patient_id?: string
          physical_exam?: Json | null
          plan?: string | null
          practitioner_id?: string
          reason_code?: Json | null
          start_time?: string
          status?: Database["public"]["Enums"]["encounter_status"] | null
          subjective?: string | null
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
      order_kit_items: {
        Row: {
          created_at: string | null
          dosage_instruction: Json | null
          id: string
          item_type: string | null
          kit_id: string | null
          laboratory_code: string | null
          laboratory_name: string | null
          medication_code: string | null
          medication_display: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dosage_instruction?: Json | null
          id?: string
          item_type?: string | null
          kit_id?: string | null
          laboratory_code?: string | null
          laboratory_name?: string | null
          medication_code?: string | null
          medication_display?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dosage_instruction?: Json | null
          id?: string
          item_type?: string | null
          kit_id?: string | null
          laboratory_code?: string | null
          laboratory_name?: string | null
          medication_code?: string | null
          medication_display?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "order_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      order_kits: {
        Row: {
          created_at: string | null
          description: string | null
          diagnosis_code: string | null
          id: string
          practitioner_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          diagnosis_code?: string | null
          id?: string
          practitioner_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          diagnosis_code?: string | null
          id?: string
          practitioner_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_kits_practitioner_id_fkey"
            columns: ["practitioner_id"]
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
          family_history: Json | null
          fhir_id: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          habits: Json | null
          id: string
          identifiers: Json | null
          name_family: string
          name_given: string[]
          personal_history: Json | null
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
          family_history?: Json | null
          fhir_id?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          habits?: Json | null
          id?: string
          identifiers?: Json | null
          name_family: string
          name_given: string[]
          personal_history?: Json | null
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
          family_history?: Json | null
          fhir_id?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          habits?: Json | null
          id?: string
          identifiers?: Json | null
          name_family?: string
          name_given?: string[]
          personal_history?: Json | null
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
      text_macros: {
        Row: {
          content: string
          created_at: string | null
          id: string
          practitioner_id: string | null
          shortcut: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          practitioner_id?: string | null
          shortcut: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          practitioner_id?: string | null
          shortcut?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "text_macros_practitioner_id_fkey"
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

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "proposed",
        "pending",
        "booked",
        "arrived",
        "fulfilled",
        "cancelled",
        "noshow",
      ],
      encounter_status: [
        "planned",
        "arrived",
        "triaged",
        "in-progress",
        "onleave",
        "finished",
        "cancelled",
      ],
      gender_type: ["male", "female", "other", "unknown"],
      medication_status: [
        "draft",
        "active",
        "on-hold",
        "cancelled",
        "completed",
        "stopped",
        "unknown",
      ],
    },
  },
} as const;

export type Patient = Tables<'patients'>;
export type Condition = Tables<'conditions'>;
export type AllergyIntolerance = Tables<'allergy_intolerances'>;
export type Appointment = Tables<'appointments'>;
export type Encounter = Tables<'encounters'>;
export type EncounterWithSpecialty = Encounter & { practitioner?: { name_given: string[], name_family: string, specialty: string | null } };
export type Practitioner = Tables<'practitioners'>;
