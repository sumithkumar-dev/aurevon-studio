import { supabase } from "@/integrations/supabase/client";
import { reindex } from "../utils";
import { addTimelineEvent } from "./timeline";
import type { Lead, LeadNote, LeadPatch, LeadPriority, NewLeadInput } from "../types";

const LEADS_TABLE = "contact_submissions";
const NOTES_TABLE = "lead_notes";

// Normalise a raw row into a fully-typed Lead, filling sensible CRM defaults
// for any legacy row created before the sales-workflow migration. Every new
// field falls back to its closest legacy counterpart (owner_name <- name,
// business_category <- industry, next_followup_date <- follow_up_date) so
// pre-migration rows render correctly with zero manual backfill required
// client-side (the SQL migration also backfills these server-side).
function normaliseLead(row: Record<string, unknown>): Lead {
  const name = (row.name as string) ?? "";
  const industry = (row.industry as string) ?? "";
  const followUpDate = (row.follow_up_date as string | null) ?? null;

  return {
    id: String(row.id),
    created_at: (row.created_at as string) ?? new Date().toISOString(),

    business_name: (row.business_name as string) ?? "",
    owner_name: ((row.owner_name as string) || name) ?? "",
    phone: (row.phone as string) ?? "",
    whatsapp_number: (row.whatsapp_number as string | null) ?? null,
    email: (row.email as string) ?? "",
    business_category: ((row.business_category as string) || industry) ?? "",
    city: (row.city as string | null) ?? null,
    address: (row.address as string | null) ?? null,

    website_url: (row.website_url as string | null) ?? null,
    instagram_url: (row.instagram_url as string | null) ?? null,
    google_maps_url: (row.google_maps_url as string | null) ?? null,
    facebook_url: (row.facebook_url as string | null) ?? null,

    status: ((row.status as Lead["status"]) ?? "New") as Lead["status"],
    priority: ((row.priority as Lead["priority"]) ??
      "Medium") as Lead["priority"],
    sort_order: Number(row.sort_order ?? 0),

    last_contact_date: (row.last_contact_date as string | null) ?? null,
    next_followup_date:
      (row.next_followup_date as string | null) ?? followUpDate,

    best_time_to_call: (row.best_time_to_call as string | null) ?? null,
    preferred_contact_method:
      (row.preferred_contact_method as string | null) ?? null,
    decision_maker: (row.decision_maker as string | null) ?? null,
    marketing_handled_by: (row.marketing_handled_by as string | null) ?? null,
    future_plans: (row.future_plans as string | null) ?? null,
    pain_points: (row.pain_points as string | null) ?? null,
    objections: (row.objections as string | null) ?? null,
    next_best_action: (row.next_best_action as string | null) ?? null,
    general_notes: (row.general_notes as string | null) ?? null,

    research_notes: (row.research_notes as string | null) ?? null,

    // Legacy mirrors
    name,
    industry,
    budget: (row.budget as string) ?? "",
    message: (row.message as string | null) ?? null,
    source: ((row.source as Lead["source"]) ?? "Website") as Lead["source"],
    final_budget: (row.final_budget as string | null) ?? null,
    follow_up_date: followUpDate,
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
  // Keep legacy mirror columns in sync so any code still reading the old
  // columns (name/industry/follow_up_date) never goes stale.
  const dbPatch: LeadPatch & Record<string, unknown> = { ...patch };
  if (patch.owner_name !== undefined) dbPatch.name = patch.owner_name;
  if (patch.business_category !== undefined)
    dbPatch.industry = patch.business_category;
  if (patch.next_followup_date !== undefined)
    dbPatch.follow_up_date = patch.next_followup_date;

  const { error } = await supabase
    .from(LEADS_TABLE)
    .update(dbPatch)
    .eq("id", id);
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

  // Timeline events and tasks are polymorphic (no DB-level FK/cascade), so
  // they're cleaned up explicitly here too.
  await supabase
    .from("timeline_events")
    .delete()
    .eq("entity_type", "lead")
    .eq("entity_id", id);
  await supabase.from("tasks").delete().eq("entity_type", "lead").eq("entity_id", id);

  const { error } = await supabase.from(LEADS_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Next sort_order for a new/moved lead landing at the bottom of a priority
 * column — one higher than the current max in that column. */
export function nextSortOrder(
  leads: Pick<Lead, "priority" | "sort_order">[],
  priority: LeadPriority,
): number {
  const max = leads
    .filter((l) => l.priority === priority)
    .reduce((m, l) => Math.max(m, l.sort_order), 0);
  return max + 10;
}

export async function createLead(
  input: NewLeadInput,
  existingLeads: Pick<Lead, "priority" | "sort_order">[] = [],
): Promise<Lead> {
  const { note, ...rest } = input;
  const priority = rest.priority ?? "Medium";
  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .insert({
      name: rest.owner_name,
      owner_name: rest.owner_name,
      business_name: rest.business_name,
      phone: rest.phone,
      whatsapp_number: rest.whatsapp_number || null,
      email: rest.email || "",
      industry: rest.business_category,
      business_category: rest.business_category,
      city: rest.city || null,
      address: rest.address || null,
      website_url: rest.website_url || null,
      instagram_url: rest.instagram_url || null,
      google_maps_url: rest.google_maps_url || null,
      facebook_url: rest.facebook_url || null,
      budget: "",
      source: rest.source ?? "Cold Call",
      status: "New",
      priority,
      sort_order: nextSortOrder(existingLeads, priority),
      message: null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  const created = normaliseLead(data as Record<string, unknown>);

  if (note && note.trim()) {
    await addTimelineEvent("lead", created.id, "note", "Note", note.trim());
  }
  return created;
}

/**
 * Persists a new manual order for every lead within a single priority
 * column (used after a drag-and-drop reorder, or an up/down nudge).
 * Re-numbers sequentially (10, 20, 30...) rather than trying to compute a
 * single fractional position, which keeps the scheme simple and readable
 * for the lead counts a small studio actually deals with.
 */
export async function reorderLeads(orderedIds: string[]): Promise<void> {
  const updates = reindex(orderedIds);
  const results = await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase.from(LEADS_TABLE).update({ sort_order }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
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
