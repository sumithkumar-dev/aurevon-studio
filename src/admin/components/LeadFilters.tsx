import { Search } from "lucide-react";
import {
  PRIORITY_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
} from "../constants";
import type { LeadPriority, LeadSource, LeadStatus } from "../types";

export type Filters = {
  q: string;
  source: LeadSource | "All";
  status: LeadStatus | "All";
  priority: LeadPriority | "All";
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  source: "All",
  status: "All",
  priority: "All",
};

const selectClass =
  "w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent/60 transition-colors";

export function LeadFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
      <div className="relative min-w-0">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search name, email, business..."
          className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 transition-colors"
        />
      </div>

      <select
        value={filters.source}
        onChange={(e) =>
          onChange({ ...filters, source: e.target.value as Filters["source"] })
        }
        className={selectClass}
      >
        <option value="All">All sources</option>
        {SOURCE_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) =>
          onChange({ ...filters, status: e.target.value as Filters["status"] })
        }
        className={selectClass}
      >
        <option value="All">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(e) =>
          onChange({
            ...filters,
            priority: e.target.value as Filters["priority"],
          })
        }
        className={selectClass}
      >
        <option value="All">All priorities</option>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
}
