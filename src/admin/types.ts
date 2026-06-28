// Shared domain types for the AUREVON admin CRM.

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Proposal Sent"
  | "Rejected";

export type LeadPriority = "High" | "Medium" | "Low";

export type LeadSource =
  | "Website"
  | "Cold Call"
  | "Referral"
  | "Instagram"
  | "WhatsApp"
  | "Other";

export type Lead = {
  id: string;
  name: string;
  business_name: string;
  phone: string;
  email: string;
  industry: string;
  budget: string;
  message: string | null;
  created_at: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
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
    | "business_name"
    | "phone"
    | "email"
    | "industry"
    | "budget"
    | "source"
    | "status"
    | "priority"
    | "final_budget"
    | "follow_up_date"
  >
>;

export type NewLeadInput = {
  name: string;
  business_name: string;
  phone: string;
  email: string;
  source: LeadSource;
  industry: string;
  budget: string;
  note?: string;
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
