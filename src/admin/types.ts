// Shared domain types for the AUREVON admin CRM.

export type LeadStatus =
  | "New"
  | "Researching"
  | "Ready to Call"
  | "Called"
  | "Interested"
  | "Demo Sent"
  | "Meeting Scheduled"
  | "Proposal Sent"
  | "Negotiating"
  | "Won"
  | "Lost"
  | "Follow Up Later";

export type LeadPriority = "High" | "Medium" | "Low";

export type LeadSource =
  | "Website"
  | "Cold Call"
  | "Referral"
  | "Instagram"
  | "WhatsApp"
  | "Other";

export type PreferredContactMethod = "Call" | "WhatsApp" | "Email" | "Instagram DM" | "In Person";

export type Lead = {
  id: string;
  created_at: string;

  // --- Basic information ---
  business_name: string;
  /** Owner / contact person's name. Falls back to the legacy `name` column. */
  owner_name: string;
  phone: string;
  whatsapp_number: string | null;
  email: string;
  /** Falls back to the legacy `industry` column. */
  business_category: string;
  city: string | null;
  address: string | null;

  // --- Online presence ---
  website_url: string | null;
  instagram_url: string | null;
  google_maps_url: string | null;
  facebook_url: string | null;

  // --- Sales information ---
  status: LeadStatus;
  priority: LeadPriority;
  sort_order: number;

  // --- Important dates ---
  last_contact_date: string | null;
  /** Canonical next follow-up date. */
  next_followup_date: string | null;

  // --- Business notes ---
  best_time_to_call: string | null;
  preferred_contact_method: string | null;
  decision_maker: string | null;
  marketing_handled_by: string | null;
  future_plans: string | null;
  pain_points: string | null;
  objections: string | null;
  next_best_action: string | null;
  general_notes: string | null;

  // --- Research notes (long markdown) ---
  research_notes: string | null;

  // --- Legacy fields (kept for backward compatibility) ---
  name: string;
  industry: string;
  budget: string;
  message: string | null;
  source: LeadSource;
  final_budget: string | null;
  follow_up_date: string | null;
};

export type LeadNote = {
  id: string;
  lead_id: string;
  note: string;
  created_at: string;
};

export type LeadPatch = Partial<
  Pick<
    Lead,
    | "name"
    | "owner_name"
    | "business_name"
    | "phone"
    | "whatsapp_number"
    | "email"
    | "industry"
    | "business_category"
    | "city"
    | "address"
    | "budget"
    | "source"
    | "status"
    | "priority"
    | "sort_order"
    | "final_budget"
    | "follow_up_date"
    | "next_followup_date"
    | "last_contact_date"
    | "website_url"
    | "instagram_url"
    | "google_maps_url"
    | "facebook_url"
    | "best_time_to_call"
    | "preferred_contact_method"
    | "decision_maker"
    | "marketing_handled_by"
    | "future_plans"
    | "pain_points"
    | "objections"
    | "next_best_action"
    | "general_notes"
    | "research_notes"
  >
>;

export type NewLeadInput = {
  business_name: string;
  owner_name: string;
  phone: string;
  whatsapp_number?: string | null;
  email?: string;
  business_category: string;
  city?: string | null;
  address?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  google_maps_url?: string | null;
  facebook_url?: string | null;
  priority?: LeadPriority;
  source?: LeadSource;
  note?: string;
};

// ----- Timeline (shared by leads and clients) ----------------------------

export type TimelineEntityType = "lead" | "client";

export type TimelineEventType =
  | "call"
  | "note"
  | "status_change"
  | "priority_change"
  | "email"
  | "whatsapp"
  | "meeting"
  | "demo_sent"
  | "proposal_sent"
  | "follow_up"
  | "website_delivered"
  | "bug_fix"
  | "feature_request"
  | "event_update"
  | "payment_received"
  | "task_completed"
  | "converted"
  | "other";

export type TimelineEvent = {
  id: string;
  entity_type: TimelineEntityType;
  entity_id: string;
  event_type: TimelineEventType;
  title: string;
  body: string | null;
  created_at: string;
};

// ----- Tasks (shared by leads and clients) --------------------------------

export type Task = {
  id: string;
  entity_type: TimelineEntityType;
  entity_id: string;
  title: string;
  due_date: string | null;
  is_done: boolean;
  completed_at: string | null;
  created_at: string;
};

// ----- Clients -----------------------------------------------------------

export type ProjectStatus =
  | "Advance Pending"
  | "Advance Paid"
  | "In Progress"
  | "Review"
  | "Delivered"
  | "Closed"
  | "Cancelled";

export type PaymentStatus =
  | "Not Started"
  | "Advance Paid"
  | "Partially Paid"
  | "Fully Paid"
  | "Refunded";

