import type {
  DocumentType,
  LeadPriority,
  LeadSource,
  LeadStatus,
  PaymentStatus,
  ProjectStatus,
} from "./types";

export const STATUS_OPTIONS: LeadStatus[] = [
  "New",
  "Researching",
  "Ready to Call",
  "Called",
  "Interested",
  "Demo Sent",
  "Meeting Scheduled",
  "Proposal Sent",
  "Negotiating",
  "Won",
  "Lost",
  "Follow Up Later",
];

/** Statuses considered "closed" — no further action expected on the lead. */
export const CLOSED_STATUSES: LeadStatus[] = ["Won", "Lost"];

/** Funnel stages shown on the dashboard, in pipeline order. */
export const FUNNEL_STATUSES: LeadStatus[] = [
  "New",
  "Ready to Call",
  "Interested",
  "Demo Sent",
  "Meeting Scheduled",
  "Won",
];

export const PRIORITY_OPTIONS: LeadPriority[] = ["High", "Medium", "Low"];

export const SOURCE_OPTIONS: LeadSource[] = [
  "Website",
  "Cold Call",
  "Referral",
  "Instagram",
  "WhatsApp",
  "Other",
];

export const INDUSTRY_OPTIONS: string[] = [
  "Dental Clinic",
  "Dermatology Clinic",
  "Cafe",
  "Restaurant",
  "Gym",
  "Salon",
  "Real Estate",
  "Education",
  "Hospital",
  "Other",
];

export const BUDGET_OPTIONS: string[] = [
  "Below ₹10,000",
  "₹10,000 - ₹20,000",
  "₹20,000 - ₹40,000",
  "₹40,000 - ₹60,000",
  "₹60,000+",
];

export const PREFERRED_CONTACT_METHOD_OPTIONS: string[] = [
  "Call",
  "WhatsApp",
  "Email",
  "Instagram DM",
  "In Person",
];

export const BEST_TIME_TO_CALL_OPTIONS: string[] = [
  "Morning (9–12)",
  "Afternoon (12–4)",
  "Evening (4–7)",
  "Night (7–9)",
  "Weekends only",
];

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  "Advance Pending",
  "Advance Paid",
  "In Progress",
  "Review",
  "Delivered",
  "Closed",
  "Cancelled",
];

export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "Not Started",
  "Advance Paid",
  "Partially Paid",
  "Fully Paid",
  "Refunded",
];

export const PAYMENT_METHOD_OPTIONS: string[] = [
  "UPI",
  "Bank Transfer",
  "Cash",
  "Other",
];

export const DOCUMENT_TYPES: DocumentType[] = [
  "Proposal",
  "Agreement",
  "Invoice",
  "Handover",
];

export const TIMELINE_EVENT_TYPE_LABELS: Record<string, string> = {
  call: "Call",
  note: "Note",
  status_change: "Status change",
  priority_change: "Priority change",
  email: "Email",
  whatsapp: "WhatsApp",
  meeting: "Meeting",
  demo_sent: "Demo sent",
  proposal_sent: "Proposal sent",
  follow_up: "Follow-up",
  website_delivered: "Website delivered",
  bug_fix: "Bug fix",
  feature_request: "Feature request",
  event_update: "Event update",
  payment_received: "Payment received",
  task_completed: "Task completed",
  converted: "Converted",
  other: "Other",
};

/** Quick-log options shown on a Lead's Call History. */
export const LEAD_TIMELINE_EVENT_TYPES: string[] = [
  "call",
  "whatsapp",
  "email",
  "meeting",
  "demo_sent",
  "proposal_sent",
  "follow_up",
  "note",
  "other",
];

/** Quick-log options shown on a Client's Timeline. */
export const CLIENT_TIMELINE_EVENT_TYPES: string[] = [
  "call",
  "meeting",
  "website_delivered",
  "bug_fix",
  "feature_request",
  "event_update",
  "payment_received",
  "note",
  "other",
];
