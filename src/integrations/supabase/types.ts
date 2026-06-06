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
