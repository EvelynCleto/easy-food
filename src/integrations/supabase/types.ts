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
      achievements: {
        Row: {
          code: string
          created_at: string
          description: string
          icon: string
          id: string
          tier: string
          title: string
          xp_reward: number
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          tier?: string
          title: string
          xp_reward?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          tier?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      addresses: {
        Row: {
          city: string | null
          complement: string | null
          created_at: string
          district: string | null
          id: string
          is_default: boolean
          label: string | null
          number: string | null
          state: string | null
          street: string
          user_id: string
          zip: string | null
        }
        Insert: {
          city?: string | null
          complement?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          number?: string | null
          state?: string | null
          street: string
          user_id: string
          zip?: string | null
        }
        Update: {
          city?: string | null
          complement?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          number?: string | null
          state?: string | null
          street?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          discount_percent: number | null
          discount_value: number | null
          expires_at: string | null
          id: string
          min_order: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          min_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          min_order?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          meta: Json | null
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          meta?: Json | null
          points?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          meta?: Json | null
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      machine_products: {
        Row: {
          created_at: string
          id: string
          machine_id: string
          product_id: string
          slot: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          machine_id: string
          product_id: string
          slot?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          machine_id?: string
          product_id?: string
          slot?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_products_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          address: string
          city: string | null
          closes_at: string | null
          created_at: string
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          next_refill_at: string | null
          opens_at: string | null
          queue_size: number | null
          state: string | null
          status: Database["public"]["Enums"]["machine_status"]
          stock_level: number
          temperature_c: number | null
        }
        Insert: {
          address: string
          city?: string | null
          closes_at?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          next_refill_at?: string | null
          opens_at?: string | null
          queue_size?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["machine_status"]
          stock_level?: number
          temperature_c?: number | null
        }
        Update: {
          address?: string
          city?: string | null
          closes_at?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          next_refill_at?: string | null
          opens_at?: string | null
          queue_size?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["machine_status"]
          stock_level?: number
          temperature_c?: number | null
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string
          goal: string
          id: string
          plan: Json
          total_calories: number | null
          total_protein: number | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          goal: string
          id?: string
          plan?: Json
          total_calories?: number | null
          total_protein?: number | null
          updated_at?: string
          user_id: string
          week_start?: string
        }
        Update: {
          created_at?: string
          goal?: string
          id?: string
          plan?: Json
          total_calories?: number | null
          total_protein?: number | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      nutritional_analysis: {
        Row: {
          ai_suggestions: Json | null
          calories: number
          carbs: number
          created_at: string
          fat: number
          fiber: number
          foods: Json
          id: string
          image_url: string | null
          meal_type: string | null
          notes: string | null
          protein: number
          score: number | null
          user_id: string
        }
        Insert: {
          ai_suggestions?: Json | null
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          foods?: Json
          id?: string
          image_url?: string | null
          meal_type?: string | null
          notes?: string | null
          protein?: number
          score?: number | null
          user_id: string
        }
        Update: {
          ai_suggestions?: Json | null
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          foods?: Json
          id?: string
          image_url?: string | null
          meal_type?: string | null
          notes?: string | null
          protein?: number
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_image?: string | null
          product_name: string
          quantity?: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_id: string | null
          created_at: string
          discount: number
          expires_at: string | null
          fee: number
          id: string
          machine_id: string | null
          pickup_code: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          discount?: number
          expires_at?: string | null
          fee?: number
          id?: string
          machine_id?: string | null
          pickup_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          discount?: number
          expires_at?: string | null
          fee?: number
          id?: string
          machine_id?: string | null
          pickup_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          pix_code: string | null
          qr_code: string | null
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          pix_code?: string | null
          qr_code?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          pix_code?: string | null
          qr_code?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          id: string
          product_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badges: string[] | null
          calories: number | null
          carbs: number | null
          category_id: string | null
          created_at: string
          description: string | null
          fat: number | null
          fiber: number | null
          gallery: string[] | null
          id: string
          image_url: string | null
          ingredients: string | null
          is_featured: boolean
          is_promo: boolean
          micros: Json | null
          name: string
          nutrition_goals: string[] | null
          price: number
          producer: string | null
          promo_price: number | null
          protein: number | null
          rating: number
          rating_count: number
          sodium_mg: number | null
          sold_count: number | null
          sugar_g: number | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          badges?: string[] | null
          calories?: number | null
          carbs?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          fat?: number | null
          fiber?: number | null
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_featured?: boolean
          is_promo?: boolean
          micros?: Json | null
          name: string
          nutrition_goals?: string[] | null
          price: number
          producer?: string | null
          promo_price?: number | null
          protein?: number | null
          rating?: number
          rating_count?: number
          sodium_mg?: number | null
          sold_count?: number | null
          sugar_g?: number | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          badges?: string[] | null
          calories?: number | null
          carbs?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          fat?: number | null
          fiber?: number | null
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_featured?: boolean
          is_promo?: boolean
          micros?: Json | null
          name?: string
          nutrition_goals?: string[] | null
          price?: number
          producer?: string | null
          promo_price?: number | null
          protein?: number | null
          rating?: number
          rating_count?: number
          sodium_mg?: number | null
          sold_count?: number | null
          sugar_g?: number | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          avatar_url: string | null
          body_fat_pct: number | null
          calorie_goal: number
          created_at: string
          dietary_preferences: string[] | null
          dietary_restrictions: string[] | null
          email: string | null
          favorite_foods: string[] | null
          full_name: string | null
          goal: string | null
          health_score: number | null
          height_cm: number | null
          id: string
          level: number
          loyalty_points: number
          loyalty_tier: string
          objective: string | null
          onboarding_completed: boolean
          phone: string | null
          points: number
          protein_goal: number
          sex: string | null
          streak_days: number
          training_days_per_week: number | null
          training_type: string | null
          updated_at: string
          water_goal_ml: number
          weight_goal_kg: number | null
          weight_kg: number | null
          xp: number
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          avatar_url?: string | null
          body_fat_pct?: number | null
          calorie_goal?: number
          created_at?: string
          dietary_preferences?: string[] | null
          dietary_restrictions?: string[] | null
          email?: string | null
          favorite_foods?: string[] | null
          full_name?: string | null
          goal?: string | null
          health_score?: number | null
          height_cm?: number | null
          id: string
          level?: number
          loyalty_points?: number
          loyalty_tier?: string
          objective?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          points?: number
          protein_goal?: number
          sex?: string | null
          streak_days?: number
          training_days_per_week?: number | null
          training_type?: string | null
          updated_at?: string
          water_goal_ml?: number
          weight_goal_kg?: number | null
          weight_kg?: number | null
          xp?: number
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          avatar_url?: string | null
          body_fat_pct?: number | null
          calorie_goal?: number
          created_at?: string
          dietary_preferences?: string[] | null
          dietary_restrictions?: string[] | null
          email?: string | null
          favorite_foods?: string[] | null
          full_name?: string | null
          goal?: string | null
          health_score?: number | null
          height_cm?: number | null
          id?: string
          level?: number
          loyalty_points?: number
          loyalty_tier?: string
          objective?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          points?: number
          protein_goal?: number
          sex?: string | null
          streak_days?: number
          training_days_per_week?: number | null
          training_type?: string | null
          updated_at?: string
          water_goal_ml?: number
          weight_goal_kg?: number | null
          weight_kg?: number | null
          xp?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          photos: string[] | null
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          photos?: string[] | null
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          photos?: string[] | null
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          logged_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          logged_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          id: string
          logged_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          logged_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          logged_at?: string
          user_id?: string
          weight_kg?: number
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
      machine_status: "online" | "offline" | "maintenance"
      notification_type: "order" | "promo" | "system"
      order_status:
        | "pending"
        | "paid"
        | "preparing"
        | "ready"
        | "collected"
        | "cancelled"
        | "refused"
      payment_method: "pix" | "credit_card" | "debit_card" | "meal_voucher"
      payment_status: "pending" | "approved" | "refused" | "refunded"
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
      machine_status: ["online", "offline", "maintenance"],
      notification_type: ["order", "promo", "system"],
      order_status: [
        "pending",
        "paid",
        "preparing",
        "ready",
        "collected",
        "cancelled",
        "refused",
      ],
      payment_method: ["pix", "credit_card", "debit_card", "meal_voucher"],
      payment_status: ["pending", "approved", "refused", "refunded"],
    },
  },
} as const
