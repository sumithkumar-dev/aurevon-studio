import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarClock,
  FileText,
  Mail,
  Phone,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import type {
  Client,
  ClientDocument,
  ClientPatch,
  PaymentStatus,
} from "../types";
import { PAYMENT_STATUS_OPTIONS } from "../constants";
import {
  formatDateTime,
  paymentStatusClasses,
  toDateInputValue,
} from "../utils";
import { ControlPanel, ContactLink, InfoTile } from "./tiles";
import { ProjectStatusBadge, ProjectStatusSelect } from "./ClientsTable";
import { ClientNotesSection } from "./ClientNotesSection";
import { fetchClientDocuments } from "../lib/documents";

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60";
const textareaClass = fieldClass + " min-h-[112px] resize-y";

function toNum(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 text-xs uppercase tracking-[0.22em] text-muted-foreground">
      {children}
    </div>
  );
}

/** Text input bound to a single client field, persisted onBlur. */
function TextField({
  label,
  value,
  onCommit,
  placeholder,
  type = "text",
  textarea = false,
  hint,
}: {
  label: string;
  value: string | null | undefined;
  onCommit: (next: string | null) => void;
  placeholder?: string;
  type?: "text" | "email" | "url" | "tel" | "date";
  textarea?: boolean;
  hint?: string;
}) {
  const initial = type === "date" ? toDateInputValue(value ?? null) : value ?? "";
  const [local, setLocal] = useState<string>(initial);
  useEffect(() => {
    setLocal(initial);
  }, [initial]);
  return (
    <ControlPanel label={label} hint={hint}>
      {textarea ? (
        <textarea
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onCommit(local.trim() ? local : null)}
          placeholder={placeholder}
          className={textareaClass}
        />
      ) : (
        <input
          type={type}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onCommit(local.trim() ? local : null)}
          placeholder={placeholder}
          className={fieldClass}
        />
      )}
    </ControlPanel>
  );
}

function NumberField({
  label,
  value,
  onCommit,
  placeholder = "0",
}: {
  label: string;
  value: number | null | undefined;
  onCommit: (next: number | null) => void;
  placeholder?: string;
}) {
  const [local, setLocal] = useState<string>(value == null ? "" : String(value));
  useEffect(() => {
    setLocal(value == null ? "" : String(value));
  }, [value]);
  return (
    <ControlPanel label={label}>
      <input
        inputMode="decimal"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onCommit(toNum(local))}
        placeholder={placeholder}
        className={fieldClass + " text-right tabular-nums"}
      />
    </ControlPanel>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] " +
        paymentStatusClasses(status)
      }
    >
      {status}
    </span>
  );
}

