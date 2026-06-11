import { supabase } from "@/integrations/supabase/client";
import type { Lead, LeadNote, LeadPatch, NewLeadInput } from "../types";

const LEADS_TABLE = "contact_submissions";
const NOTES_TABLE = "lead_notes";

// Normalise a raw row into a fully-typed Lead, filling sensible CRM defaults
// for any legacy row created before the CRM migration.
function normaliseLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    name: (row.name as string) ?? "",
    business_name: (row.business_name as string) ?? "",
    phone: (row.phone as string) ?? "",
    email: (row.email as string) ?? "",
    industry: (row.industry as string) ?? "",
    budget: (row.budget as string) ?? "",
    message: (row.message as string | null) ?? null,
    created_at: (row.created_at as string) ?? new Date().toISOString(),
    source: ((row.source as Lead["source"]) ?? "Website") as Lead["source"],
    status: ((row.status as Lead["status"]) ?? "New") as Lead["status"],
    priority: ((row.priority as Lead["priority"]) ??
      "Medium") as Lead["priority"],
    final_budget: (row.final_budget as string | null) ?? null,
    follow_up_date: (row.follow_up_date as string | null) ?? null,
  };
}

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    normaliseLead(row as Record<string, unknown>),
  );
}

export async function updateLead(id: string, patch: LeadPatch): Promise<void> {
  const { error } = await supabase.from(LEADS_TABLE).update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteLead(id: string): Promise<void> {
  // Primary path: ON DELETE CASCADE on lead_notes.lead_id removes notes.
  // Fallback: explicitly delete notes first in case the FK/CASCADE is missing
  // on legacy databases. Safe to run either way.
  const { error: notesError } = await supabase
    .from(NOTES_TABLE)
    .delete()
    .eq("lead_id", id);
  if (notesError) throw new Error(notesError.message);

  const { error } = await supabase.from(LEADS_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createLead(input: NewLeadInput): Promise<Lead> {
  const { note, ...lead } = input;
  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .insert({
      name: lead.name,
      business_name: lead.business_name,
      phone: lead.phone,
      email: lead.email,
      industry: lead.industry,
      budget: lead.budget,
      source: lead.source,
      status: "New",
      priority: "Medium",
      message: null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  const created = normaliseLead(data as Record<string, unknown>);

  if (note && note.trim()) {
    await addNote(created.id, note.trim());
  }
  return created;
}

export async function fetchNotes(leadId: string): Promise<LeadNote[]> {
  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LeadNote[];
}

export async function addNote(
  leadId: string,
  content: string,
): Promise<LeadNote> {
  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .insert({ lead_id: leadId, note: content })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as LeadNote;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from(NOTES_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
