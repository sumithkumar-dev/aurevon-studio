import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  addTimelineEvent,
  deleteTimelineEvent,
  fetchTimeline,
} from "../lib/timeline";
import { TIMELINE_EVENT_TYPE_LABELS } from "../constants";
import type { TimelineEntityType, TimelineEvent, TimelineEventType } from "../types";
import { formatDateLong, formatDateTime } from "../utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function dateKey(iso: string) {
  return iso.slice(0, 10);
}

function eventDotClass(type: TimelineEventType) {
  switch (type) {
    case "call":
    case "whatsapp":
    case "email":
    case "meeting":
      return "bg-sky-400";
    case "demo_sent":
    case "proposal_sent":
      return "bg-amber-400";
    case "follow_up":
      return "bg-violet-400";
    case "website_delivered":
    case "payment_received":
    case "converted":
      return "bg-emerald-400";
    case "bug_fix":
      return "bg-rose-400";
    case "feature_request":
    case "event_update":
      return "bg-cyan-400";
    case "task_completed":
      return "bg-emerald-400";
    case "status_change":
    case "priority_change":
      return "bg-muted-foreground";
    default:
      return "bg-muted-foreground";
  }
}

export function Timeline({
  entityType,
  entityId,
  eventTypeOptions,
  title = "Timeline",
  emptyLabel = "No history yet — log a call or update to start the timeline.",
}: {
  entityType: TimelineEntityType;
  entityId: string;
  eventTypeOptions: string[];
  title?: string;
  emptyLabel?: string;
}) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventType, setEventType] = useState<string>(eventTypeOptions[0] ?? "note");
  const [body, setBody] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchTimeline(entityType, entityId)
      .then((data) => active && setEvents(data))
      .catch(() => active && setEvents([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [entityType, entityId]);

  async function handleAdd() {
    if (saving) return;
    const label = TIMELINE_EVENT_TYPE_LABELS[eventType] ?? "Update";
    setSaving(true);
    try {
      const created = await addTimelineEvent(
        entityType,
        entityId,
        eventType as TimelineEventType,
        label,
        body,
      );
      setEvents((prev) => [created, ...prev]);
      setBody("");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const prev = events;
    setEvents((e) => e.filter((x) => x.id !== id));
    try {
      await deleteTimelineEvent(id);
    } catch {
      setEvents(prev);
    }
  }

  // Group events by day, most recent day first (events are already sorted
  // newest-first by fetchTimeline).
  const groups: { key: string; events: TimelineEvent[] }[] = [];
  for (const ev of events) {
    const key = dateKey(ev.created_at);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.events.push(ev);
    else groups.push({ key, events: [ev] });
  }

  return (
    <div className="rounded-2xl border border-border bg-background/35 p-5">
      {title && (
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {title}
        </div>
      )}

      {/* Quick log */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="h-auto w-full shrink-0 rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-none sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {eventTypeOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {TIMELINE_EVENT_TYPE_LABELS[t] ?? t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="What happened? e.g. Owner busy, call back after 5pm"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-glow transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Log
        </button>
      </div>

      {/* Timeline entries */}
      <div className="mt-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Loading timeline...
          </div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.key}>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
                  {formatDateLong(group.events[0].created_at)}
                </div>
                <div className="space-y-2 border-l border-border pl-4">
                  {group.events.map((ev) => (
                    <div key={ev.id} className="group relative">
                      <span
                        className={`absolute -left-[21px] top-1.5 size-2 rounded-full ${eventDotClass(ev.event_type)}`}
                      />
                      <div className="rounded-xl border border-border bg-secondary/20 p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="font-medium text-foreground">
                              {ev.title}
                            </span>
                            {ev.body ? (
                              <p className="mt-0.5 whitespace-pre-wrap break-words text-muted-foreground">
                                {ev.body}
                              </p>
                            ) : null}
                          </div>
                          <button
                            onClick={() => handleDelete(ev.id)}
                            className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                            aria-label="Delete entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="mt-1.5 text-[11px] text-muted-foreground/80">
                          {formatDateTime(ev.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