type Tab = "details" | "documents";

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
  const [tab, setTab] = useState<Tab>("details");
  const [finalBudget, setFinalBudget] = useState(client.final_budget ?? "");
  useEffect(() => {
    setFinalBudget(client.final_budget ?? "");
  }, [client.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const remaining = useMemo(
    () =>
      (Number(client.final_price) || 0) -
      (Number(client.advance_paid) || 0),
    [client.final_price, client.advance_paid],
  );

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
                <PaymentStatusBadge status={client.payment_status} />
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
                onBlur={() =>
                  onPatch({ final_budget: finalBudget.trim() || null })
                }
                placeholder="e.g. ₹45,000"
                className={fieldClass}
              />
            </ControlPanel>
          </div>

          {/* Tabs */}
          <div className="mt-5 inline-flex rounded-full border border-border bg-background p-1 text-xs">
            {(
              [
                { id: "details", label: "Details" },
                { id: "documents", label: "Documents" },
              ] as { id: Tab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  "rounded-full px-3 py-1.5 transition-colors " +
                  (tab === t.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          {tab === "details" ? (
            <DetailsTab
              client={client}
              onPatch={onPatch}
              remaining={remaining}
            />
          ) : (
            <DocumentsTab client={client} />
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-border p-4 md:p-5">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            {client.email ? (
              <a
                href={`mailto:${client.email}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-3 text-sm font-medium hover:bg-accent-glow transition-colors"
              >
                <Mail size={14} /> Email client
              </a>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="No client email on file"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-3 text-sm font-medium opacity-50 cursor-not-allowed"
              >
                <Mail size={14} /> Email client
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

function DetailsTab({
  client,
  onPatch,
  remaining,
}: {
  client: Client;
  onPatch: (patch: ClientPatch) => void;
  remaining: number;
}) {
  return (
    <>
      {/* ============== CLIENT ============== */}
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        Client
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <InfoTile Icon={User} label="Client name" value={client.client_name} />
        <InfoTile
          Icon={CalendarClock}
          label="Added"
          value={formatDateTime(client.created_at)}
        />
        <InfoTile
          Icon={Building2}
          label="Business"
          value={client.business_name || "—"}
        />
        <InfoTile Icon={Tag} label="Source" value={client.source} />
      </div>
      {(client.email || client.phone) && (
        <div className="mt-3 grid gap-3">
          {client.email && (
            <ContactLink
              Icon={Mail}
              href={`mailto:${client.email}`}
              label="Lead Email"
              value={client.email}
              hint="Captured when this lead first came in"
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
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TextField
          label="Primary contact name"
          value={client.primary_contact_name}
          onCommit={(v) => onPatch({ primary_contact_name: v })}
          placeholder="Person to address on documents"
        />
        <TextField
          label="Primary contact phone"
          value={client.primary_contact_phone}
          onCommit={(v) => onPatch({ primary_contact_phone: v })}
          type="tel"
          placeholder="+91 ..."
        />
        <TextField
          label="Document contact email"
          value={client.primary_contact_email}
          onCommit={(v) => onPatch({ primary_contact_email: v })}
          type="email"
          placeholder="contact@business.com"
          hint="Shown on proposals, invoices, and other generated documents"
        />
      </div>

      {/* ============== PROJECT ============== */}
      <SectionHeader>Project</SectionHeader>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextField
          label="Project name"
          value={client.project_name}
          onCommit={(v) => onPatch({ project_name: v })}
          placeholder="e.g. Brand site redesign"
        />
        <TextField
          label="Project type"
          value={client.project_type}
          onCommit={(v) => onPatch({ project_type: v })}
          placeholder="e.g. Website, Branding"
        />
        <TextField
          label="Delivery date"
          type="date"
          value={client.delivery_date}
          onCommit={(v) => onPatch({ delivery_date: v })}
        />
      </div>

      {/* ============== UNDERSTANDING ============== */}
      <SectionHeader>Project Understanding</SectionHeader>
      <div className="mt-3 grid gap-3">
        <TextField
          label="Project description"
          value={client.project_description}
          onCommit={(v) => onPatch({ project_description: v })}
          textarea
          placeholder="What the client wants to achieve — used as the proposal overview"
        />
      </div>

      {/* ============== SCOPE ============== */}
      <SectionHeader>Scope of Work</SectionHeader>
      <div className="mt-3 grid gap-3">
        <TextField
          label="Scope of work"
          value={client.scope_of_work}
          onCommit={(v) => onPatch({ scope_of_work: v })}
          textarea
          placeholder="Deliverables, inclusions and exclusions"
        />
      </div>

      {/* ============== PROCESS & AGREEMENT ============== */}
      <SectionHeader>Process &amp; Agreement</SectionHeader>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextField
          label="Agreement date"
          type="date"
          value={client.agreement_date}
          onCommit={(v) => onPatch({ agreement_date: v })}
        />
        <ControlPanel label="Revision count">
          <input
            type="number"
            min={0}
            value={client.revision_count ?? 0}
            onChange={(e) =>
              onPatch({
                revision_count: Math.max(0, Number(e.target.value) || 0),
              })
            }
            className={fieldClass + " text-right tabular-nums"}
          />
        </ControlPanel>
      </div>
      <div className="mt-3 grid gap-3">
        <TextField
          label="Terms / notes"
          value={client.terms_notes}
          onCommit={(v) => onPatch({ terms_notes: v })}
          textarea
          placeholder="Anything that should appear under terms on the agreement"
        />
      </div>

      {/* ============== TIMELINE ============== */}
      <SectionHeader>Timeline</SectionHeader>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextField
          label="Timeline (summary)"
          value={client.timeline}
          onCommit={(v) => onPatch({ timeline: v })}
          placeholder="e.g. 4 weeks"
        />
        <TextField
          label="Delivery date"
          type="date"
          value={client.delivery_date}
          onCommit={(v) => onPatch({ delivery_date: v })}
        />
        <TextField
          label="Project start date"
          type="date"
          value={client.project_start_date}
          onCommit={(v) => onPatch({ project_start_date: v })}
        />
        <TextField
          label="Project end date"
          type="date"
          value={client.project_end_date}
          onCommit={(v) => onPatch({ project_end_date: v })}
        />
      </div>

      {/* ============== PRICING ============== */}
      <SectionHeader>Pricing</SectionHeader>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <NumberField
          label="Quoted price (₹)"
          value={client.quoted_price}
          onCommit={(v) => onPatch({ quoted_price: v })}
        />
        <NumberField
          label="Final price (₹)"
          value={client.final_price}
          onCommit={(v) => onPatch({ final_price: v })}
        />
        <NumberField
          label="Advance amount (₹)"
          value={client.advance_amount}
          onCommit={(v) => onPatch({ advance_amount: v })}
        />
        <NumberField
          label="Advance paid (₹)"
          value={client.advance_paid}
          onCommit={(v) => onPatch({ advance_paid: v ?? 0 })}
        />
        <ControlPanel label="Remaining amount (₹)">
          <div className="rounded-xl border border-border bg-background/60 px-3 py-2 text-right text-sm text-accent tabular-nums">
            {Number.isFinite(remaining)
              ? `₹${remaining.toLocaleString()}`
              : "—"}
          </div>
        </ControlPanel>
        <ControlPanel label="Payment status">
          <select
            value={client.payment_status}
            onChange={(e) =>
              onPatch({ payment_status: e.target.value as PaymentStatus })
            }
            className={fieldClass}
          >
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </ControlPanel>
      </div>

      {/* ============== BUSINESS DETAILS (existing fields, kept) ============== */}
      <SectionHeader>Business details</SectionHeader>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextField
          label="Business name"
          value={client.business_name}
          onCommit={(v) => onPatch({ business_name: v ?? "" })}
        />
        <TextField
          label="Owner name"
          value={client.owner_name}
          onCommit={(v) => onPatch({ owner_name: v })}
        />
        <TextField
          label="GST number (optional)"
          value={client.gst_number}
          onCommit={(v) => onPatch({ gst_number: v })}
          placeholder="22AAAAA0000A1Z5"
        />
        <TextField
          label="Business website"
          value={client.business_website}
          onCommit={(v) => onPatch({ business_website: v })}
          type="url"
          placeholder="https://"
        />
        <TextField
          label="Business email"
          value={client.business_email}
          onCommit={(v) => onPatch({ business_email: v })}
          type="email"
          hint="Internal record only — not shown on generated documents"
        />
      </div>
      <div className="mt-3 grid gap-3">
        <TextField
          label="Business address"
          value={client.business_address}
          onCommit={(v) => onPatch({ business_address: v })}
          textarea
        />
      </div>

      {/* Notes */}
      <ClientNotesSection clientId={client.id} />
    </>
  );
}

function DocumentsTab({ client }: { client: Client }) {
  const [docs, setDocs] = useState<ClientDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDocs(null);
    setError(null);
    fetchClientDocuments(client.id)
      .then((d) => {
        if (!cancelled) setDocs(d);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load documents");
      });
    return () => {
      cancelled = true;
    };
  }, [client.id]);

  return (
    <>
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        Documents
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        PDF generation is not enabled yet. These cards reflect what will be
        generated once the document engine is connected.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(docs ?? placeholderDocs(client.id)).map((d) => (
          <div
            key={d.doc_type}
            className="rounded-2xl border border-border bg-background/40 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <FileText size={16} className="text-accent" />
                <span className="text-sm">{d.doc_type}</span>
              </div>
              <span
                className={
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] " +
                  (d.status === "Generated"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border-border bg-secondary/40 text-muted-foreground")
                }
              >
                {d.status}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <dt>Generated date</dt>
                <dd>{d.generated_at ? formatDateTime(d.generated_at) : "—"}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}

function placeholderDocs(clientId: string): ClientDocument[] {
  const now = new Date().toISOString();
  return (["Proposal", "Agreement", "Invoice", "Handover"] as const).map(
    (t) => ({
      id: `placeholder-${clientId}-${t}`,
      client_id: clientId,
      doc_type: t,
      status: "Not Generated" as const,
      generated_at: null,
      file_url: null,
      metadata: {},
      created_at: now,
      updated_at: now,
    }),
  );
}
