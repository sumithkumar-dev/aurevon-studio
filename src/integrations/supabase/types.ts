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
          // --- Sales workflow CRM fields ---
          owner_name: string | null;
          whatsapp_number: string | null;
          business_category: string | null;
          city: string | null;
          address: string | null;
          website_url: string | null;
          instagram_url: string | null;
          google_maps_url: string | null;
          facebook_url: string | null;
          last_contact_date: string | null;
          next_followup_date: string | null;
          best_time_to_call: string | null;
          preferred_contact_method: string | null;
          decision_maker: string | null;
          marketing_handled_by: string | null;
          future_plans: string | null;
          pain_points: string | null;
          objections: string | null;
          next_best_action: string | null;
          general_notes: string | null;
          research_notes: string | null;
          sort_order: number;
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
          owner_name?: string | null;
          whatsapp_number?: string | null;
          business_category?: string | null;
          city?: string | null;
          address?: string | null;
          website_url?: string | null;
          instagram_url?: string | null;
          google_maps_url?: string | null;
          facebook_url?: string | null;
          last_contact_date?: string | null;
          next_followup_date?: string | null;
          best_time_to_call?: string | null;
          preferred_contact_method?: string | null;
          decision_maker?: string | null;
          marketing_handled_by?: string | null;
          future_plans?: string | null;
          pain_points?: string | null;
          objections?: string | null;
          next_best_action?: string | null;
          general_notes?: string | null;
          research_notes?: string | null;
          sort_order?: number;
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
          owner_name: string | null;
          whatsapp_number: string | null;
          business_category: string | null;
          city: string | null;
          address: string | null;
          website_url: string | null;
          instagram_url: string | null;
          google_maps_url: string | null;
          facebook_url: string | null;
          last_contact_date: string | null;
          next_followup_date: string | null;
          best_time_to_call: string | null;
          preferred_contact_method: string | null;
          decision_maker: string | null;
          marketing_handled_by: string | null;
          future_plans: string | null;
          pain_points: string | null;
          objections: string | null;
          next_best_action: string | null;
          general_notes: string | null;
          research_notes: string | null;
          sort_order: number;
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
          // --- Infrastructure & renewals ---
          domain_registrar: string | null;
          hosting_provider: string | null;
          github_url: string | null;
          vercel_url: string | null;
          supabase_project_url: string | null;
          google_search_console_url: string | null;
          google_analytics_url: string | null;
          google_business_profile_url: string | null;
          monthly_plan: string | null;
          maintenance_plan: string | null;
          monthly_revenue: number;
          domain_expiry: string | null;
          hosting_expiry: string | null;
          current_features: string | null;
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
          domain_registrar?: string | null;
          hosting_provider?: string | null;
          github_url?: string | null;
          vercel_url?: string | null;
          supabase_project_url?: string | null;
          google_search_console_url?: string | null;
          google_analytics_url?: string | null;
          google_business_profile_url?: string | null;
          monthly_plan?: string | null;
          maintenance_plan?: string | null;
          monthly_revenue?: number;
          domain_expiry?: string | null;
          hosting_expiry?: string | null;
          current_features?: string | null;
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
          domain_registrar: string | null;
          hosting_provider: string | null;
          github_url: string | null;
          vercel_url: string | null;
          supabase_project_url: string | null;
          google_search_console_url: string | null;
          google_analytics_url: string | null;
          google_business_profile_url: string | null;
          monthly_plan: string | null;
          maintenance_plan: string | null;
          monthly_revenue: number;
          domain_expiry: string | null;
          hosting_expiry: string | null;
          current_features: string | null;
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
      timeline_events: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          event_type: string;
          title: string;
          body: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          event_type: string;
          title: string;
          body?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          entity_type: string;
          entity_id: string;
          event_type: string;
          title: string;
          body: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          title: string;
          due_date: string | null;
          is_done: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          title: string;
          due_date?: string | null;
          is_done?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          entity_type: string;
          entity_id: string;
          title: string;
          due_date: string | null;
          is_done: boolean;
          completed_at: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      call_scripts: {
        Row: {
          id: string;
          name: string;
          blocks: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          blocks?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          name: string;
          blocks: Json;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
