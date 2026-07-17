import { supabase } from "@/integrations/supabase/client";
import type {
  TimelineEntityType,
  TimelineEvent,
  TimelineEventType,
} from "../types";

const TABLE = "timeline_events";

function normalise(row: Record<string, unknown>): TimelineEvent {
  return {
    id: String(row.id),
    entity_type: row.entity_type as TimelineEntityType,
    entity_id: String(row.entity_id),
    event_type: row.event_type as TimelineEventType,
    title: (row.title as string) ?? "",
    body: (row.body as string | null) ?? null,
    created_at: (row.created_at as string) ?? new Date().toISOString(),
  };
}

export async function fetchTimeline(
  entityType: TimelineEntityType,
  entityId: string,
): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalise(row as Record<string, unknown>));
}

export async function addTimelineEvent(
  entityType: TimelineEntityType,
  entityId: string,
  eventType: TimelineEventType,
  title: string,
  body?: string | null,
): Promise<TimelineEvent> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      event_type: eventType,
      title,
      body: body?.trim() || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalise(data as Record<string, unknown>);
}

export async function deleteTimelineEvent(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Count of "call" events logged (on any lead or client) since midnight
 * today — powers the dashboard's "Today's Calls" tile. */
export async function fetchTodayCallCount(): Promise<number> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("event_type", "call")
    .gte("created_at", startOfToday.toISOString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}
