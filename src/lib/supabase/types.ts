export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          nickname: string;
          birth_date: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          weight_goal: string | null;
          health_concerns: Json;
          current_condition: string | null;
          favorite_foods: Json;
          avoided_foods: Json;
          allergies: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nickname: string;
          birth_date?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          weight_goal?: string | null;
          health_concerns?: Json;
          current_condition?: string | null;
          favorite_foods?: Json;
          avoided_foods?: Json;
          allergies?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nickname?: string;
          birth_date?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          weight_goal?: string | null;
          health_concerns?: Json;
          current_condition?: string | null;
          favorite_foods?: Json;
          avoided_foods?: Json;
          allergies?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_checkins: {
        Row: {
          id: string;
          user_id: string;
          condition_score: number;
          sleep_quality: number;
          stress_level: number;
          exercised_today: boolean;
          appetite: string | null;
          digestion: string | null;
          symptoms: Json;
          symptom_severity: number | null;
          water_intake: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          condition_score: number;
          sleep_quality: number;
          stress_level: number;
          exercised_today?: boolean;
          appetite?: string | null;
          digestion?: string | null;
          symptoms?: Json;
          symptom_severity?: number | null;
          water_intake?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          condition_score?: number;
          sleep_quality?: number;
          stress_level?: number;
          exercised_today?: boolean;
          appetite?: string | null;
          digestion?: string | null;
          symptoms?: Json;
          symptom_severity?: number | null;
          water_intake?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          source_profile_snapshot: Json;
          source_checkin_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          source_profile_snapshot: Json;
          source_checkin_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start_date?: string;
          source_profile_snapshot?: Json;
          source_checkin_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plans_source_checkin_user_id_fkey";
            columns: ["user_id", "source_checkin_id"];
            isOneToOne: false;
            referencedRelation: "daily_checkins";
            referencedColumns: ["user_id", "id"];
          },
        ];
      };
      meal_plan_days: {
        Row: {
          id: string;
          user_id: string;
          meal_plan_id: string;
          day_index: number;
          date: string;
          breakfast: Json;
          lunch: Json;
          dinner: Json;
          snack: Json | null;
          explanation: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          meal_plan_id: string;
          day_index: number;
          date: string;
          breakfast: Json;
          lunch: Json;
          dinner: Json;
          snack?: Json | null;
          explanation?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          meal_plan_id?: string;
          day_index?: number;
          date?: string;
          breakfast?: Json;
          lunch?: Json;
          dinner?: Json;
          snack?: Json | null;
          explanation?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plan_days_meal_plan_user_id_fkey";
            columns: ["user_id", "meal_plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["user_id", "id"];
          },
        ];
      };
      guidance_items: {
        Row: {
          id: string;
          user_id: string;
          source_checkin_id: string | null;
          category: string;
          title: string;
          content: string;
          safety_notice: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_checkin_id?: string | null;
          category: string;
          title: string;
          content: string;
          safety_notice?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_checkin_id?: string | null;
          category?: string;
          title?: string;
          content?: string;
          safety_notice?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guidance_items_source_checkin_user_id_fkey";
            columns: ["user_id", "source_checkin_id"];
            isOneToOne: false;
            referencedRelation: "daily_checkins";
            referencedColumns: ["user_id", "id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
