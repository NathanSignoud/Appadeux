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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alphabet_letters: {
        Row: {
          couple_id: string
          created_at: string
          date_on: string | null
          description: string | null
          event_id: string | null
          id: string
          letter: string
          organizer_id: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          couple_id?: string
          created_at?: string
          date_on?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          letter: string
          organizer_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          date_on?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          letter?: string
          organizer_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alphabet_letters_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alphabet_letters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      alphabet_photos: {
        Row: {
          couple_id: string
          created_at: string
          created_by: string
          id: string
          letter_id: string
          path: string
        }
        Insert: {
          couple_id?: string
          created_at?: string
          created_by?: string
          id?: string
          letter_id: string
          path: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          created_by?: string
          id?: string
          letter_id?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "alphabet_photos_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alphabet_photos_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "alphabet_letters"
            referencedColumns: ["id"]
          },
        ]
      }
      betrayals: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          note: string | null
          reported_by: string
          show_id: string | null
          show_name: string
          traitor_id: string
        }
        Insert: {
          couple_id?: string
          created_at?: string
          id?: string
          note?: string | null
          reported_by?: string
          show_id?: string | null
          show_name: string
          traitor_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          note?: string | null
          reported_by?: string
          show_id?: string | null
          show_name?: string
          traitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "betrayals_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betrayals_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          claim: string
          couple_id: string
          created_at: string
          created_by: string
          honored_at: string | null
          id: string
          settled_at: string | null
          stake: string
          status: string
          winner_id: string | null
        }
        Insert: {
          claim: string
          couple_id?: string
          created_at?: string
          created_by?: string
          honored_at?: string | null
          id?: string
          settled_at?: string | null
          stake: string
          status?: string
          winner_id?: string | null
        }
        Update: {
          claim?: string
          couple_id?: string
          created_at?: string
          created_by?: string
          honored_at?: string | null
          id?: string
          settled_at?: string | null
          stake?: string
          status?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          created_at: string
          id: string
          invite_code: string | null
          streaming_providers: number[]
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string | null
          streaming_providers?: number[]
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string | null
          streaming_providers?: number[]
        }
        Relationships: []
      }
      coupons: {
        Row: {
          couple_id: string
          created_at: string
          details: string | null
          giver_id: string
          id: string
          look: string
          scratched_at: string | null
          title: string
          used_at: string | null
        }
        Insert: {
          couple_id?: string
          created_at?: string
          details?: string | null
          giver_id?: string
          id?: string
          look?: string
          scratched_at?: string | null
          title: string
          used_at?: string | null
        }
        Update: {
          couple_id?: string
          created_at?: string
          details?: string | null
          giver_id?: string
          id?: string
          look?: string
          scratched_at?: string | null
          title?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean
          couple_id: string
          created_at: string
          created_by: string
          ends_at: string
          id: string
          kind: string
          location: string | null
          note: string | null
          pinned: boolean
          starts_at: string
          title: string
        }
        Insert: {
          all_day?: boolean
          couple_id?: string
          created_at?: string
          created_by?: string
          ends_at: string
          id?: string
          kind: string
          location?: string | null
          note?: string | null
          pinned?: boolean
          starts_at: string
          title: string
        }
        Update: {
          all_day?: boolean
          couple_id?: string
          created_at?: string
          created_by?: string
          ends_at?: string
          id?: string
          kind?: string
          location?: string | null
          note?: string | null
          pinned?: boolean
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_cents: number
          category: string
          couple_id: string
          created_at: string
          created_by: string
          id: string
          label: string
          owed_cents: number
          paid_by: string
          spent_on: string
        }
        Insert: {
          amount_cents: number
          category?: string
          couple_id?: string
          created_at?: string
          created_by?: string
          id?: string
          label: string
          owed_cents: number
          paid_by: string
          spent_on?: string
        }
        Update: {
          amount_cents?: number
          category?: string
          couple_id?: string
          created_at?: string
          created_by?: string
          id?: string
          label?: string
          owed_cents?: number
          paid_by?: string
          spent_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      list_items: {
        Row: {
          created_at: string
          created_by: string
          done: boolean
          id: string
          list_id: string
          position: number
          text: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          done?: boolean
          id?: string
          list_id: string
          position?: number
          text: string
        }
        Update: {
          created_at?: string
          created_by?: string
          done?: boolean
          id?: string
          list_id?: string
          position?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          couple_id: string
          created_at: string
          created_by: string
          id: string
          owner_id: string | null
          title: string
        }
        Insert: {
          couple_id?: string
          created_at?: string
          created_by?: string
          id?: string
          owner_id?: string | null
          title: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          created_by?: string
          id?: string
          owner_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      love_notes: {
        Row: {
          author_id: string
          body: string
          couple_id: string
          created_at: string
          drawn_at: string | null
          id: string
        }
        Insert: {
          author_id?: string
          body: string
          couple_id?: string
          created_at?: string
          drawn_at?: string | null
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          couple_id?: string
          created_at?: string
          drawn_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "love_notes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          added_by: string | null
          couple_id: string
          created_at: string
          done_at: string | null
          id: string
          item_id: string
          kind: string
          payload: Json
          source: string
        }
        Insert: {
          added_by?: string | null
          couple_id?: string
          created_at?: string
          done_at?: string | null
          id?: string
          item_id: string
          kind: string
          payload?: Json
          source?: string
        }
        Update: {
          added_by?: string | null
          couple_id?: string
          created_at?: string
          done_at?: string | null
          id?: string
          item_id?: string
          kind?: string
          payload?: Json
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          couple_id: string
          display_name: string
          joined_at: string
          user_id: string
        }
        Insert: {
          couple_id: string
          display_name: string
          joined_at?: string
          user_id: string
        }
        Update: {
          couple_id?: string
          display_name?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          couple_id: string
          match_id: string
          stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          couple_id?: string
          match_id: string
          stars: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          comment?: string | null
          couple_id?: string
          match_id?: string
          stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount_cents: number
          couple_id: string
          created_at: string
          created_by: string
          from_user: string
          id: string
          to_user: string
        }
        Insert: {
          amount_cents: number
          couple_id?: string
          created_at?: string
          created_by?: string
          from_user: string
          id?: string
          to_user: string
        }
        Update: {
          amount_cents?: number
          couple_id?: string
          created_at?: string
          created_by?: string
          from_user?: string
          id?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          added_by: string
          couple_id: string
          created_at: string
          episode: number
          finished: boolean
          id: string
          payload: Json
          season: number
          tmdb_id: number
          updated_at: string
        }
        Insert: {
          added_by?: string
          couple_id?: string
          created_at?: string
          episode?: number
          finished?: boolean
          id?: string
          payload: Json
          season?: number
          tmdb_id: number
          updated_at?: string
        }
        Update: {
          added_by?: string
          couple_id?: string
          created_at?: string
          episode?: number
          finished?: boolean
          id?: string
          payload?: Json
          season?: number
          tmdb_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shows_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          couple_id: string
          created_at: string
          item_id: string
          kind: string
          liked: boolean
          payload: Json
          user_id: string
        }
        Insert: {
          couple_id?: string
          created_at?: string
          item_id: string
          kind: string
          liked: boolean
          payload?: Json
          user_id?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          item_id?: string
          kind?: string
          liked?: boolean
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      vetoes: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          item_id: string
          title: string
          user_id: string
          week_start: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          item_id: string
          title: string
          user_id: string
          week_start: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          item_id?: string
          title?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "vetoes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_couple: { Args: { p_display_name: string }; Returns: string }
      current_week_start: { Args: never; Returns: string }
      draw_love_note: {
        Args: never
        Returns: {
          author_id: string
          body: string
          couple_id: string
          created_at: string
          drawn_at: string | null
          id: string
        }
        SetofOptions: {
          from: "*"
          to: "love_notes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_invite_code: { Args: never; Returns: string }
      join_couple: {
        Args: { p_code: string; p_display_name: string }
        Returns: string
      }
      love_notes_status: { Args: never; Returns: Json }
      my_couple_id: { Args: never; Returns: string }
      use_veto: { Args: { p_match_id: string }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
