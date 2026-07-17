import { AlertTriangle, Trash2 } from "lucide-react";
import type { Client, ProjectStatus } from "../types";
import { formatDate, isOverdue, isUpcoming, projectStatusClasses } from "../utils";
import { PROJECT_STATUS_OPTIONS } from "../constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProjectStatusSelect({
  value,
  onChange,
}: {
  value: ProjectStatus;
  onChange: (s: ProjectStatus) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ProjectStatus)}>
      <SelectTrigger
        onClick={(e) => e.stopPropagation()}
        className={`h-auto w-auto gap-1 rounded-full border px-3 py-1.5 text-xs font-medium shadow-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-0 ${projectStatusClasses(value)}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROJECT_STATUS_OPTIONS.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${projectStatusClasses(status)}`}
    >
      {status}
    </span>
  );
}

/** Soonest of domain/hosting expiry — or null if nothing's expiring soon. */
function nextRenewal(c: Client): { label: string; date: string; overdue: boolean } | null {
  const candidates: { label: string; date: string }[] = [];
  if (c.domain_expiry) candidates.push({ label: "Domain", date: c.domain_expiry });
  if (c.hosting_expiry) candidates.push({ label: "Hosting", date: c.hosting_expiry });
  const soon = candidates
    .filter((r) => isOverdue(r.date) || isUpcoming(r.date, 30))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!soon) return null;
  return { ...soon, overdue: isOverdue(soon.date) };
}

function RenewalCell({ client }: { client: Client }) {
  const renewal = nextRenewal(client);
  if (!renewal) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
        renewal.overdue
          ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
          : "border-amber-400/30 bg-amber-400/10 text-amber-200"
      }`}
    >
      <AlertTriangle size={11} />
      {renewal.label} · {formatDate(renewal.date)}
    </span>
  );
}

export function ClientsTable({
  clients,
  onSelect,
  onPatchStatus,
  onDelete,
}: {
  clients: Client[];
  onSelect: (c: Client) => void;
  onPatchStatus: (id: string, status: ProjectStatus) => void;
  onDelete: (c: Client) => void;
}) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-secondary/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Final Budget</th>
              <th className="px-4 py-3 font-medium">Project Status</th>
              <th className="px-4 py-3 font-medium">Renewals</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                className="border-t border-border/80 hover:bg-secondary/25 cursor-pointer transition-colors"
                onClick={() => onSelect(c)}
              >
                <td className="px-4 py-4">
                  <div className="font-medium text-foreground">{c.client_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{c.email}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium text-foreground">{c.business_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{c.industry}</div>
                </td>
                <td className="px-4 py-4 text-accent">
                  {c.final_budget || (c.final_price != null ? `₹${c.final_price}` : "—")}
                </td>
                <td className="px-4 py-4">
                  <ProjectStatusSelect
                    value={c.project_status}
                    onChange={(s) => onPatchStatus(c.id, s)}
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <RenewalCell client={c} />
                </td>
                <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                  {formatDate(c.created_at)}
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c);
                    }}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="divide-y divide-border md:hidden">
        {clients.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className="block w-full p-4 text-left hover:bg-secondary/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-foreground">{c.client_name}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {c.business_name}
                </div>
              </div>
              <ProjectStatusBadge status={c.project_status} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-accent">
                {c.final_budget || (c.final_price != null ? `₹${c.final_price}` : "—")}
              </span>
              <span className="text-muted-foreground">{formatDate(c.created_at)}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