export type Client = {
  id: string;
  lead_id: string | null;
  client_name: string;
  business_name: string;
  phone: string;
  email: string;
  industry: string;
  source: LeadSource;
  final_budget: string | null;
  quoted_price: number | null;
  final_price: number | null;
  advance_paid: number;
  remaining_amount: number;
  project_status: ProjectStatus;
  created_at: string;
  updated_at: string;

  // --- Project Details ---
  project_name: string | null;
  project_type: string | null;
  project_description: string | null;
  scope_of_work: string | null;
  timeline: string | null;
  delivery_date: string | null;

  // --- Business Details ---
  owner_name: string | null;
  business_address: string | null;
  gst_number: string | null;
  business_website: string | null;
  business_email: string | null;

  // --- Billing Details ---
  advance_amount: number | null;
  payment_status: PaymentStatus;

  // --- Agreement Details ---
  agreement_date: string | null;
  project_start_date: string | null;
  project_end_date: string | null;
  revision_count: number;
  terms_notes: string | null;

  // --- Document Contact Details ---
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;

  // --- Infrastructure ---
  domain_registrar: string | null;
  hosting_provider: string | null;
  github_url: string | null;
  vercel_url: string | null;
  supabase_project_url: string | null;
  google_search_console_url: string | null;
  google_analytics_url: string | null;
  google_business_profile_url: string | null;

  // --- Plans & recurring revenue ---
  monthly_plan: string | null;
  maintenance_plan: string | null;
  monthly_revenue: number;

  // --- Renewals ---
  domain_expiry: string | null;
  hosting_expiry: string | null;

  // --- Ongoing scope ---
  current_features: string | null;
};

export type ClientNote = {
  id: string;
  client_id: string;
  note: string;
  created_at: string;
};

export type ClientPatch = Partial<
  Pick<
    Client,
    | "client_name"
    | "business_name"
    | "phone"
    | "email"
    | "industry"
    | "source"
    | "final_budget"
    | "quoted_price"
    | "final_price"
    | "advance_paid"
    | "project_status"
    // new fields below
    | "project_name"
    | "project_type"
    | "project_description"
    | "scope_of_work"
    | "timeline"
    | "delivery_date"
    | "owner_name"
    | "business_address"
    | "gst_number"
    | "business_website"
    | "business_email"
    | "advance_amount"
    | "payment_status"
    | "agreement_date"
    | "project_start_date"
    | "project_end_date"
    | "revision_count"
    | "terms_notes"
    | "remaining_amount"
    | "primary_contact_name"
    | "primary_contact_phone"
    | "primary_contact_email"
    // infrastructure & renewals
    | "domain_registrar"
    | "hosting_provider"
    | "github_url"
    | "vercel_url"
    | "supabase_project_url"
    | "google_search_console_url"
    | "google_analytics_url"
    | "google_business_profile_url"
    | "monthly_plan"
    | "maintenance_plan"
    | "monthly_revenue"
    | "domain_expiry"
    | "hosting_expiry"
    | "current_features"
  >
>;

export type NewClientInput = Omit<
  Client,
  | "id"
  | "created_at"
  | "updated_at"
  | "remaining_amount"
  // New fields are optional at creation time; defaulted server-side or in code.
  | "project_name"
  | "project_type"
  | "project_description"
  | "scope_of_work"
  | "timeline"
  | "delivery_date"
  | "owner_name"
  | "business_address"
  | "gst_number"
  | "business_website"
  | "business_email"
  | "advance_amount"
  | "payment_status"
  | "agreement_date"
  | "project_start_date"
  | "project_end_date"
  | "revision_count"
  | "terms_notes"
  | "primary_contact_name"
  | "primary_contact_phone"
  | "primary_contact_email"
  | "domain_registrar"
  | "hosting_provider"
  | "github_url"
  | "vercel_url"
  | "supabase_project_url"
  | "google_search_console_url"
  | "google_analytics_url"
  | "google_business_profile_url"
  | "monthly_plan"
  | "maintenance_plan"
  | "monthly_revenue"
  | "domain_expiry"
  | "hosting_expiry"
  | "current_features"
>;

// ----- Documents ---------------------------------------------------------

export type DocumentType = "Proposal" | "Agreement" | "Invoice" | "Handover";
export type DocumentStatus = "Not Generated" | "Generated";
export type InvoiceSubtype = "advance" | "final" | "unified";

export type ClientDocument = {
  id: string;
  client_id: string;
  doc_type: DocumentType;
  invoice_subtype?: InvoiceSubtype | null;
  status: DocumentStatus;
  generated_at: string | null;
  file_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
