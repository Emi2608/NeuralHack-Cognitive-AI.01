// Generated Supabase types will go here
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          date_of_birth: string | null;
          education_level: number | null;
          language: string;
          accessibility_settings: any | null;
          consent_given: boolean;
          consent_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          date_of_birth?: string | null;
          education_level?: number | null;
          language?: string;
          accessibility_settings?: any | null;
          consent_given?: boolean;
          consent_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          date_of_birth?: string | null;
          education_level?: number | null;
          language?: string;
          accessibility_settings?: any | null;
          consent_given?: boolean;
          consent_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      assessment_sessions: {
        Row: {
          id: string;
          user_id: string;
          test_type: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          responses: any | null;
          result: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_type: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          responses?: any | null;
          result?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          test_type?: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          responses?: any | null;
          result?: any | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: any | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
