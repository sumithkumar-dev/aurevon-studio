import { supabase } from "@/integrations/supabase/client";
import { DOCUMENT_TYPES } from "../constants";
import type { ClientDocument, DocumentType, InvoiceSubtype } from "../types";

const DOCS_TABLE = "client_documents";

export function normalise(row: Record<string, unknown>): ClientDocument {
  const docType = row.doc_type as DocumentType;
  // invoice_subtype is stored as "unified" in the DB for non-Invoice rows
  // (so a single, non-partial unique index can cover every doc type — see
  // upsertDocument below). That's a storage detail only: the rest of the
  // app should keep seeing null for anything that isn't an Invoice.
  const rawSubtype = (row.invoice_subtype as InvoiceSubtype | null) ?? null;
  return {
    id: String(row.id),
    client_id: String(row.client_id),
    doc_type: docType,
    invoice_subtype: docType === "Invoice" ? rawSubtype : null,
    status:
      (row.status as ClientDocument["status"]) === "Generated"
        ? "Generated"
        : "Not Generated",
    generated_at: (row.generated_at as string | null) ?? null,
    file_url: (row.file_url as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: (row.created_at as string) ?? new Date().toISOString(),
    updated_at: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

/**
 * Returns entries for each document type for the given client.
 * For Invoice, returns separate advance + final placeholders.
 * Non-existent rows return "Not Generated" placeholders.
 */
export async function fetchClientDocuments(
  clientId: string,
): Promise<ClientDocument[]> {
  const { data, error } = await supabase
    .from(DOCS_TABLE)
    .select("*")
    .eq("client_id", clientId);
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((r) => normalise(r as Record<string, unknown>));
  const now = new Date().toISOString();

  const result: ClientDocument[] = [];

  for (const t of DOCUMENT_TYPES) {
    if (t === "Invoice") {
      // Return advance and final invoice entries separately
      const advance = rows.find((r) => r.doc_type === "Invoice" && r.invoice_subtype === "advance");
      const final = rows.find((r) => r.doc_type === "Invoice" && r.invoice_subtype === "final");
      result.push(advance ?? {
        id: `placeholder-${clientId}-Invoice-advance`,
        client_id: clientId,
        doc_type: "Invoice",
        invoice_subtype: "advance",
        status: "Not Generated",
        generated_at: null,
        file_url: null,
        metadata: {},
        created_at: now,
        updated_at: now,
      });
      result.push(final ?? {
        id: `placeholder-${clientId}-Invoice-final`,
        client_id: clientId,
        doc_type: "Invoice",
        invoice_subtype: "final",
        status: "Not Generated",
        generated_at: null,
        file_url: null,
        metadata: {},
        created_at: now,
        updated_at: now,
      });
    } else {
      const found = rows.find((r) => r.doc_type === t);
      result.push(found ?? {
        id: `placeholder-${clientId}-${t}`,
        client_id: clientId,
        doc_type: t,
        invoice_subtype: null,
        status: "Not Generated",
        generated_at: null,
        file_url: null,
        metadata: {},
        created_at: now,
        updated_at: now,
      });
    }
  }

  return result;
}

/**
 * Upsert a document record. For invoices, invoice_subtype is required
 * to correctly target the advance vs final row.
 */
export async function upsertDocument(
  clientId: string,
  docType: DocumentType,
  generatedAt: string,
  metadata: Record<string, unknown> = {},
  invoiceSubtype?: InvoiceSubtype,
): Promise<ClientDocument> {
  // invoice_subtype is always set, even for non-Invoice docs ("unified").
  // The unique index that backs this upsert is a single, non-partial
  // index on (client_id, doc_type, invoice_subtype) — partial indexes
  // can't be used as an ON CONFLICT target unless the conflict clause
  // repeats the index's WHERE predicate, which supabase-js has no way
  // to express. Using one sentinel value for every doc type sidesteps
  // that limitation entirely. See migration 20260617.
  const upsertPayload: Record<string, unknown> = {
    client_id: clientId,
    doc_type: docType,
    invoice_subtype: docType === "Invoice" && invoiceSubtype ? invoiceSubtype : "unified",
    status: "Generated",
    generated_at: generatedAt,
    file_url: null,
    metadata,
  };

  const { data, error } = await supabase
    .from(DOCS_TABLE)
    .upsert(upsertPayload, { onConflict: "client_id,doc_type,invoice_subtype" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalise(data as Record<string, unknown>);
}
