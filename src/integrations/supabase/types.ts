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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      coach_settings: {
        Row: {
          coach_id: string
          display_name: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          coach_id: string
          display_name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          coach_id?: string
          display_name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      monthly_loads: {
        Row: {
          athlete_id: string
          km: number
          macro: Database["public"]["Enums"]["macro_phase"] | null
          month_key: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          km?: number
          macro?: Database["public"]["Enums"]["macro_phase"] | null
          month_key: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          km?: number
          macro?: Database["public"]["Enums"]["macro_phase"] | null
          month_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          athlete_id: string
          month_key: string
          note: string | null
          paid: boolean
          paid_at: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          month_key: string
          note?: string | null
          paid?: boolean
          paid_at?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          month_key?: string
          note?: string | null
          paid?: boolean
          paid_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          birth_date: string | null
          certificate_date: string | null
          certificate_path: string | null
          created_at: string
          dni: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_coach_self: boolean
          objectives: string | null
          onboarding_complete: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          birth_date?: string | null
          certificate_date?: string | null
          certificate_path?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          is_coach_self?: boolean
          objectives?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          birth_date?: string | null
          certificate_date?: string | null
          certificate_path?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_coach_self?: boolean
          objectives?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      races: {
        Row: {
          active: boolean
          athlete_id: string
          created_at: string
          date: string
          distance_km: number
          id: string
          name: string
          time_sec: number
        }
        Insert: {
          active?: boolean
          athlete_id: string
          created_at?: string
          date: string
          distance_km: number
          id?: string
          name: string
          time_sec: number
        }
        Update: {
          active?: boolean
          athlete_id?: string
          created_at?: string
          date?: string
          distance_km?: number
          id?: string
          name?: string
          time_sec?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          athlete_id: string
          created_at: string
          date: string
          id: string
          km: number
          links: string[]
          notes: string | null
          photos: string[]
          rpe: number
          time_min: number
        }
        Insert: {
          athlete_id: string
          created_at?: string
          date: string
          id?: string
          km?: number
          links?: string[]
          notes?: string | null
          photos?: string[]
          rpe?: number
          time_min?: number
        }
        Update: {
          athlete_id?: string
          created_at?: string
          date?: string
          id?: string
          km?: number
          links?: string[]
          notes?: string | null
          photos?: string[]
          rpe?: number
          time_min?: number
        }
        Relationships: []
      }
      trainings: {
        Row: {
          athlete_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          date: string
          ec: string
          id: string
          main: string
          microcycle: Database["public"]["Enums"]["microcycle"] | null
          planned_km: number
          session_type: Database["public"]["Enums"]["session_type"] | null
          updated_at: string
          vc: string
          zone: Database["public"]["Enums"]["zone_key"]
        }
        Insert: {
          athlete_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date: string
          ec?: string
          id?: string
          main?: string
          microcycle?: Database["public"]["Enums"]["microcycle"] | null
          planned_km?: number
          session_type?: Database["public"]["Enums"]["session_type"] | null
          updated_at?: string
          vc?: string
          zone?: Database["public"]["Enums"]["zone_key"]
        }
        Update: {
          athlete_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          ec?: string
          id?: string
          main?: string
          microcycle?: Database["public"]["Enums"]["microcycle"] | null
          planned_km?: number
          session_type?: Database["public"]["Enums"]["session_type"] | null
          updated_at?: string
          vc?: string
          zone?: Database["public"]["Enums"]["zone_key"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalc_monthly_km: {
        Args: { _athlete: string; _month: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "coach" | "athlete"
      macro_phase: "General" | "Pre-competitivo" | "Competitivo" | "Transición"
      microcycle: "Bajo" | "Medio" | "Alto"
      session_type: "Pasadas" | "Fondo" | "Tempo" | "Fuerza" | "Cuestas"
      zone_key: "R0" | "R1" | "R2" | "R3" | "R4" | "R5" | "R6"
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
      app_role: ["coach", "athlete"],
      macro_phase: ["General", "Pre-competitivo", "Competitivo", "Transición"],
      microcycle: ["Bajo", "Medio", "Alto"],
      session_type: ["Pasadas", "Fondo", "Tempo", "Fuerza", "Cuestas"],
      zone_key: ["R0", "R1", "R2", "R3", "R4", "R5", "R6"],
    },
  },
} as const
