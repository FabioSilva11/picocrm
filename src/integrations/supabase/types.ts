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
      catalog_items: {
        Row: {
          calculavel: string
          categoria: string
          codigo: string
          cor: string | null
          created_at: string
          descricao: string
          fonte: string
          id: string
          tamanho: number | null
          tensao: string
          updated_at: string
        }
        Insert: {
          calculavel?: string
          categoria?: string
          codigo: string
          cor?: string | null
          created_at?: string
          descricao: string
          fonte?: string
          id?: string
          tamanho?: number | null
          tensao?: string
          updated_at?: string
        }
        Update: {
          calculavel?: string
          categoria?: string
          codigo?: string
          cor?: string | null
          created_at?: string
          descricao?: string
          fonte?: string
          id?: string
          tamanho?: number | null
          tensao?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_components: {
        Row: {
          code: string
          created_at: string
          description: string
          group_name: string
          id: string
          position: number
          product_id: string
          quantity: number
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          group_name?: string
          id?: string
          position?: number
          product_id: string
          quantity?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          group_name?: string
          id?: string
          position?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_components_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_items: {
        Row: {
          id: string
          order_id: string
          product_code: string
          product_description: string
          quantity: number
        }
        Insert: {
          id?: string
          order_id: string
          product_code: string
          product_description?: string
          quantity?: number
        }
        Update: {
          id?: string
          order_id?: string
          product_code?: string
          product_description?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string
          status: string
          total_pieces: number
          total_units: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          notes?: string
          status?: string
          total_pieces?: number
          total_units?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string
          status?: string
          total_pieces?: number
          total_units?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          categoria: string
          codigo: string
          cor: string | null
          created_at: string
          descricao: string
          id: string
          motor_codigo: string | null
          motor_descricao: string | null
          observacoes: string[]
          tamanho: number | null
          tensao: string
          tipo_base: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          codigo: string
          cor?: string | null
          created_at?: string
          descricao: string
          id?: string
          motor_codigo?: string | null
          motor_descricao?: string | null
          observacoes?: string[]
          tamanho?: number | null
          tensao?: string
          tipo_base?: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          codigo?: string
          cor?: string | null
          created_at?: string
          descricao?: string
          id?: string
          motor_codigo?: string | null
          motor_descricao?: string | null
          observacoes?: string[]
          tamanho?: number | null
          tensao?: string
          tipo_base?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_order_items: {
        Row: {
          id: string
          order_id: string
          product_code: string
          product_description: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          id?: string
          order_id: string
          product_code: string
          product_description?: string
          quantity?: number
          unit_price_cents?: number
        }
        Update: {
          id?: string
          order_id?: string
          product_code?: string
          product_description?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          notes: string
          status: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          description: string
          item_code: string
          min_quantity: number
          quantity: number
          updated_at: string
        }
        Insert: {
          description?: string
          item_code: string
          min_quantity?: number
          quantity?: number
          updated_at?: string
        }
        Update: {
          description?: string
          item_code?: string
          min_quantity?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          delta: number
          description: string
          id: string
          item_code: string
          reason: string
          ref: string | null
        }
        Insert: {
          created_at?: string
          delta: number
          description?: string
          id?: string
          item_code: string
          reason?: string
          ref?: string | null
        }
        Update: {
          created_at?: string
          delta?: number
          description?: string
          id?: string
          item_code?: string
          reason?: string
          ref?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_stock_movement: {
        Args: {
          _delta: number
          _description: string
          _item_code: string
          _reason: string
          _ref?: string
        }
        Returns: string
      }
      complete_production_order: {
        Args: { _order_id: string }
        Returns: undefined
      }
      recalc_sales_order_total: {
        Args: { _order_id: string }
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
