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
      classifieds: {
        Row: {
          category: string | null
          city: string | null
          condition: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_sold: boolean | null
          photos: string[] | null
          price: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          condition?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_sold?: boolean | null
          photos?: string[] | null
          price?: number | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          city?: string | null
          condition?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_sold?: boolean | null
          photos?: string[] | null
          price?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          complaint_text: string
          created_at: string
          id: string
          is_read: boolean
          status: string
          user_id: string | null
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          complaint_text: string
          created_at?: string
          id?: string
          is_read?: boolean
          status?: string
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          complaint_text?: string
          created_at?: string
          id?: string
          is_read?: boolean
          status?: string
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          requester_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          requester_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          requester_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "matrimony_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          city: string | null
          company_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          job_type: string | null
          salary_range: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          job_type?: string | null
          salary_range?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          job_type?: string | null
          salary_range?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      matrimony_profiles: {
        Row: {
          aadhar_url: string | null
          about_me: string | null
          city: string | null
          created_at: string
          dob: string | null
          education: string | null
          family_background: string | null
          gender: string
          height: string | null
          hobbies: string | null
          id: string
          is_published: boolean | null
          job_details: string | null
          name: string
          pan_url: string | null
          photos: string[] | null
          profession: string | null
          subscription_end: string | null
          subscription_plan: string | null
          subscription_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhar_url?: string | null
          about_me?: string | null
          city?: string | null
          created_at?: string
          dob?: string | null
          education?: string | null
          family_background?: string | null
          gender?: string
          height?: string | null
          hobbies?: string | null
          id?: string
          is_published?: boolean | null
          job_details?: string | null
          name?: string
          pan_url?: string | null
          photos?: string[] | null
          profession?: string | null
          subscription_end?: string | null
          subscription_plan?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhar_url?: string | null
          about_me?: string | null
          city?: string | null
          created_at?: string
          dob?: string | null
          education?: string | null
          family_background?: string | null
          gender?: string
          height?: string | null
          hobbies?: string | null
          id?: string
          is_published?: boolean | null
          job_details?: string | null
          name?: string
          pan_url?: string | null
          photos?: string[] | null
          profession?: string | null
          subscription_end?: string | null
          subscription_plan?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          amount: number
          created_at: string
          ends_at: string
          id: string
          plan: string
          screenshot_url: string | null
          starts_at: string
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          ends_at?: string
          id?: string
          plan?: string
          screenshot_url?: string | null
          starts_at?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          ends_at?: string
          id?: string
          plan?: string
          screenshot_url?: string | null
          starts_at?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      merchant_profiles: {
        Row: {
          aadhar_url: string | null
          address: string | null
          category: string | null
          city: string | null
          created_at: string
          description: string | null
          fssai_url: string | null
          gst_url: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          pan_url: string | null
          phone: string | null
          photos: string[] | null
          pincode: string | null
          premium_plan: string | null
          premium_start_date: string | null
          shop_name: string
          shop_name_hindi: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          aadhar_url?: string | null
          address?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          fssai_url?: string | null
          gst_url?: string | null
          id?: string
          is_premium?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          pan_url?: string | null
          phone?: string | null
          photos?: string[] | null
          pincode?: string | null
          premium_plan?: string | null
          premium_start_date?: string | null
          shop_name?: string
          shop_name_hindi?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          aadhar_url?: string | null
          address?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          fssai_url?: string | null
          gst_url?: string | null
          id?: string
          is_premium?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          pan_url?: string | null
          phone?: string | null
          photos?: string[] | null
          pincode?: string | null
          premium_plan?: string | null
          premium_start_date?: string | null
          shop_name?: string
          shop_name_hindi?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          merchant_id: string | null
          message: string | null
          shop_id: string | null
          shop_name: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          merchant_id?: string | null
          message?: string | null
          shop_id?: string | null
          shop_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          merchant_id?: string | null
          message?: string | null
          shop_id?: string | null
          shop_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          merchant_id: string
          name: string
          name_hindi: string | null
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          merchant_id: string
          name: string
          name_hindi?: string | null
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          merchant_id?: string
          name?: string
          name_hindi?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          provider: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
          provider?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          provider?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_shops: {
        Row: {
          created_at: string
          id: string
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shop_id?: string
          user_id?: string
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          id: string
          is_verified: boolean | null
          name: string
          phone: string | null
          rating: number | null
          service_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          service_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          service_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          merchant_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          merchant_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          merchant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_analytics_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
