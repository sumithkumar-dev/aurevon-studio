import { Search } from "lucide-react";
import { PROJECT_STATUS_OPTIONS } from "../constants";
import type { ProjectStatus } from "../types";

export type ClientFiltersState = {
  q: string;
  project_status: ProjectStatus | "All";
};

export const EMPTY_CLIENT_FILTERS: ClientFiltersState = {
  q: "",
  project_status: "All",
};

const selectClass =
  "w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent/60 transition-colors";

export function ClientFilters({
  filters,
  onChange,
}: {
  filters: ClientFiltersState;
  onChange: (next: ClientFiltersState) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
      <div className="relative min-w-0">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search client, business, phone, email..."
          className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 transition-colors"
        />
      </div>

      <select
        value={filters.project_status}
        onChange={(e) =>
          onChange({
            ...filters,
            project_status: e.target.value as ClientFiltersState["project_status"],
          })
        }
        className={selectClass}
      >
        <option value="All">All project statuses</option>
        {PROJECT_STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
