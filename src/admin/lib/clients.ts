import { supabase } from "@/integrations/supabase/client";
import type {
  Client,
  ClientNote,
  ClientPatch,
  Lead,
  NewClientInput,
  PaymentStatus,
} from "../types";

const CLIENTS_TABLE = "clients";
const NOTES_TABLE = "client_notes";

function normalise(row: Record<string, unknown>): Client {
  return {
    id: String(row.id),
    lead_id: (row.lead_id as string | null) ?? null,
    client_name: (row.client_name as string) ?? "",
    business_name: (row.business_name as string) ?? "",
    phone: (row.phone as string) ?? "",
    email: (row.email as string) ?? "",
    industry: (row.industry as string) ?? "",
    source: ((row.source as Client["source"]) ?? "Website") as Client["source"],
    final_budget: (row.final_budget as string | null) ?? null,
    quoted_price:
      row.quoted_price == null ? null : Number(row.quoted_price),
    final_price: row.final_price == null ? null : Number(row.final_price),
    advance_paid: Number(row.advance_paid ?? 0),
    remaining_amount: Number(row.remaining_amount ?? 0),
    project_status: ((row.project_status as Client["project_status"]) ??
      "Advance Pending") as Client["project_status"],
    created_at: (row.created_at as string) ?? new Date().toISOString(),
    updated_at: (row.updated_at as string) ?? new Date().toISOString(),

    // Project Details
    project_name: (row.project_name as string | null) ?? null,
    project_type: (row.project_type as string | null) ?? null,
    project_description: (row.project_description as string | null) ?? null,
    scope_of_work: (row.scope_of_work as string | null) ?? null,
    timeline: (row.timeline as string | null) ?? null,
    delivery_date: (row.delivery_date as string | null) ?? null,

    // Business Details
    owner_name: (row.owner_name as string | null) ?? null,
    business_address: (row.business_address as string | null) ?? null,
    gst_number: (row.gst_number as string | null) ?? null,
    business_website: (row.business_website as string | null) ?? null,
    business_email: (row.business_email as string | null) ?? null,

    // Billing Details
    advance_amount:
      row.advance_amount == null ? null : Number(row.advance_amount),
    payment_status: ((row.payment_status as PaymentStatus) ??
      "Not Started") as PaymentStatus,

    // Agreement Details
    agreement_date: (row.agreement_date as string | null) ?? null,
    project_start_date: (row.project_start_date as string | null) ?? null,
    project_end_date: (row.project_end_date as string | null) ?? null,
    revision_count: Number(row.revision_count ?? 0),
    terms_notes: (row.terms_notes as string | null) ?? null,

    // Document Contact Details
    primary_contact_name: (row.primary_contact_name as string | null) ?? null,
    primary_contact_phone: (row.primary_contact_phone as string | null) ?? null,
    primary_contact_email: (row.primary_contact_email as string | null) ?? null,
  };
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from(CLIENTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => normalise(r as Record<string, unknown>));
}

export async function createClient(input: NewClientInput): Promise<Client> {
  const { data, error } = await supabase
    .from(CLIENTS_TABLE)
    .insert({
      lead_id: input.lead_id,
      client_name: input.client_name,
      business_name: input.business_name,
      phone: input.phone,
      email: input.email,
      industry: input.industry,
      source: input.source,
      final_budget: input.final_budget,
      quoted_price: input.quoted_price,
      final_price: input.final_price,
      advance_paid: input.advance_paid,
      project_status: input.project_status,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalise(data as Record<string, unknown>);
}

export async function convertLeadToClient(lead: Lead): Promise<Client> {
  const { data: existing } = await supabase
    .from(CLIENTS_TABLE)
    .select("*")
    .eq("lead_id", lead.id)
    .maybeSingle();
  if (existing) return normalise(existing as Record<string, unknown>);

  return createClient({
    lead_id: lead.id,
    client_name: lead.name,
    business_name: lead.business_name,
    phone: lead.phone,
    email: lead.email,
    industry: lead.industry,
    source: lead.source,
    final_budget: lead.final_budget ?? lead.budget ?? null,
    quoted_price: null,
    final_price: null,
    advance_paid: 0,
    project_status: "Advance Pending",
  });
}

export async function updateClient(
  id: string,
  patch: ClientPatch,
): Promise<void> {
  const { error } = await supabase
    .from(CLIENTS_TABLE)
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteClient(id: string): Promise<void> {
  await supabase.from(NOTES_TABLE).delete().eq("client_id", id);
  const { error } = await supabase.from(CLIENTS_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function fetchClientNotes(clientId: string): Promise<ClientNote[]> {
  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientNote[];
}

export async function addClientNote(
  clientId: string,
  content: string,
): Promise<ClientNote> {
  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .insert({ client_id: clientId, note: content })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ClientNote;
}

export async function deleteClientNote(id: string): Promise<void> {
  const { error } = await supabase.from(NOTES_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
