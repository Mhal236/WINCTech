export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          billing_address: string | null
          business_type: string | null
          company_name: string | null
          contact_email: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          registration_number: string | null
          status: string | null
          subscription_type: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          billing_address?: string | null
          business_type?: string | null
          company_name?: string | null
          contact_email: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          registration_number?: string | null
          status?: string | null
          subscription_type?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          billing_address?: string | null
          business_type?: string | null
          company_name?: string | null
          contact_email?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          registration_number?: string | null
          status?: string | null
          subscription_type?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      customer_login: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          date: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          source: string
          status: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          source: string
          status: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          accessories: string[] | null
          created_at: string
          customer_name: string
          damage_types: string[] | null
          duration: string | null
          email: string
          glass_type: string
          glass_types: string[] | null
          has_adas: boolean | null
          has_heated_glass: boolean | null
          id: string
          phone: string
          postcode: string
          scheduled_date: string | null
          scheduled_time: string | null
          service_type: string
          status: string | null
          technician_id: string | null
          technician_name: string | null
          total_amount: number
          ulez_charge: boolean | null
          vehicle_make: string
          vehicle_model: string
          vehicle_year: string
          vehicleRegistration: string | null
        }
        Insert: {
          accessories?: string[] | null
          created_at?: string
          customer_name: string
          damage_types?: string[] | null
          duration?: string | null
          email: string
          glass_type: string
          glass_types?: string[] | null
          has_adas?: boolean | null
          has_heated_glass?: boolean | null
          id?: string
          phone: string
          postcode: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type: string
          status?: string | null
          technician_id?: string | null
          technician_name?: string | null
          total_amount: number
          ulez_charge?: boolean | null
          vehicle_make: string
          vehicle_model: string
          vehicle_year: string
          vehicleRegistration?: string | null
        }
        Update: {
          accessories?: string[] | null
          created_at?: string
          customer_name?: string
          damage_types?: string[] | null
          duration?: string | null
          email?: string
          glass_type?: string
          glass_types?: string[] | null
          has_adas?: boolean | null
          has_heated_glass?: boolean | null
          id?: string
          phone?: string
          postcode?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type?: string
          status?: string | null
          technician_id?: string | null
          technician_name?: string | null
          total_amount?: number
          ulez_charge?: boolean | null
          vehicle_make?: string
          vehicle_model?: string
          vehicle_year?: string
          vehicleRegistration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          account_holder: string | null
          account_number: string | null
          address: string | null
          bank_name: string | null
          certifications: string[] | null
          contact_email: string | null
          contact_phone: string | null
          coverage_areas: string[] | null
          coverage_postcodes: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          insurance_policy: string | null
          job_role: string | null
          jobs_completed: number | null
          languages: string | null
          location: string | null
          mot_expiry_date: string | null
          name: string
          registration_number: string | null
          skills: string[] | null
          sort_code: string | null
          status: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_type: string | null
          years_experience: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          certifications?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          coverage_areas?: string[] | null
          coverage_postcodes?: string | null
          created_at?: string
          date_of_birth?: string | null
          id: string
          insurance_policy?: string | null
          job_role?: string | null
          jobs_completed?: number | null
          languages?: string | null
          location?: string | null
          mot_expiry_date?: string | null
          name: string
          registration_number?: string | null
          skills?: string[] | null
          sort_code?: string | null
          status?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          years_experience?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          certifications?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          coverage_areas?: string[] | null
          coverage_postcodes?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          insurance_policy?: string | null
          job_role?: string | null
          jobs_completed?: number | null
          languages?: string | null
          location?: string | null
          mot_expiry_date?: string | null
          name?: string
          registration_number?: string | null
          skills?: string[] | null
          sort_code?: string | null
          status?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          years_experience?: string | null
        }
        Relationships: []
      }
      wrappers_fdw_stats: {
        Row: {
          bytes_in: number | null
          bytes_out: number | null
          create_times: number | null
          created_at: string
          fdw_name: string
          metadata: Json | null
          rows_in: number | null
          rows_out: number | null
          updated_at: string
        }
        Insert: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Update: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name?: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      airtable_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      airtable_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      airtable_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      auth0_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      auth0_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      auth0_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      big_query_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      big_query_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      big_query_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      click_house_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      click_house_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      click_house_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      cognito_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      cognito_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      cognito_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      firebase_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      firebase_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      firebase_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      hello_world_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      hello_world_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      hello_world_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      logflare_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      logflare_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      logflare_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      mssql_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      mssql_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      mssql_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      redis_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      redis_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      redis_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      s3_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      s3_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      s3_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      stripe_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      stripe_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      stripe_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      wasm_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      wasm_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      wasm_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
