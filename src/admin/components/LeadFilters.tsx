import { Search } from "lucide-react";
import {
  PRIORITY_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
} from "../constants";
import type { LeadPriority, LeadSource, LeadStatus } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const selectTriggerClass =
  "w-full h-auto bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground shadow-none focus:ring-2 focus:ring-ring/40";

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

      <Select
        value={filters.source}
        onValueChange={(v) =>
          onChange({ ...filters, source: v as Filters["source"] })
        }
      >
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All sources</SelectItem>
          {SOURCE_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(v) =>
          onChange({ ...filters, status: v as Filters["status"] })
        }
      >
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All statuses</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(v) =>
          onChange({ ...filters, priority: v as Filters["priority"] })
        }
      >
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All priorities</SelectItem>
          {PRIORITY_OPTIONS.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
