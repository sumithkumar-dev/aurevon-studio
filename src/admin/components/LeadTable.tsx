import { CalendarClock, MessageCircle, Phone, Trash2 } from "lucide-react";
import type { Lead, LeadPatch } from "../types";
import {
  formatDate,
  formatDateTime,
  isOverdue,
  isToday,
  relativeDayLabel,
} from "../utils";
import { PriorityBadge, PrioritySelect, StatusSelect } from "./badges";

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
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-secondary/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Next follow-up</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const followUp = lead.next_followup_date;
              const overdue = isOverdue(followUp);
              const dueToday = isToday(followUp);
              return (
                <tr
                  key={lead.id}
                  className="border-t border-border/80 hover:bg-secondary/25 cursor-pointer transition-colors"
                  onClick={() => onSelect(lead)}
                >
                  <td className="px-4 py-4">
                    <div className="font-medium text-foreground">
                      {lead.business_name || "Untitled business"}
                    </div>
                    <div className="mt-1 line-clamp-1 max-w-[200px] text-xs text-muted-foreground">
                      {lead.business_category || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-foreground">{lead.owner_name || "—"}</div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {lead.city || "—"}
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
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-1.5 hover:text-accent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone size={12} /> {lead.phone || "—"}
                    </a>
                    {lead.whatsapp_number && (
                      <a
                        href={`https://wa.me/${lead.whatsapp_number.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1.5 text-xs hover:text-accent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle size={11} /> WhatsApp
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {followUp ? (
                      <span
                        title={formatDateTime(followUp)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
                          overdue
                            ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
                            : dueToday
                              ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        <CalendarClock size={11} />
                        {relativeDayLabel(followUp)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
              );
            })}
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
                  {lead.business_name || "Untitled business"}
                </div>
                <div className="mt-1 truncate text-sm text-muted-foreground">
                  {lead.owner_name || "—"} {lead.city ? `· ${lead.city}` : ""}
                </div>
              </div>
              <PriorityBadge priority={lead.priority} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusSelect
                value={lead.status}
                onChange={(status) => onPatch(lead.id, { status })}
              />
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                {formatDate(lead.created_at)}
              </span>
            </div>
            <div className="mt-3 line-clamp-2 text-sm text-muted-foreground">
              {lead.business_category || "No category set"}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
