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
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          business_name: string;
          phone: string;
          email: string;
          industry: string;
          budget: string;
          message: string | null;
          created_at: string;
          // CRM fields (added by supabase/migrations/0001_crm_leads.sql)
          source: string;
          status: string;
          priority: string;
          final_budget: string | null;
          follow_up_date: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          business_name: string;
          phone: string;
          email: string;
          industry: string;
          budget: string;
          message?: string | null;
          created_at?: string;
          source?: string;
          status?: string;
          priority?: string;
          final_budget?: string | null;
          follow_up_date?: string | null;
        };
        Update: Partial<{
          id: string;
          name: string;
          business_name: string;
          phone: string;
          email: string;
          industry: string;
          budget: string;
          message: string | null;
          created_at: string;
          source: string;
          status: string;
          priority: string;
          final_budget: string | null;
          follow_up_date: string | null;
        }>;
        Relationships: [];
      };
      lead_notes: {
        Row: {
          id: string;
          lead_id: string;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          note: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          lead_id: string;
          note: string;
          created_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey";
            columns: ["lead_id"];
            referencedRelation: "contact_submissions";
            referencedColumns: ["id"];
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
