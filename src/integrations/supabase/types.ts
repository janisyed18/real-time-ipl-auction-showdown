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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      auction_rooms: {
        Row: {
          accelerated_rounds: boolean | null
          bid_turn_seconds: number | null
          code: string
          created_at: string
          host_user_id: string
          id: string
          nomination_seconds: number | null
          overseas_max: number | null
          purse_cr: number | null
          rtm_enabled: boolean | null
          squad_max: number | null
          squad_min: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          accelerated_rounds?: boolean | null
          bid_turn_seconds?: number | null
          code: string
          created_at?: string
          host_user_id: string
          id?: string
          nomination_seconds?: number | null
          overseas_max?: number | null
          purse_cr?: number | null
          rtm_enabled?: boolean | null
          squad_max?: number | null
          squad_min?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          accelerated_rounds?: boolean | null
          bid_turn_seconds?: number | null
          code?: string
          created_at?: string
          host_user_id?: string
          id?: string
          nomination_seconds?: number | null
          overseas_max?: number | null
          purse_cr?: number | null
          rtm_enabled?: boolean | null
          squad_max?: number | null
          squad_min?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bids: {
        Row: {
          amount_cr: number
          created_at: string
          id: string
          player_id: string
          room_id: string
          team_id: string
        }
        Insert: {
          amount_cr: number
          created_at?: string
          id?: string
          player_id: string
          room_id: string
          team_id: string
        }
        Update: {
          amount_cr?: number
          created_at?: string
          id?: string
          player_id?: string
          room_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "auction_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      current_auction: {
        Row: {
          base_cr: number | null
          created_at: string
          current_player_id: string | null
          high_bid_cr: number | null
          high_team_id: string | null
          nominated_by: string | null
          phase: string
          room_id: string
          turn_ends_at: string | null
          updated_at: string
        }
        Insert: {
          base_cr?: number | null
          created_at?: string
          current_player_id?: string | null
          high_bid_cr?: number | null
          high_team_id?: string | null
          nominated_by?: string | null
          phase?: string
          room_id: string
          turn_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          base_cr?: number | null
          created_at?: string
          current_player_id?: string | null
          high_bid_cr?: number | null
          high_team_id?: string | null
          nominated_by?: string | null
          phase?: string
          room_id?: string
          turn_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "current_auction_current_player_id_fkey"
            columns: ["current_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "current_auction_high_team_id_fkey"
            columns: ["high_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "current_auction_nominated_by_fkey"
            columns: ["nominated_by"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "current_auction_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "auction_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          base_price_cr: number
          country: string | null
          created_at: string
          id: string
          image_url: string | null
          is_marquee: boolean | null
          is_overseas: boolean
          name: string
          role: string
        }
        Insert: {
          base_price_cr?: number
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_marquee?: boolean | null
          is_overseas?: boolean
          name: string
          role: string
        }
        Update: {
          base_price_cr?: number
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_marquee?: boolean | null
          is_overseas?: boolean
          name?: string
          role?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      room_players: {
        Row: {
          created_at: string
          id: string
          is_ai: boolean | null
          nickname: string
          overseas_in_squad: number | null
          purse_left_cr: number
          room_id: string
          slots_left: number
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_ai?: boolean | null
          nickname: string
          overseas_in_squad?: number | null
          purse_left_cr: number
          room_id: string
          slots_left: number
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_ai?: boolean | null
          nickname?: string
          overseas_in_squad?: number | null
          purse_left_cr?: number
          room_id?: string
          slots_left?: number
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "auction_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      roster: {
        Row: {
          created_at: string
          id: string
          is_overseas: boolean
          player_id: string
          price_cr: number
          role: string
          room_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_overseas: boolean
          player_id: string
          price_cr: number
          role: string
          room_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_overseas?: boolean
          player_id?: string
          price_cr?: number
          role?: string
          room_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "auction_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      stats_t20: {
        Row: {
          batting_avg: number | null
          batting_sr: number | null
          boundary_pct: number | null
          bowling_econ: number | null
          bowling_sr: number | null
          created_at: string
          death_econ: number | null
          id: string
          matches_played: number | null
          player_id: string
          pp_sr: number | null
          recent_form: number | null
          updated_at: string
        }
        Insert: {
          batting_avg?: number | null
          batting_sr?: number | null
          boundary_pct?: number | null
          bowling_econ?: number | null
          bowling_sr?: number | null
          created_at?: string
          death_econ?: number | null
          id?: string
          matches_played?: number | null
          player_id: string
          pp_sr?: number | null
          recent_form?: number | null
          updated_at?: string
        }
        Update: {
          batting_avg?: number | null
          batting_sr?: number | null
          boundary_pct?: number | null
          bowling_econ?: number | null
          bowling_sr?: number | null
          created_at?: string
          death_econ?: number | null
          id?: string
          matches_played?: number | null
          player_id?: string
          pp_sr?: number | null
          recent_form?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stats_t20_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          full_name: string
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          short_name: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          short_name: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          short_name?: string
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
      get_user_room_ids: {
        Args: { _user_id: string }
        Returns: {
          room_id: string
        }[]
      }
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
