import { supabase } from "@/integrations/supabase/client";
import type { TimelineEntityType, Task } from "../types";

const TABLE = "tasks";

function normalise(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    entity_type: row.entity_type as TimelineEntityType,
    entity_id: String(row.entity_id),
    title: (row.title as string) ?? "",
    due_date: (row.due_date as string | null) ?? null,
    is_done: Boolean(row.is_done),
    completed_at: (row.completed_at as string | null) ?? null,
    created_at: (row.created_at as string) ?? new Date().toISOString(),
  };
}

export async function fetchTasks(
  entityType: TimelineEntityType,
  entityId: string,
): Promise<Task[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("is_done", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalise(row as Record<string, unknown>));
}

/** All open (not-done) tasks across every lead and client — powers the
 * dashboard's Today / Overdue / Upcoming widgets. */
export async function fetchOpenTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("is_done", false)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalise(row as Record<string, unknown>));
}

export async function createTask(
  entityType: TimelineEntityType,
  entityId: string,
  title: string,
  dueDate?: string | null,
): Promise<Task> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      title,
      due_date: dueDate || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalise(data as Record<string, unknown>);
}

export async function toggleTask(id: string, isDone: boolean): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      is_done: isDone,
      completed_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateTaskDueDate(
  id: string,
  dueDate: string | null,
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ due_date: dueDate })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
