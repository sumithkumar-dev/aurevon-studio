import type {
  LeadPriority,
  LeadSource,
  LeadStatus,
  ProjectStatus,
} from "./types";

export const STATUS_OPTIONS: LeadStatus[] = [
  "New",
  "Contacted",
  "Interested",
  "Proposal Sent",
  "Rejected",
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

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  "Advance Pending",
  "Advance Paid",
  "In Progress",
  "Review",
  "Delivered",
  "Closed",
  "Cancelled",
];
