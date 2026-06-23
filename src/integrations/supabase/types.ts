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
      clients: {
        Row: {
          id: string;
          lead_id: string | null;
          client_name: string;
          business_name: string;
          phone: string;
          email: string;
          industry: string;
          source: string;
          final_budget: string | null;
          quoted_price: number | null;
          final_price: number | null;
          advance_paid: number;
          remaining_amount: number;
          project_status: string;
          created_at: string;
          updated_at: string;
          project_name: string | null;
          project_type: string | null;
          project_description: string | null;
          scope_of_work: string | null;
          timeline: string | null;
          delivery_date: string | null;
          owner_name: string | null;
          business_address: string | null;
          gst_number: string | null;
          business_website: string | null;
          business_email: string | null;
          advance_amount: number | null;
          payment_status: string;
          agreement_date: string | null;
          project_start_date: string | null;
          project_end_date: string | null;
          revision_count: number;
          terms_notes: string | null;
          primary_contact_name: string | null;
          primary_contact_phone: string | null;
          primary_contact_email: string | null;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          client_name: string;
          business_name: string;
          phone: string;
          email: string;
          industry: string;
          source?: string;
          final_budget?: string | null;
          quoted_price?: number | null;
          final_price?: number | null;
          advance_paid?: number;
          remaining_amount?: number;
          project_status?: string;
          created_at?: string;
          updated_at?: string;
          project_name?: string | null;
          project_type?: string | null;
          project_description?: string | null;
          scope_of_work?: string | null;
          timeline?: string | null;
          delivery_date?: string | null;
          owner_name?: string | null;
          business_address?: string | null;
          gst_number?: string | null;
          business_website?: string | null;
          business_email?: string | null;
          advance_amount?: number | null;
          payment_status?: string;
          agreement_date?: string | null;
          project_start_date?: string | null;
          project_end_date?: string | null;
          revision_count?: number;
          terms_notes?: string | null;
          primary_contact_name?: string | null;
          primary_contact_phone?: string | null;
          primary_contact_email?: string | null;
        };
        Update: Partial<{
          id: string;
          lead_id: string | null;
          client_name: string;
          business_name: string;
          phone: string;
          email: string;
          industry: string;
          source: string;
          final_budget: string | null;
          quoted_price: number | null;
          final_price: number | null;
          advance_paid: number;
          remaining_amount: number;
          project_status: string;
          created_at: string;
          updated_at: string;
          project_name: string | null;
          project_type: string | null;
          project_description: string | null;
          scope_of_work: string | null;
          timeline: string | null;
          delivery_date: string | null;
          owner_name: string | null;
          business_address: string | null;
          gst_number: string | null;
          business_website: string | null;
          business_email: string | null;
          advance_amount: number | null;
          payment_status: string;
          agreement_date: string | null;
          project_start_date: string | null;
          project_end_date: string | null;
          revision_count: number;
          terms_notes: string | null;
          primary_contact_name: string | null;
          primary_contact_phone: string | null;
          primary_contact_email: string | null;
        }>;
        Relationships: [];
      };
      client_notes: {
        Row: {
          id: string;
          client_id: string;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          note: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          client_id: string;
          note: string;
          created_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      client_documents: {
        Row: {
          id: string;
          client_id: string;
          doc_type: string;
          invoice_subtype: string | null;
          status: string;
          generated_at: string | null;
          file_url: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          doc_type: string;
          invoice_subtype?: string | null;
          status?: string;
          generated_at?: string | null;
          file_url?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          client_id: string;
          doc_type: string;
          invoice_subtype: string | null;
          status: string;
          generated_at: string | null;
          file_url: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
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
