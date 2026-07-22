import { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import type { Client, Lead, LeadPatch } from "../types";
import {
  formatDateTime,
  fromDateTimeInputValue,
  toDateInputValue,
  toDateTimeInputValue,
} from "../utils";
import {
  BEST_TIME_TO_CALL_OPTIONS,
  LEAD_TIMELINE_EVENT_TYPES,
  PREFERRED_CONTACT_METHOD_OPTIONS,
} from "../constants";
import {
  PriorityBadge,
  PrioritySelect,
  SourceBadge,
  SourceSelect,
  StatusBadge,
  StatusSelect,
} from "./badges";
import { ControlPanel, InfoTile } from "./tiles";
import { Timeline } from "./Timeline";
import { TasksPanel } from "./TasksPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputClass =
  "w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60";
const textareaClass = inputClass + " min-h-[80px] resize-y leading-relaxed";
const labelClass =
  "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground";

function LinkField({
  label,
  value,
  onCommit,
  placeholder,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  placeholder: string;
}) {
  const [local, setLocal] = useState(value);
  return (
    <label className="block rounded-2xl border border-border bg-background/35 p-3">
      <span className={labelClass}>{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onCommit(local.trim())}
          placeholder={placeholder}
          className={inputClass}
        />
        {value.trim() && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:border-accent/40 hover:text-accent"
            aria-label={`Open ${label}`}
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </label>
  );
}

function BareInput({
  value,
  onCommit,
  placeholder,
}: {
  value: string;
  onCommit: (v: string | null) => void;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onCommit(local.trim() || null)}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}

function TextField({
  label,
  value,
  onCommit,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onCommit: (v: string | null) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [local, setLocal] = useState(value);
  return (
    <label className="block">
      {label && <span className={labelClass}>{label}</span>}
      {multiline ? (
        <textarea
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onCommit(local.trim() || null)}
          placeholder={placeholder}
          className={textareaClass}
        />
      ) : (
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onCommit(local.trim() || null)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </label>
  );
}

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
        className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-surface border-l border-border shadow-[0_0_80px_rgba(0,0,0,0.45)]"
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
                {lead.business_name || "Untitled business"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {lead.business_category || "No category set"}
                {lead.city ? ` · ${lead.city}` : ""}
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
            <ControlPanel label="Last contact date">
              <input
                type="date"
                value={toDateInputValue(lead.last_contact_date)}
                onChange={(e) =>
                  onPatch({ last_contact_date: e.target.value || null })
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/60"
              />
            </ControlPanel>
            <ControlPanel label="Next follow-up">
              <input
                type="datetime-local"
                value={toDateTimeInputValue(lead.next_followup_date)}
                onChange={(e) =>
                  onPatch({
                    next_followup_date: fromDateTimeInputValue(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/60"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Set the time if they gave one — e.g. "call me evening 6pm".
              </p>
            </ControlPanel>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 [scrollbar-gutter:stable]">
          {/* CONTACT INFORMATION */}
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Contact information
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ControlPanel label="Owner name">
                <BareInput
                  value={lead.owner_name}
                  onCommit={(v) => onPatch({ owner_name: v || lead.owner_name })}
                  placeholder="Owner / contact person"
                />
              </ControlPanel>
              <InfoTile
                Icon={CalendarClock}
                label="Added"
                value={formatDateTime(lead.created_at)}
              />
              <ControlPanel label="Phone">
                <BareInput
                  value={lead.phone}
                  onCommit={(v) => onPatch({ phone: v || lead.phone })}
                  placeholder="+91 99999 00000"
                />
              </ControlPanel>
              <ControlPanel label="WhatsApp number">
                <BareInput
                  value={lead.whatsapp_number ?? ""}
                  onCommit={(v) => onPatch({ whatsapp_number: v })}
                  placeholder="If different from phone"
                />
              </ControlPanel>
              <ControlPanel label="Email">
                <BareInput
                  value={lead.email}
                  onCommit={(v) => onPatch({ email: v || lead.email })}
                  placeholder="email@example.com"
                />
              </ControlPanel>
            </div>
          </div>

          {/* BUSINESS INFORMATION */}
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Business information
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ControlPanel label="Business name">
                <BareInput
                  value={lead.business_name}
                  onCommit={(v) =>
                    onPatch({ business_name: v || lead.business_name })
                  }
                />
              </ControlPanel>
              <ControlPanel label="Business category">
                <BareInput
                  value={lead.business_category}
                  onCommit={(v) =>
                    onPatch({ business_category: v || lead.business_category })
                  }
                  placeholder="e.g. Restaurant, Dental Clinic"
                />
              </ControlPanel>
              <ControlPanel label="City / district">
                <BareInput
                  value={lead.city ?? ""}
                  onCommit={(v) => onPatch({ city: v })}
                />
              </ControlPanel>
              <ControlPanel label="Address">
                <BareInput
                  value={lead.address ?? ""}
                  onCommit={(v) => onPatch({ address: v })}
                />
              </ControlPanel>
            </div>
          </div>

          {/* ONLINE PRESENCE */}
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Online presence
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <LinkField
                label="Website"
                value={lead.website_url ?? ""}
                onCommit={(v) => onPatch({ website_url: v || null })}
                placeholder="https://"
              />
              <LinkField
                label="Instagram"
                value={lead.instagram_url ?? ""}
                onCommit={(v) => onPatch({ instagram_url: v || null })}
                placeholder="https://instagram.com/..."
              />
              <LinkField
                label="Google Maps"
                value={lead.google_maps_url ?? ""}
                onCommit={(v) => onPatch({ google_maps_url: v || null })}
                placeholder="https://maps.google.com/..."
              />
              <LinkField
                label="Facebook"
                value={lead.facebook_url ?? ""}
                onCommit={(v) => onPatch({ facebook_url: v || null })}
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>

          {/* BUSINESS NOTES — collapsible */}
          <details className="rounded-2xl border border-border bg-background/35 p-5" open>
            <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Business notes
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Best time to call</span>
                <Select
                  value={lead.best_time_to_call ?? undefined}
                  onValueChange={(v) => onPatch({ best_time_to_call: v })}
                >
                  <SelectTrigger className={`${inputClass} h-auto shadow-none`}>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {BEST_TIME_TO_CALL_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="block">
                <span className={labelClass}>Preferred contact method</span>
                <Select
                  value={lead.preferred_contact_method ?? undefined}
                  onValueChange={(v) => onPatch({ preferred_contact_method: v })}
                >
                  <SelectTrigger className={`${inputClass} h-auto shadow-none`}>
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFERRED_CONTACT_METHOD_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <TextField
                label="Decision maker"
                value={lead.decision_maker ?? ""}
                onCommit={(v) => onPatch({ decision_maker: v })}
                placeholder="Who signs off on this?"
              />
              <TextField
                label="Marketing handled by"
                value={lead.marketing_handled_by ?? ""}
                onCommit={(v) => onPatch({ marketing_handled_by: v })}
                placeholder="In-house, freelancer, agency..."
              />
              <div className="sm:col-span-2">
                <TextField
                  label="Future plans"
                  value={lead.future_plans ?? ""}
                  onCommit={(v) => onPatch({ future_plans: v })}
                  placeholder="Expansion, new branch, rebrand..."
                  multiline
                />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  label="Pain points"
                  value={lead.pain_points ?? ""}
                  onCommit={(v) => onPatch({ pain_points: v })}
                  placeholder="What's frustrating them right now?"
                  multiline
                />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  label="Objections"
                  value={lead.objections ?? ""}
                  onCommit={(v) => onPatch({ objections: v })}
                  placeholder="Price, timing, trust, already has a site..."
                  multiline
                />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  label="Next best action"
                  value={lead.next_best_action ?? ""}
                  onCommit={(v) => onPatch({ next_best_action: v })}
                  placeholder="What should happen next?"
                  multiline
                />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  label="General notes"
                  value={lead.general_notes ?? ""}
                  onCommit={(v) => onPatch({ general_notes: v })}
                  multiline
                />
              </div>
            </div>
          </details>

          {/* RESEARCH NOTES — collapsible, long markdown */}
          <details className="rounded-2xl border border-border bg-background/35 p-5">
            <summary className="cursor-pointer text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Research notes
            </summary>
            <p className="mt-2 text-[11px] text-muted-foreground/80">
              Markdown supported. e.g. "Owner appears in reels", "Hosts events
              twice a month", "No recent Instagram posts", "Franchise banner
              observed", "Menu only on Google Maps".
            </p>
            <div className="mt-3">
              <TextField
                label=""
                value={lead.research_notes ?? ""}
                onCommit={(v) => onPatch({ research_notes: v })}
                placeholder="Write freeform research notes in markdown..."
                multiline
              />
            </div>
          </details>

          {/* Legacy message from the public contact form, if any */}
          {lead.message?.trim() && (
            <div className="rounded-2xl border border-border bg-background/35 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Original message
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
                {lead.message}
              </p>
            </div>
          )}

          {/* CALL HISTORY */}
          <Timeline
            entityType="lead"
            entityId={lead.id}
            eventTypeOptions={LEAD_TIMELINE_EVENT_TYPES}
            title="Call history"
            emptyLabel="No calls logged yet — log your first call above."
          />

          {/* TASKS */}
          <TasksPanel entityType="lead" entityId={lead.id} title="Tasks" />
        </div>

        {/* FOOTER */}
        <div className="border-t border-border p-4 md:p-5 space-y-2">
          {convertMsg && (
            <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
              {convertMsg}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-3 text-sm font-medium hover:bg-accent-glow transition-colors"
            >
              <Phone size={14} /> Call
            </a>
            {lead.whatsapp_number && (
              <a
                href={`https://wa.me/${lead.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}?subject=Re: Your business`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <Mail size={14} /> Email
              </a>
            )}
            {onConvert && (
              <button
                onClick={handleConvert}
                disabled={converting}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-accent/40 px-4 py-3 text-sm text-accent hover:bg-accent/10 transition-colors disabled:opacity-60"
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
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
