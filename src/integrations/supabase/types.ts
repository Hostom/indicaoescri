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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      administradores: {
        Row: {
          cidades: string[] | null
          created_at: string
          id: string
          nome: string
          senha: string
          tipo: string
        }
        Insert: {
          cidades?: string[] | null
          created_at?: string
          id?: string
          nome: string
          senha: string
          tipo: string
        }
        Update: {
          cidades?: string[] | null
          created_at?: string
          id?: string
          nome?: string
          senha?: string
          tipo?: string
        }
        Relationships: []
      }
      consultores: {
        Row: {
          ativo_na_roleta: boolean
          cidade: string
          created_at: string
          data_ultima_indicacao: string | null
          email: string
          id: string
          natureza: string
          nome: string
        }
        Insert: {
          ativo_na_roleta?: boolean
          cidade: string
          created_at?: string
          data_ultima_indicacao?: string | null
          email: string
          id?: string
          natureza: string
          nome: string
        }
        Update: {
          ativo_na_roleta?: boolean
          cidade?: string
          created_at?: string
          data_ultima_indicacao?: string | null
          email?: string
          id?: string
          natureza?: string
          nome?: string
        }
        Relationships: []
      }
      indicacao_historico: {
        Row: {
          alterado_por: string | null
          created_at: string
          id: string
          indicacao_id: string
          observacao: string | null
          status_anterior: string
          status_novo: string
        }
        Insert: {
          alterado_por?: string | null
          created_at?: string
          id?: string
          indicacao_id: string
          observacao?: string | null
          status_anterior: string
          status_novo: string
        }
        Update: {
          alterado_por?: string | null
          created_at?: string
          id?: string
          indicacao_id?: string
          observacao?: string | null
          status_anterior?: string
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicacao_historico_indicacao_id_fkey"
            columns: ["indicacao_id"]
            isOneToOne: false
            referencedRelation: "indicacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      indicacoes: {
        Row: {
          cidade: string
          condominio: string | null
          consultor_id: string | null
          consultor_nome: string | null
          created_at: string
          data_pagamento: string | null
          descricao_situacao: string | null
          id: string
          indicador_user_id: string | null
          natureza: string
          nome_cliente: string
          nome_corretor: string
          origem: string
          percentual_comissao: number | null
          status: string
          status_comissao: string | null
          tel_cliente: string
          unidade_corretor: string
          valor_comissao: number | null
          valor_negocio: number | null
        }
        Insert: {
          cidade: string
          condominio?: string | null
          consultor_id?: string | null
          consultor_nome?: string | null
          created_at?: string
          data_pagamento?: string | null
          descricao_situacao?: string | null
          id?: string
          indicador_user_id?: string | null
          natureza: string
          nome_cliente: string
          nome_corretor: string
          origem?: string
          percentual_comissao?: number | null
          status?: string
          status_comissao?: string | null
          tel_cliente: string
          unidade_corretor: string
          valor_comissao?: number | null
          valor_negocio?: number | null
        }
        Update: {
          cidade?: string
          condominio?: string | null
          consultor_id?: string | null
          consultor_nome?: string | null
          created_at?: string
          data_pagamento?: string | null
          descricao_situacao?: string | null
          id?: string
          indicador_user_id?: string | null
          natureza?: string
          nome_cliente?: string
          nome_corretor?: string
          origem?: string
          percentual_comissao?: number | null
          status?: string
          status_comissao?: string | null
          tel_cliente?: string
          unidade_corretor?: string
          valor_comissao?: number | null
          valor_negocio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "indicacoes_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "consultores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          cidades: string[] | null
          created_at: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          cidades?: string[] | null
          created_at?: string
          id?: string
          nome: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          cidades?: string[] | null
          created_at?: string
          id?: string
          nome?: string
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
      get_user_cities: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "DIRETOR" | "GERENTE" | "INDICADOR"
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
      app_role: ["DIRETOR", "GERENTE", "INDICADOR"],
    },
  },
} as const
