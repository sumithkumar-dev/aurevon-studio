import { supabase } from "@/integrations/supabase/client";
import { DOCUMENT_TYPES } from "../constants";
import type { ClientDocument, DocumentType } from "../types";

const DOCS_TABLE = "client_documents";

function normalise(row: Record<string, unknown>): ClientDocument {
  return {
    id: String(row.id),
    client_id: String(row.client_id),
    doc_type: row.doc_type as DocumentType,
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
 * Returns one entry per document type for the given client. If a row does not
 * yet exist in `client_documents`, returns a placeholder (Not Generated) entry
 * so the UI can render all four cards without writing to the DB.
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
  const byType = new Map(rows.map((r) => [r.doc_type, r]));
  const now = new Date().toISOString();
  return DOCUMENT_TYPES.map<ClientDocument>(
    (t) =>
      byType.get(t) ?? {
        id: `placeholder-${clientId}-${t}`,
        client_id: clientId,
        doc_type: t,
        status: "Not Generated",
        generated_at: null,
        file_url: null,
        metadata: {},
        created_at: now,
        updated_at: now,
      },
  );
}
