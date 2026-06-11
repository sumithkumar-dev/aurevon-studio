import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarClock,
  IndianRupee,
  Mail,
  Phone,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { Client, ClientPatch } from "../types";
import { formatDateTime } from "../utils";
import { ControlPanel, ContactLink, InfoTile } from "./tiles";
import { ProjectStatusBadge, ProjectStatusSelect } from "./ClientsTable";
import { ClientNotesSection } from "./ClientNotesSection";

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60";

function toNum(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function ClientDrawer({
  client,
  onClose,
  onDelete,
  onPatch,
}: {
  client: Client;
  onClose: () => void;
  onDelete: () => void;
  onPatch: (patch: ClientPatch) => void;
}) {
  const [quoted, setQuoted] = useState(
    client.quoted_price == null ? "" : String(client.quoted_price),
  );
  const [finalPrice, setFinalPrice] = useState(
    client.final_price == null ? "" : String(client.final_price),
  );
  const [advance, setAdvance] = useState(String(client.advance_paid ?? 0));
  const [finalBudget, setFinalBudget] = useState(client.final_budget ?? "");

  useEffect(() => {
    setQuoted(client.quoted_price == null ? "" : String(client.quoted_price));
    setFinalPrice(client.final_price == null ? "" : String(client.final_price));
    setAdvance(String(client.advance_paid ?? 0));
    setFinalBudget(client.final_budget ?? "");
  }, [client.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const remaining =
    (Number(finalPrice) || 0) - (Number(advance) || 0);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

      <motion.aside
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-xl flex-col overflow-hidden bg-surface border-l border-border shadow-[0_0_80px_rgba(0,0,0,0.45)]"
      >
        {/* HEADER */}
        <div className="border-b border-border p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <ProjectStatusBadge status={client.project_status} />
              </div>
              <h2 className="mt-4 text-2xl md:text-3xl text-foreground break-words">
                {client.business_name || client.client_name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {client.industry || "—"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ControlPanel label="Project status">
              <ProjectStatusSelect
                value={client.project_status}
                onChange={(s) => onPatch({ project_status: s })}
              />
            </ControlPanel>
            <ControlPanel label="Final budget">
              <input
                value={finalBudget}
                onChange={(e) => setFinalBudget(e.target.value)}
                onBlur={() => onPatch({ final_budget: finalBudget.trim() || null })}
                placeholder="e.g. ₹45,000"
                className={fieldClass}
              />
            </ControlPanel>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          {/* Basic info */}
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Basic information
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoTile Icon={User} label="Client name" value={client.client_name} />
            <InfoTile
              Icon={CalendarClock}
              label="Added"
              value={formatDateTime(client.created_at)}
            />
            <InfoTile Icon={Building2} label="Business" value={client.business_name || "—"} />
            <InfoTile Icon={Tag} label="Source" value={client.source} />
          </div>
          <div className="mt-3 grid gap-3">
            {client.email && (
              <ContactLink
                Icon={Mail}
                href={`mailto:${client.email}`}
                label="Email"
                value={client.email}
              />
            )}
            {client.phone && (
              <ContactLink
                Icon={Phone}
                href={`tel:${client.phone}`}
                label="Phone"
                value={client.phone}
              />
            )}
          </div>

          {/* Project info */}
          <div className="mt-6 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Project information
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoTile Icon={Tag} label="Industry" value={client.industry || "—"} />
            <InfoTile
              Icon={IndianRupee}
              label="Final budget"
              value={client.final_budget || "—"}
            />
          </div>

          {/* Financials */}
          <div className="mt-6 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Financials
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ControlPanel label="Quoted price (₹)">
              <input
                inputMode="decimal"
                value={quoted}
                onChange={(e) => setQuoted(e.target.value)}
                onBlur={() => onPatch({ quoted_price: toNum(quoted) })}
                placeholder="0"
                className={fieldClass}
              />
            </ControlPanel>
            <ControlPanel label="Final price (₹)">
              <input
                inputMode="decimal"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                onBlur={() => onPatch({ final_price: toNum(finalPrice) })}
                placeholder="0"
                className={fieldClass}
              />
            </ControlPanel>
            <ControlPanel label="Advance paid (₹)">
              <input
                inputMode="decimal"
                value={advance}
                onChange={(e) => setAdvance(e.target.value)}
                onBlur={() => onPatch({ advance_paid: toNum(advance) ?? 0 })}
                placeholder="0"
                className={fieldClass}
              />
            </ControlPanel>
            <ControlPanel label="Remaining amount (₹)">
              <div className="rounded-xl border border-border bg-background/60 px-3 py-2 text-sm text-accent">
                {Number.isFinite(remaining) ? `₹${remaining.toLocaleString()}` : "—"}
              </div>
            </ControlPanel>
          </div>

          {/* Notes */}
          <ClientNotesSection clientId={client.id} />
        </div>

        {/* FOOTER */}
        <div className="border-t border-border p-4 md:p-5">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <a
              href={client.email ? `mailto:${client.email}` : "#"}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-3 text-sm font-medium hover:bg-accent-glow transition-colors"
            >
              <Mail size={14} /> Email client
            </a>
            <button
              onClick={onDelete}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
