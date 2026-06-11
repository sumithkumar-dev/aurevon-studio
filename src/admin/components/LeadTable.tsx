import { Trash2 } from "lucide-react";
import type { Lead, LeadPatch } from "../types";
import { formatDate } from "../utils";
import {
  PriorityBadge,
  PrioritySelect,
  SourceBadge,
  StatusBadge,
  StatusSelect,
} from "./badges";

export function LeadTable({
  leads,
  onSelect,
  onPatch,
  onDelete,
}: {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onPatch: (id: string, patch: LeadPatch) => void;
  onDelete: (lead: Lead) => void;
}) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1040px] text-sm">
          <thead className="bg-secondary/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Budget</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-t border-border/80 hover:bg-secondary/25 cursor-pointer transition-colors"
                onClick={() => onSelect(lead)}
              >
                <td className="px-4 py-4">
                  <div className="font-medium text-foreground">{lead.name}</div>
                  <div className="mt-1 line-clamp-1 max-w-[210px] text-xs text-muted-foreground">
                    {lead.message?.trim() || "No message provided"}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium text-foreground">
                    {lead.business_name}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {lead.industry}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <SourceBadge source={lead.source} />
                </td>
                <td className="px-4 py-4">
                  <StatusSelect
                    value={lead.status}
                    onChange={(status) => onPatch(lead.id, { status })}
                  />
                </td>
                <td className="px-4 py-4">
                  <PrioritySelect
                    value={lead.priority}
                    onChange={(priority) => onPatch(lead.id, { priority })}
                  />
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  <a
                    href={`mailto:${lead.email}`}
                    className="block max-w-[220px] truncate hover:text-accent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {lead.email}
                  </a>
                  <a
                    href={`tel:${lead.phone}`}
                    className="mt-1 block text-xs hover:text-accent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {lead.phone}
                  </a>
                </td>
                <td className="px-4 py-4 text-accent">
                  {lead.final_budget || lead.budget}
                </td>
                <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                  {formatDate(lead.created_at)}
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(lead);
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

      {/* Mobile cards */}
      <div className="divide-y divide-border md:hidden">
        {leads.map((lead) => (
          <button
            key={lead.id}
            onClick={() => onSelect(lead)}
            className="block w-full p-4 text-left hover:bg-secondary/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">
                  {lead.business_name}
                </div>
                <div className="mt-1 truncate text-sm text-muted-foreground">
                  {lead.name}
                </div>
              </div>
              <PriorityBadge priority={lead.priority} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={lead.status} />
              <SourceBadge source={lead.source} />
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                {lead.final_budget || lead.budget}
              </span>
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                {formatDate(lead.created_at)}
              </span>
            </div>
            <div className="mt-3 line-clamp-2 text-sm text-muted-foreground">
              {lead.message?.trim() || "No message provided"}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
