// Fichier provisoire, au format de `supabase gen types`. Il sera ÉCRASÉ par :
//   npx supabase gen types typescript --linked > src/lib/database.types.ts
export type Database = {
  public: {
    Tables: {
      couples: {
        Row: { id: string; invite_code: string | null; created_at: string }
        Insert: { id?: string; invite_code?: string | null; created_at?: string }
        Update: { id?: string; invite_code?: string | null; created_at?: string }
        Relationships: []
      }
      members: {
        Row: { user_id: string; couple_id: string; display_name: string; joined_at: string }
        Insert: { user_id: string; couple_id: string; display_name: string; joined_at?: string }
        Update: { user_id?: string; couple_id?: string; display_name?: string; joined_at?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_couple: { Args: { p_display_name: string }; Returns: string }
      join_couple: { Args: { p_code: string; p_display_name: string }; Returns: string }
      my_couple_id: { Args: Record<PropertyKey, never>; Returns: string }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
