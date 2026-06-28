import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarClock,
  Loader2,
  Mail,
  Phone,
  Send,
  Tag,
  Trash2,
  User,
  UserCheck,
  X,
} from "lucide-react";
import type { Client, Lead, LeadPatch } from "../types";
import { formatDateTime, toDateInputValue } from "../utils";
import {
  PriorityBadge,
  PrioritySelect,
  SourceBadge,
  SourceSelect,
  StatusBadge,
  StatusSelect,
} from "./badges";
import { ControlPanel, InfoTile } from "./tiles";
import { NotesSection } from "./NotesSection";

export function LeadDrawer({
  lead,
  onClose,
  onDelete,
  onPatch,
  onConvert,
}: {
  lead: Lead;
  onClose: () => void;
  onDelete: () => void;
  onPatch: (patch: LeadPatch) => void;
  onConvert?: () => Promise<Client>;
}) {
  const [finalBudget, setFinalBudget] = useState(lead.final_budget ?? "");
  const [name, setName] = useState(lead.name ?? "");
  const [businessName, setBusinessName] = useState(lead.business_name ?? "");
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [industry, setIndustry] = useState(lead.industry ?? "");
  const [budget, setBudget] = useState(lead.budget ?? "");
  const [converting, setConverting] = useState(false);
  const [convertMsg, setConvertMsg] = useState<string | null>(null);

  async function handleConvert() {
    if (!onConvert || converting) return;
    setConverting(true);
    setConvertMsg(null);
    try {
      await onConvert();
      setConvertMsg("Converted to client.");
    } catch (err) {
      setConvertMsg(
        err instanceof Error ? err.message : "Failed to convert lead.",
      );
    } finally {
      setConverting(false);
    }
  }

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
                <StatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
                <SourceBadge source={lead.source} />
              </div>
              <h2 className="mt-4 text-2xl md:text-3xl text-foreground break-words">
                {lead.business_name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {lead.industry}
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>

          {/* CRM CONTROLS */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ControlPanel label="Status">
              <StatusSelect
                value={lead.status}
                onChange={(status) => onPatch({ status })}
              />
            </ControlPanel>
            <ControlPanel label="Priority">
              <PrioritySelect
                value={lead.priority}
                onChange={(priority) => onPatch({ priority })}
              />
            </ControlPanel>
            <ControlPanel label="Source">
              <SourceSelect
                value={lead.source}
                onChange={(source) => onPatch({ source })}
              />
            </ControlPanel>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ControlPanel label="Final budget">
              <input
                value={finalBudget}
                onChange={(e) => setFinalBudget(e.target.value)}
                onBlur={() =>
                  onPatch({ final_budget: finalBudget.trim() || null })
                }
                placeholder="e.g. ₹45,000"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
              />
            </ControlPanel>
            <ControlPanel label="Follow up date">
              <input
                type="date"
                value={toDateInputValue(lead.follow_up_date)}
                onChange={(e) =>
                  onPatch({ follow_up_date: e.target.value || null })
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/60"
              />
            </ControlPanel>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          {/* CONTACT INFORMATION */}
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Contact information
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ControlPanel label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => onPatch({ name: name.trim() || lead.name })}
                placeholder="Contact name"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
              />
            </ControlPanel>
            <InfoTile
              Icon={CalendarClock}
              label="Added"
              value={formatDateTime(lead.created_at)}
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ControlPanel label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => onPatch({ email: email.trim() || lead.email })}
                placeholder="email@example.com"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
              />
            </ControlPanel>
            <ControlPanel label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => onPatch({ phone: phone.trim() || lead.phone })}
                placeholder="+91 99999 00000"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
              />
            </ControlPanel>
          </div>

          {/* BUSINESS INFORMATION */}
          <div className="mt-6 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Business information
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ControlPanel label="Business name">
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onBlur={() =>
                  onPatch({
                    business_name: businessName.trim() || lead.business_name,
                  })
                }
                placeholder="Business name"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
              />
            </ControlPanel>
            <ControlPanel label="Industry">
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                onBlur={() =>
                  onPatch({ industry: industry.trim() || lead.industry })
                }
                placeholder="e.g. Restaurant, Real Estate"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
              />
            </ControlPanel>
            <ControlPanel label="Quoted budget">
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                onBlur={() =>
                  onPatch({ budget: budget.trim() || lead.budget })
                }
                placeholder="e.g. ₹30,000"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
              />
            </ControlPanel>
            <InfoTile
              Icon={Tag}
              label="Final budget"
              value={lead.final_budget || "—"}
            />
          </div>

          {/* MESSAGE */}
          <div className="mt-6 rounded-2xl border border-border bg-background/35 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Message
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
              {lead.message?.trim() || "No message provided."}
            </p>
          </div>

          {/* NOTES */}
          <NotesSection leadId={lead.id} />
        </div>

        {/* FOOTER */}
        <div className="border-t border-border p-4 md:p-5 space-y-2">
          {convertMsg && (
            <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
              {convertMsg}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <a
              href={`mailto:${lead.email}?subject=Re: Your inquiry`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-3 text-sm font-medium hover:bg-accent-glow transition-colors"
            >
              <Send size={14} /> Reply
            </a>
            {onConvert && (
              <button
                onClick={handleConvert}
                disabled={converting}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/40 px-5 py-3 text-sm text-accent hover:bg-accent/10 transition-colors disabled:opacity-60"
              >
                {converting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UserCheck size={14} />
                )}
                Convert To Client
              </button>
            )}
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
