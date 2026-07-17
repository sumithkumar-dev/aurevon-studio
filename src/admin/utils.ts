import type {
  LeadPriority,
  LeadSource,
  LeadStatus,
  ProjectStatus,
} from "./types";

export function isWithinDays(date: string, days: number) {
  return Date.now() - new Date(date).getTime() < days * 864e5;
}

/**
 * Builds a CSV file from a list of records and triggers a browser download.
 * Used for both the Leads and Clients export buttons in Dashboard.tsx, which
 * used to each hand-roll an identical copy of this logic — only the
 * `headers` list and filename differed.
 */
export function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  headers: string[],
  filenamePrefix: string,
) {
  const csvRows = rows.map((row) =>
    headers
      .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toDateInputValue(date: string | null): string {
  if (!date) return "";
  return date.slice(0, 10);
}

/** Midnight-aligned day difference: negative = past, 0 = today, positive = future. */
function dayDiff(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr.slice(0, 10) + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 864e5);
}

export function isOverdue(date: string | null): boolean {
  if (!date) return false;
  return dayDiff(date) < 0;
}

export function isToday(date: string | null): boolean {
  if (!date) return false;
  return dayDiff(date) === 0;
}

export function isUpcoming(date: string | null, withinDays = 7): boolean {
  if (!date) return false;
  const d = dayDiff(date);
  return d > 0 && d <= withinDays;
}

/** Human label for a due/follow-up date relative to today. */
export function relativeDayLabel(date: string): string {
  const d = dayDiff(date);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d < 0) return `${Math.abs(d)}d overdue`;
  return `in ${d}d`;
}

export function statusClasses(status: LeadStatus) {
  switch (status) {
    case "New":
      return "border-sky-400/30 bg-sky-400/10 text-sky-200";
    case "Researching":
      return "border-border bg-secondary/60 text-muted-foreground";
    case "Ready to Call":
      return "border-indigo-400/30 bg-indigo-400/10 text-indigo-200";
    case "Called":
      return "border-violet-400/30 bg-violet-400/10 text-violet-200";
    case "Interested":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
    case "Demo Sent":
      return "border-blue-400/30 bg-blue-400/10 text-blue-200";
    case "Meeting Scheduled":
      return "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200";
    case "Proposal Sent":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    case "Negotiating":
      return "border-orange-400/30 bg-orange-400/10 text-orange-200";
    case "Won":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "Lost":
      return "border-rose-400/30 bg-rose-400/10 text-rose-200";
    case "Follow Up Later":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-200";
    default:
      return "border-border bg-secondary/40 text-muted-foreground";
  }
}

export function priorityClasses(priority: LeadPriority) {
  switch (priority) {
    case "High":
      return "border-rose-400/30 bg-rose-400/10 text-rose-200";
    case "Medium":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    case "Low":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    default:
      return "border-border bg-secondary/40 text-muted-foreground";
  }
}

export function sourceClasses(_source: LeadSource) {
  return "border-border bg-secondary/40 text-muted-foreground";
}

export function projectStatusClasses(status: ProjectStatus) {
  switch (status) {
    case "Advance Pending":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    case "Advance Paid":
      return "border-sky-400/30 bg-sky-400/10 text-sky-200";
    case "In Progress":
      return "border-violet-400/30 bg-violet-400/10 text-violet-200";
    case "Review":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
    case "Delivered":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "Closed":
      return "border-border bg-secondary/40 text-muted-foreground";
    case "Cancelled":
      return "border-rose-400/30 bg-rose-400/10 text-rose-200";
    default:
      return "border-border bg-secondary/40 text-muted-foreground";
  }
}

export function paymentStatusClasses(
  status: import("./types").PaymentStatus,
) {
  switch (status) {
    case "Not Started":
      return "border-border bg-secondary/40 text-muted-foreground";
    case "Advance Paid":
      return "border-sky-400/30 bg-sky-400/10 text-sky-200";
    case "Partially Paid":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    case "Fully Paid":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "Refunded":
      return "border-rose-400/30 bg-rose-400/10 text-rose-200";
    default:
      return "border-border bg-secondary/40 text-muted-foreground";
  }
}

/**
 * Recomputes sequential sort_order values (10, 20, 30...) for an ordered
 * list of ids. Used after a drag-and-drop reorder or an up/down nudge —
 * simple re-numbering keeps the scheme easy to reason about for the small
 * number of leads a two-person studio manages at once.
 */
export function reindex(ids: string[]): { id: string; sort_order: number }[] {
  return ids.map((id, i) => ({ id, sort_order: (i + 1) * 10 }));
}
