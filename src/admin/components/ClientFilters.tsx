import { Search } from "lucide-react";
import { PROJECT_STATUS_OPTIONS } from "../constants";
import type { ProjectStatus } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ClientFiltersState = {
  q: string;
  project_status: ProjectStatus | "All";
};

export const EMPTY_CLIENT_FILTERS: ClientFiltersState = {
  q: "",
  project_status: "All",
};

const selectTriggerClass =
  "w-full h-auto bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground shadow-none focus:ring-2 focus:ring-ring/40";

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

      <Select
        value={filters.project_status}
        onValueChange={(v) =>
          onChange({
            ...filters,
            project_status: v as ClientFiltersState["project_status"],
          })
        }
      >
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All project statuses</SelectItem>
          {PROJECT_STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
