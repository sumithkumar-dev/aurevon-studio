import { useEffect, useMemo, useState } from "react";
import { Reorder } from "framer-motion";
import {
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  GripVertical,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { PRIORITY_OPTIONS } from "../constants";
import type { Lead, LeadPatch, LeadPriority } from "../types";
import {
  formatDateTime,
  isOverdue,
  isToday,
  priorityClasses,
  relativeDayLabel,
} from "../utils";
import { StatusSelect } from "./badges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLUMNS: { priority: LeadPriority; hint: string }[] = [
  { priority: "High", hint: "Call these first" },
  { priority: "Medium", hint: "Work through today" },
  { priority: "Low", hint: "When there's time" },
];

function useColumnOrder(leads: Lead[], priority: LeadPriority) {
  const columnLeads = useMemo(
    () =>
      leads
        .filter((l) => l.priority === priority)
        .sort((a, b) => a.sort_order - b.sort_order),
    [leads, priority],
  );
  const idSignature = useMemo(
    () => columnLeads.map((l) => l.id).sort().join(","),
    [columnLeads],
  );
  const [order, setOrder] = useState<string[]>(() => columnLeads.map((l) => l.id));
  useEffect(() => {
    setOrder(columnLeads.map((l) => l.id));
    // Re-sync only when the *set* of leads in this column changes (added,
    // removed, or moved in from another priority). Pure re-ordering within
    // the column is driven locally and already reflected in `order`, so it
    // must not be clobbered by this effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSignature]);
  return [order, setOrder] as const;
}

export function LeadBoard({
  leads,
  onSelect,
  onPatch,
  onReorderCommit,
  onChangePriority,
}: {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onPatch: (id: string, patch: LeadPatch) => void;
  onReorderCommit: (orderedIds: string[]) => void;
  onChangePriority: (id: string, priority: LeadPriority) => void;
}) {
  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {COLUMNS.map(({ priority, hint }) => (
        <BoardColumn
          key={priority}
          priority={priority}
          hint={hint}
          leads={leads}
          leadById={leadById}
          onSelect={onSelect}
          onPatch={onPatch}
          onReorderCommit={onReorderCommit}
          onChangePriority={onChangePriority}
        />
      ))}
    </div>
  );
}

function BoardColumn({
  priority,
  hint,
  leads,
  leadById,
  onSelect,
  onPatch,
  onReorderCommit,
  onChangePriority,
}: {
  priority: LeadPriority;
  hint: string;
  leads: Lead[];
  leadById: Map<string, Lead>;
  onSelect: (lead: Lead) => void;
  onPatch: (id: string, patch: LeadPatch) => void;
  onReorderCommit: (orderedIds: string[]) => void;
  onChangePriority: (id: string, priority: LeadPriority) => void;
}) {
  const [order, setOrder] = useColumnOrder(leads, priority);

  function moveBy(id: string, delta: number) {
    const idx = order.indexOf(id);
    if (idx === -1) return;
    const next = idx + delta;
    if (next < 0 || next >= order.length) return;
    const reordered = [...order];
    [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];
    setOrder(reordered);
    onReorderCommit(reordered);
  }

  const columnLeads = order
    .map((id) => leadById.get(id))
    .filter((l): l is Lead => Boolean(l));

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-border bg-card/30">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3.5">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${priorityClasses(priority)}`}
          >
            {priority} priority
          </span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          {columnLeads.length}
        </span>
      </div>

      <div className="min-h-[80px] flex-1 p-2.5">
        {columnLeads.length === 0 ? (
          <div className="grid h-24 place-items-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
            No leads here
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={order}
            onReorder={setOrder}
            className="space-y-2.5"
          >
            {columnLeads.map((lead, i) => (
              <Reorder.Item
                key={lead.id}
                value={lead.id}
                onDragEnd={() => onReorderCommit(order)}
                className="cursor-grab active:cursor-grabbing"
              >
                <LeadCard
                  lead={lead}
                  isFirst={i === 0}
                  isLast={i === columnLeads.length - 1}
                  onSelect={() => onSelect(lead)}
                  onPatch={(patch) => onPatch(lead.id, patch)}
                  onMoveUp={() => moveBy(lead.id, -1)}
                  onMoveDown={() => moveBy(lead.id, 1)}
                  onChangePriority={(p) => onChangePriority(lead.id, p)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  isFirst,
  isLast,
  onSelect,
  onPatch,
  onMoveUp,
  onMoveDown,
  onChangePriority,
}: {
  lead: Lead;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onPatch: (patch: LeadPatch) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChangePriority: (p: LeadPriority) => void;
}) {
  const followUp = lead.next_followup_date;
  const overdue = isOverdue(followUp);
  const dueToday = isToday(followUp);

  return (
    <div className="surface-card group p-3.5 cursor-pointer" onClick={onSelect}>
      <div className="flex items-start gap-2">
        <span className="mt-1 shrink-0 text-muted-foreground/50">
          <GripVertical size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">
                {lead.business_name || "Untitled business"}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <Building2 size={11} className="shrink-0" />
                <span className="truncate">
                  {lead.business_category || "—"}
                </span>
                {lead.city && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{lead.city}</span>
                  </>
                )}
              </div>
            </div>
            <div
              className="flex shrink-0 flex-col gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onMoveUp}
                disabled={isFirst}
                aria-label="Move up"
                className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-25"
              >
                <ChevronUp size={13} />
              </button>
              <button
                onClick={onMoveDown}
                disabled={isLast}
                aria-label="Move down"
                className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-25"
              >
                <ChevronDown size={13} />
              </button>
            </div>
          </div>

          <div
            className="mt-2.5 flex flex-wrap items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <StatusSelect
              value={lead.status}
              onChange={(status) => onPatch({ status })}
            />
            <Select value={lead.priority} onValueChange={(v) => onChangePriority(v as LeadPriority)}>
              <SelectTrigger className="h-auto w-auto gap-1 rounded-full border border-border bg-transparent px-2.5 py-1 text-xs text-muted-foreground shadow-none hover:bg-secondary">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    Move to {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 hover:text-accent"
              >
                <Phone size={11} /> {lead.phone}
              </a>
            )}
            {lead.whatsapp_number && (
              <a
                href={`https://wa.me/${lead.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 hover:text-accent"
              >
                <MessageCircle size={11} /> WhatsApp
              </a>
            )}
          </div>

          {followUp && (
            <div
              className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] ${
                overdue
                  ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
                  : dueToday
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                    : "border-border text-muted-foreground"
              }`}
            >
              <CalendarClock size={11} />
              Follow up {relativeDayLabel(followUp)} ({formatDateTime(followUp)})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
