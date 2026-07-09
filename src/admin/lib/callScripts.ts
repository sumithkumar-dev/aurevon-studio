import { supabase } from "@/integrations/supabase/client";
import type { CallScriptBlock } from "./workspace";

const CALL_SCRIPTS_TABLE = "call_scripts";

export type CallScript = {
  id: string;
  name: string;
  blocks: CallScriptBlock[];
  created_at: string;
  updated_at: string;
};

export type CallScriptPatch = Partial<Pick<CallScript, "name" | "blocks">>;

function normaliseCallScript(row: Record<string, unknown>): CallScript {
  return {
    id: String(row.id),
    name: (row.name as string) ?? "New Script",
    blocks: Array.isArray(row.blocks) ? (row.blocks as CallScriptBlock[]) : [],
    created_at: (row.created_at as string) ?? new Date().toISOString(),
    updated_at: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

export async function fetchCallScripts(): Promise<CallScript[]> {
  const { data, error } = await supabase
    .from(CALL_SCRIPTS_TABLE)
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    normaliseCallScript(row as Record<string, unknown>),
  );
}

export async function createCallScript(
  name = "New Script",
  blocks: CallScriptBlock[] = [],
): Promise<CallScript> {
  const { data, error } = await supabase
    .from(CALL_SCRIPTS_TABLE)
    .insert({ name, blocks })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return normaliseCallScript(data as Record<string, unknown>);
}

export async function updateCallScript(
  id: string,
  patch: CallScriptPatch,
): Promise<void> {
  const { error } = await supabase
    .from(CALL_SCRIPTS_TABLE)
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCallScript(id: string): Promise<void> {
  const { error } = await supabase
    .from(CALL_SCRIPTS_TABLE)
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
