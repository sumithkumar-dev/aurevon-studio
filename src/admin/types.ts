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
    "source" | "status" | "priority" | "final_budget" | "follow_up_date"
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
  >
>;

export type NewClientInput = Omit<
  Client,
  "id" | "created_at" | "updated_at" | "remaining_amount"
>;
