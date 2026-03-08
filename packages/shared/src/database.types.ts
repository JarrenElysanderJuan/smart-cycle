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
      bin_telemetry_daily_summary: {
        Row: {
          avg_freshness_score: number | null
          avg_gas_ppm: number
          avg_temperature_c: number
          avg_weight_kg: number
          bin_id: string
          created_at: string
          id: string
          max_gas_ppm: number
          max_temperature_c: number
          min_battery_level: number
          min_temperature_c: number
          reading_count: number
          summary_date: string
        }
        Insert: {
          avg_freshness_score?: number | null
          avg_gas_ppm: number
          avg_temperature_c: number
          avg_weight_kg: number
          bin_id: string
          created_at?: string
          id?: string
          max_gas_ppm: number
          max_temperature_c: number
          min_battery_level: number
          min_temperature_c: number
          reading_count: number
          summary_date: string
        }
        Update: {
          avg_freshness_score?: number | null
          avg_gas_ppm?: number
          avg_temperature_c?: number
          avg_weight_kg?: number
          bin_id?: string
          created_at?: string
          id?: string
          max_gas_ppm?: number
          max_temperature_c?: number
          min_battery_level?: number
          min_temperature_c?: number
          reading_count?: number
          summary_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bin_telemetry_daily_summary_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "bins"
            referencedColumns: ["id"]
          },
        ]
      }
      bin_telemetry_readings: {
        Row: {
          battery_level: number
          bin_id: string
          freshness_score: number | null
          gas_ppm: number
          id: string
          ingested_at: string
          recorded_at: string
          temperature_c: number
          weight_kg: number
        }
        Insert: {
          battery_level: number
          bin_id: string
          freshness_score?: number | null
          gas_ppm: number
          id?: string
          ingested_at?: string
          recorded_at: string
          temperature_c: number
          weight_kg: number
        }
        Update: {
          battery_level?: number
          bin_id?: string
          freshness_score?: number | null
          gas_ppm?: number
          id?: string
          ingested_at?: string
          recorded_at?: string
          temperature_c?: number
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "bin_telemetry_readings_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "bins"
            referencedColumns: ["id"]
          },
        ]
      }
      bins: {
        Row: {
          api_key_hash: string
          created_at: string
          id: string
          installed_at: string | null
          label: string
          last_seen_at: string | null
          latitude: number | null
          location_description: string | null
          longitude: number | null
          organization_id: string
          status: Database["public"]["Enums"]["bin_status"]
          store_address: string | null
          store_id: string | null
        }
        Insert: {
          api_key_hash: string
          created_at?: string
          id?: string
          installed_at?: string | null
          label: string
          last_seen_at?: string | null
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          organization_id: string
          status?: Database["public"]["Enums"]["bin_status"]
          store_address?: string | null
          store_id?: string | null
        }
        Update: {
          api_key_hash?: string
          created_at?: string
          id?: string
          installed_at?: string | null
          label?: string
          last_seen_at?: string | null
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          organization_id?: string
          status?: Database["public"]["Enums"]["bin_status"]
          store_address?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bins_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_alert_recipients: {
        Row: {
          donation_alert_id: string
          food_bank_id: string
          id: string
          notified_at: string
          responded_at: string | null
          response: Database["public"]["Enums"]["recipient_response"]
        }
        Insert: {
          donation_alert_id: string
          food_bank_id: string
          id?: string
          notified_at?: string
          responded_at?: string | null
          response?: Database["public"]["Enums"]["recipient_response"]
        }
        Update: {
          donation_alert_id?: string
          food_bank_id?: string
          id?: string
          notified_at?: string
          responded_at?: string | null
          response?: Database["public"]["Enums"]["recipient_response"]
        }
        Relationships: [
          {
            foreignKeyName: "donation_alert_recipients_donation_alert_id_fkey"
            columns: ["donation_alert_id"]
            isOneToOne: false
            referencedRelation: "donation_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_alert_recipients_food_bank_id_fkey"
            columns: ["food_bank_id"]
            isOneToOne: false
            referencedRelation: "food_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_alerts: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          bin_id: string
          completed_at: string | null
          created_at: string
          estimated_weight_kg: number
          expires_at: string
          id: string
          picked_up_at: string | null
          priority: Database["public"]["Enums"]["alert_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["alert_status"]
          telemetry_reading_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          bin_id: string
          completed_at?: string | null
          created_at?: string
          estimated_weight_kg: number
          expires_at: string
          id?: string
          picked_up_at?: string | null
          priority?: Database["public"]["Enums"]["alert_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          telemetry_reading_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          bin_id?: string
          completed_at?: string | null
          created_at?: string
          estimated_weight_kg?: number
          expires_at?: string
          id?: string
          picked_up_at?: string | null
          priority?: Database["public"]["Enums"]["alert_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          telemetry_reading_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_alerts_approved_by_user_id_fkey"
            columns: ["approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_alerts_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_alerts_telemetry_reading_id_fkey"
            columns: ["telemetry_reading_id"]
            isOneToOne: false
            referencedRelation: "bin_telemetry_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      food_banks: {
        Row: {
          accepted_food_types: string[] | null
          address: string | null
          avg_weekly_demand_kg: number | null
          capacity_kg: number | null
          city: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          current_inventory_kg: number | null
          dietary_restrictions: string[] | null
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          max_pickup_distance_km: number | null
          name: string
          operating_hours: Json | null
          organization_id: string
          pickup_capability: boolean
          priority_score: number | null
          service_area_radius_km: number | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          accepted_food_types?: string[] | null
          address?: string | null
          avg_weekly_demand_kg?: number | null
          capacity_kg?: number | null
          city?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          current_inventory_kg?: number | null
          dietary_restrictions?: string[] | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          max_pickup_distance_km?: number | null
          name: string
          operating_hours?: Json | null
          organization_id: string
          pickup_capability?: boolean
          priority_score?: number | null
          service_area_radius_km?: number | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          accepted_food_types?: string[] | null
          address?: string | null
          avg_weekly_demand_kg?: number | null
          capacity_kg?: number | null
          city?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          current_inventory_kg?: number | null
          dietary_restrictions?: string[] | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          max_pickup_distance_km?: number | null
          name?: string
          operating_hours?: Json | null
          organization_id?: string
          pickup_capability?: boolean
          priority_score?: number | null
          service_area_radius_km?: number | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_banks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string
          average_daily_waste_kg: number | null
          city: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          num_bins: number
          operating_hours: Json | null
          organization_id: string
          state: string
          store_type: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address: string
          average_daily_waste_kg?: number | null
          city: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          num_bins?: number
          operating_hours?: Json | null
          organization_id: string
          state: string
          store_type?: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          address?: string
          average_daily_waste_kg?: number | null
          city?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          num_bins?: number
          operating_hours?: Json | null
          organization_id?: string
          state?: string
          store_type?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth0_id: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          auth0_id: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          auth0_id?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aggregate_and_prune_telemetry: {
        Args: { retention_days?: number }
        Returns: Json
      }
    }
    Enums: {
      alert_priority: "low" | "medium" | "high" | "critical"
      alert_status:
        | "pending"
        | "approved_by_store"
        | "routed"
        | "accepted"
        | "picked_up"
        | "completed"
        | "expired"
        | "cancelled"
      bin_status: "online" | "offline" | "maintenance"
      recipient_response: "pending" | "accepted" | "declined" | "no_response"
      subscription_tier: "free" | "pro" | "enterprise"
      user_role: "admin" | "store_manager" | "food_bank_coordinator"
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
      alert_priority: ["low", "medium", "high", "critical"],
      alert_status: [
        "pending",
        "approved_by_store",
        "routed",
        "accepted",
        "picked_up",
        "completed",
        "expired",
        "cancelled",
      ],
      bin_status: ["online", "offline", "maintenance"],
      recipient_response: ["pending", "accepted", "declined", "no_response"],
      subscription_tier: ["free", "pro", "enterprise"],
      user_role: ["admin", "store_manager", "food_bank_coordinator"],
    },
  },
} as const
