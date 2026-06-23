import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Download,
  FileText,
  Globe,
  ListChecks,
  Loader2,
  Mail,
  Phone,
  Plus,
  StickyNote,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import type {
  Client,
  ClientDocument,
  ClientPatch,
  DocumentType,
  PaymentStatus,
  ProjectStatus,
} from "../types";
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from "../constants";
import {
  formatDateTime,
  paymentStatusClasses,
  projectStatusClasses,
  toDateInputValue,
} from "../utils";
import { ClientNotesSection } from "./ClientNotesSection";
import { fetchClientDocuments, upsertDocument } from "../lib/documents";
import { generateAndPrint, getMissingFields } from "../lib/proposal";
import {
  applyWorkspaceDefaults,
  autoPricingItems,
  defaultMilestones,
  defaultTimelinePhases,
  newMilestone,
  newPricingItem,
  newTimelineEntry,
  parseWorkspace,
  serializeWorkspace,
  suggestClientAction,
  suggestGoalsForIndustry,
  SUGGESTED_DELIVERABLES,
  SUGGESTED_EXCLUSIONS,
  type WorkspaceMilestone,
  type WorkspacePayload,
  type WorkspacePricingItem,
  type WorkspaceTimelineEntry,
  hasWorkspaceTag,
} from "../lib/workspace";
import { formatCurrency, CURRENCY_OPTIONS } from "../lib/currency";

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-ring/30 transition-colors";
const textareaClass = inputClass + " min-h-[96px] resize-y leading-relaxed";

function toNum(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function SectionCard({
  title,
  description,
  Icon,
  children,
  actions,
}: {
  title: string;
  description?: string;
  Icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card/40 p-5 md:p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
      <header className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            {Icon ? (
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                <Icon size={14} />
              </span>
            ) : null}
            <h2 className="truncate text-base font-medium text-foreground">
              {title}
            </h2>
          </div>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function TextInput({
  value,
  onCommit,
  placeholder,
  type = "text",
}: {
  value: string | null | undefined;
  onCommit: (v: string | null) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url" | "date";
}) {
  const initial =
    type === "date" ? toDateInputValue(value ?? null) : (value ?? "");
  const [local, setLocal] = useState(initial);
  useEffect(() => setLocal(initial), [initial]);
  return (
    <input
      type={type}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onCommit(local.trim() ? local : null)}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}

function NumberInput({
  value,
  onCommit,
  placeholder = "0",
}: {
  value: number | null | undefined;
  onCommit: (v: number | null) => void;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value == null ? "" : String(value));
  useEffect(() => setLocal(value == null ? "" : String(value)), [value]);
  return (
    <input
      inputMode="decimal"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onCommit(toNum(local))}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}

function TextArea({
  value,
  onCommit,
  placeholder,
  rows,
}: {
  value: string | null | undefined;
  onCommit: (v: string | null) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [local, setLocal] = useState(value ?? "");
  useEffect(() => setLocal(value ?? ""), [value]);
  return (
    <textarea
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onCommit(local.trim() ? local : null)}
      placeholder={placeholder}
      rows={rows ?? 4}
      className={textareaClass}
    />
  );
}

/**
 * Milestone label input — uses local state so keystrokes don't trigger a save
 * (and therefore don't re-run the workspace useEffect that was resetting milestones).
 * Commits only onBlur, matching the TextInput/NumberInput primitives above.
 */
function MilestoneTextInput({
  value,
  onCommit,
  placeholder,
  className,
}: {
  value: string;
  onCommit: (v: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onCommit(local || null)}
      placeholder={placeholder}
      className={className}
    />
  );
}

/**
 * Milestone amount input — uses local string state so the user can freely edit
 * without triggering a DB save on every keystroke. Commits the parsed number
 * onBlur, or 0 if the field is empty/invalid.
 */
function MilestoneAmountInput({
  value,
  onCommit,
  className,
}: {
  value: number;
  onCommit: (v: number) => void;
  className?: string;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <input
      inputMode="decimal"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const n = Number(local);
        onCommit(Number.isFinite(n) ? n : 0);
      }}
      className={className}
    />
  );
}

function SelectInput<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={inputClass}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** Currency dropdown showing friendly labels ("₹  Indian Rupee (INR)") while
 *  storing clean symbols ("₹") in workspace.currency. */
function CurrencySelect({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value ?? "₹"}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    >
      {CURRENCY_OPTIONS.map((o) => (
        <option key={o.symbol} value={o.symbol}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* List editor (Goals)                                                 */
/* ------------------------------------------------------------------ */

function ListEditor({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  }
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-glow transition-colors disabled:opacity-50"
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing added yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, i) => (
            <li
              key={`${i}-${item}`}
              className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-accent/10 text-[11px] font-medium text-accent">
                {i + 1}
              </span>
              <input
                value={item}
                onChange={(e) => {
                  const next = items.slice();
                  next[i] = e.target.value;
                  onChange(next);
                }}
                className="min-w-0 bg-transparent text-sm text-foreground outline-none"
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="Remove"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* Checkbox list editor (Deliverables / Exclusions)                    */
/* Shows pre-suggested items as checkboxes. Checked items are added   */
/* to the active list. Custom items can still be typed in.            */
/* ------------------------------------------------------------------ */

function CheckboxListEditor({
  items,
  onChange,
  suggestions,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder: string;
  addLabel: string;
}) {
  const [draft, setDraft] = useState("");

  function isChecked(suggestion: string) {
    return items.includes(suggestion);
  }

  function toggle(suggestion: string) {
    if (isChecked(suggestion)) {
      onChange(items.filter((i) => i !== suggestion));
    } else {
      onChange([...items, suggestion]);
    }
  }

  function addCustom() {
    const v = draft.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setDraft("");
  }

  // Items that are NOT in the suggestions list (custom entries)
  const customItems = items.filter((item) => !suggestions.includes(item));

  return (
    <div className="space-y-4">
      {/* Suggestions as checkboxes */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Suggested — tick to include
        </p>
        <ul className="space-y-1.5">
          {suggestions.map((s) => (
            <li key={s}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/40 px-3 py-2.5 hover:bg-secondary/40 transition-colors">
                <input
                  type="checkbox"
                  checked={isChecked(s)}
                  onChange={() => toggle(s)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[hsl(var(--accent))] rounded"
                />
                <span className="text-sm text-foreground leading-snug">
                  {s}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Custom items added by user (not in suggestions) */}
      {customItems.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Custom
          </p>
          <ul className="space-y-2">
            {customItems.map((item) => (
              <li
                key={item}
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2"
              >
                <input
                  value={item}
                  onChange={(e) => {
                    const next = items.map((i) =>
                      i === item ? e.target.value : i,
                    );
                    onChange(next);
                  }}
                  className="min-w-0 bg-transparent text-sm text-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={() => onChange(items.filter((i) => i !== item))}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add custom item */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!draft.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-glow transition-colors disabled:opacity-50"
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

type TabKey =
  | "client"
  | "business"
  | "project"
  | "scope"
  | "timeline"
  | "pricing"
  | "documents"
  | "notes";

const TABS: {
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { key: "client", label: "Client", Icon: User },
  { key: "business", label: "Business", Icon: Building2 },
  { key: "project", label: "Project", Icon: Briefcase },
  { key: "scope", label: "Scope", Icon: ListChecks },
  { key: "timeline", label: "Timeline", Icon: CalendarClock },
  { key: "pricing", label: "Pricing", Icon: CircleDollarSign },
  { key: "documents", label: "Documents", Icon: FileText },
  { key: "notes", label: "Notes", Icon: StickyNote },
];

/* ------------------------------------------------------------------ */
/* Main workspace                                                      */
/* ------------------------------------------------------------------ */

export function ClientWorkspace({
  client,
  onClose,
  onDelete,
  onPatch,
}: {
  client: Client;
  onClose: () => void;
  onDelete: () => void;
  onPatch: (patch: ClientPatch) => void | Promise<void>;
}) {
  const [tab, setTab] = useState<TabKey>("client");

  // Local workspace payload parsed from terms_notes. Edits are buffered and
  // committed onBlur / on explicit changes via patchWorkspace().
  // ── Workspace initialization helpers ──────────────────────────────────────
  // total_price has two storage locations:
  //   1. workspace JSON (terms_notes) — the authoritative source once set
  //   2. client.final_price (DB column) — written as a side-effect of
  //      patchWorkspace for query/display purposes
  //
  // On first load (empty terms_notes), seed from client.final_price so
  // existing pricing data isn't lost. On subsequent loads, always prefer
  // the workspace's own total_price — it is the value the user last edited
  // in the workspace UI, and client.final_price is a derived copy of it.
  // Using client.final_price when workspace has its own value was what caused
  // the "milestone amounts reset after refresh" bug: the client row might
  // lag one write cycle behind the workspace JSON, so the seed would inject
  // a stale price into applyWorkspaceDefaults, which then regenerated fresh
  // milestones (with new random IDs) over the user's saved ones.
  function buildWorkspaceSeed(
    parsed: WorkspacePayload,
  ): import("../lib/workspace").ClientSeed {
    return {
      message: (client as unknown as Record<string, unknown>).lead_message as
        | string
        | null,
      project_description: client.project_description,
      industry: client.industry,
      website_type: parsed.website_type,
      pages_count: parsed.pages_count,
      support_days: parsed.support_days,
      // Only fall back to client.final_price when the workspace has no price
      // of its own — prevents a stale DB column from overwriting a fresher
      // workspace value during re-initialization.
      total_price: parsed.total_price ?? client.final_price,
    };
  }

  const [workspace, setWorkspace] = useState<WorkspacePayload>(() => {
    const parsed = parseWorkspace(client.terms_notes);
    // hasWorkspaceTag checks for BOTH valid JSON AND the __workspace:1 tag.
    // The previous startsWith("{") check was insufficient — any JSON object
    // would pass it, but parseWorkspace requires the tag to return real data.
    // Without the tag, parseWorkspace returns emptyWorkspace() (milestones:[]),
    // and skipping applyWorkspaceDefaults would render a blank workspace.
    if (hasWorkspaceTag(client.terms_notes)) {
      return parsed;  // Saved data — trust it completely, no defaults
    }
    return applyWorkspaceDefaults(parsed, buildWorkspaceSeed(parsed));
  });
  // Re-initialize ONLY when switching to a different client (client.id changes).
  // Must NOT depend on client.terms_notes — every patchWorkspace call updates
  // terms_notes, which would cause a re-parse loop resetting in-flight edits.
  // The local setWorkspace call inside patchWorkspace is the single update path
  // after initial mount.
  useEffect(() => {
    const parsed = parseWorkspace(client.terms_notes);
    if (hasWorkspaceTag(client.terms_notes)) {
      setWorkspace(parsed);  // Saved data — trust it completely, no defaults
    } else {
      setWorkspace(applyWorkspaceDefaults(parsed, buildWorkspaceSeed(parsed)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);  // client.id only — never client.terms_notes
  // Save status indicator (Saving / Saved / Error) for edits made in this workspace.
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handlePatch(patch: ClientPatch) {
    setSaveState("saving");
    setSaveError(null);
    try {
      await onPatch(patch);
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  function derivePaymentStatus(
    milestones: typeof workspace.milestones,
    totalPrice: number | null,
  ): import("../types").PaymentStatus {
    if (!milestones.length) return "Not Started";
    const paidTotal = milestones
      .filter((m) => m.paid)
      .reduce((s, m) => s + m.amount, 0);
    if (paidTotal === 0) return "Not Started";
    const total = totalPrice ?? milestones.reduce((s, m) => s + m.amount, 0);
    if (total > 0 && paidTotal >= total) return "Fully Paid";
    if (milestones[0]?.paid && !milestones.slice(1).some((m) => m.paid))
      return "Advance Paid";
    return "Partially Paid";
  }

  function patchWorkspace(partial: Partial<WorkspacePayload>) {
    const next = { ...workspace, ...partial };
    setWorkspace(next);
    if (
      "milestones" in partial ||
      "total_price" in partial ||
      "pricing_items" in partial
    ) {
      const derived = derivePaymentStatus(next.milestones, next.total_price);
      const paidTotal = next.milestones
        .filter((m) => m.paid)
        .reduce((s, m) => s + m.amount, 0);

      // Compute the canonical project total — single source of truth.
      // Priority: explicit total_price > sum of milestones (if any exist) >
      // sum of pricing items (last resort when no milestones and no total set).
      // Note: Array.reduce() always returns a number (0 for empty arrays), so
      // we cannot use ?? chaining — we check array length explicitly instead.
      const milestonesSum = next.milestones.reduce((s, m) => s + m.amount, 0);
      const itemsSum = next.pricing_items.reduce((s, it) => s + it.amount, 0);
      const total =
        next.total_price !== null && next.total_price !== undefined
          ? next.total_price
          : next.milestones.length > 0
            ? milestonesSum
            : itemsSum;

      const remaining = Math.max(0, total - paidTotal);
      handlePatch({
        terms_notes: serializeWorkspace(next),
        payment_status: derived,
        advance_paid: paidTotal,
        remaining_amount: remaining,
        final_price: total,
      });
    } else {
      handlePatch({ terms_notes: serializeWorkspace(next) });
    }
  }

  // Auto-save defaults the FIRST time a brand-new client is opened (no saved
  // workspace JSON yet). Uses hasWorkspaceTag — the same check as the init
  // above — so the condition is consistent and never fires on clients that
  // already have saved data, preventing overwrite of user edits.
  useEffect(() => {
    if (!hasWorkspaceTag(client.terms_notes)) {
      handlePatch({ terms_notes: serializeWorkspace(workspace) });
    }
    // Only run on mount / client change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  // Pricing totals.
  const itemsSubtotal = useMemo(
    () =>
      workspace.pricing_items.reduce((sum, it) => sum + (it.amount || 0), 0),
    [workspace.pricing_items],
  );
  const milestonesTotal = useMemo(
    () => workspace.milestones.reduce((sum, m) => sum + (m.amount || 0), 0),
    [workspace.milestones],
  );

  // Documents.
  const [docs, setDocs] = useState<ClientDocument[] | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  useEffect(() => {
    if (tab !== "documents") return;
    let active = true;
    setDocsLoading(true);
    fetchClientDocuments(client.id)
      .then((d) => active && setDocs(d))
      .catch(() => active && setDocs([]))
      .finally(() => active && setDocsLoading(false));
    return () => {
      active = false;
    };
  }, [tab, client.id]);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
      {/* Workspace header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container-aurevon flex flex-col gap-3 py-3 md:py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={onClose}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
              >
                <ArrowLeft size={13} />{" "}
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
                <Briefcase size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Client workspace
                </div>
                <h1 className="truncate text-lg font-medium text-foreground md:text-xl">
                  {client.business_name ||
                    client.client_name ||
                    "Untitled client"}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {saveState === "saving" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" /> Saving...
                </span>
              )}
              {saveState === "saved" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200">
                  <CheckCircle2 size={12} /> Saved
                </span>
              )}
              <span
                className={`hidden rounded-full border px-3 py-1.5 text-xs font-medium md:inline-flex ${projectStatusClasses(
                  client.project_status,
                )}`}
              >
                {client.project_status}
              </span>
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors"
                aria-label="Delete client"
              >
                <Trash2 size={13} />{" "}
                <span className="hidden sm:inline">Delete</span>
              </button>
              <button
                onClick={onClose}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary md:hidden"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Tab strip */}
          <nav className="-mx-1 flex overflow-x-auto pb-1">
            <div className="flex gap-1 px-1">
              {TABS.map(({ key, label, Icon }) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
      {saveState === "error" && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3">
          <div className="container-aurevon flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle size={14} className="shrink-0" />
            <span>
              {saveError ?? "Save failed. Your change may not have been saved."}
            </span>
          </div>
        </div>
      )}
      {/* Body */}
      <div className="container-aurevon py-6 md:py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          {tab === "client" && (
            <ClientTab
              client={client}
              workspace={workspace}
              onPatch={handlePatch}
              onPatchWorkspace={patchWorkspace}
            />
          )}
          {tab === "business" && (
            <BusinessTab client={client} onPatch={handlePatch} />
          )}
          {tab === "project" && (
            <ProjectTab
              client={client}
              workspace={workspace}
              onPatch={handlePatch}
              onPatchWorkspace={patchWorkspace}
            />
          )}
          {tab === "scope" && (
            <ScopeTab workspace={workspace} onPatchWorkspace={patchWorkspace} />
          )}
          {tab === "timeline" && (
            <TimelineTab
              workspace={workspace}
              onPatchWorkspace={patchWorkspace}
            />
          )}
          {tab === "pricing" && (
            <PricingTab
              client={client}
              workspace={workspace}
              itemsSubtotal={itemsSubtotal}
              milestonesTotal={milestonesTotal}
              onPatch={handlePatch}
              onPatchWorkspace={patchWorkspace}
            />
          )}
          {tab === "documents" && (
            <DocumentsTab
              docs={docs}
              loading={docsLoading}
              client={client}
              workspace={workspace}
              onPatch={handlePatch}
              onDocGenerated={(updated) => {
                setDocs((prev) => {
                  if (!prev) return [updated];
                  // Match on both doc_type and invoice_subtype for split invoices
                  const idx = prev.findIndex(
                    (d) =>
                      d.doc_type === updated.doc_type &&
                      (d.invoice_subtype ?? null) ===
                        (updated.invoice_subtype ?? null),
                  );
                  if (idx === -1) return [...prev, updated];
                  return prev.map((d, i) => (i === idx ? updated : d));
                });
              }}
            />
          )}
          {tab === "notes" && (
            <SectionCard
              title="Internal notes"
              description="Visible only to your team."
              Icon={StickyNote}
            >
              <ClientNotesSection clientId={client.id} />
            </SectionCard>
          )}

          <p className="pt-2 text-center text-[11px] text-muted-foreground">
            Created {formatDateTime(client.created_at)} · Last update{" "}
            {formatDateTime(client.updated_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Client                                                         */
/* ------------------------------------------------------------------ */

function ClientTab({
  client,
  workspace,
  onPatch,
  onPatchWorkspace,
}: {
  client: Client;
  workspace: WorkspacePayload;
  onPatch: (patch: ClientPatch) => void | Promise<void>;
  onPatchWorkspace: (partial: Partial<WorkspacePayload>) => void;
}) {
  return (
    <SectionCard
      title="Client information"
      description="Who the project is for and how to reach them."
      Icon={User}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business name">
          <TextInput
            value={client.business_name}
            onCommit={(v) => onPatch({ business_name: v ?? "" })}
          />
        </Field>
        <Field label="Industry">
          <TextInput
            value={client.industry}
            onCommit={(v) => onPatch({ industry: v ?? "" })}
          />
        </Field>
        <Field label="Contact name">
          <TextInput
            value={client.primary_contact_name ?? client.client_name}
            onCommit={(v) =>
              onPatch({
                primary_contact_name: v,
                client_name: v ?? client.client_name,
              })
            }
          />
        </Field>
        <Field label="Contact title">
          <TextInput
            value={workspace.contact_title}
            onCommit={(v) => onPatchWorkspace({ contact_title: v })}
            placeholder="Founder, Marketing Lead..."
          />
        </Field>
        <Field
          label="Document contact email"
          hint="Used on proposals, agreements, and invoices."
        >
          <TextInput
            type="email"
            value={client.primary_contact_email ?? client.email}
            onCommit={(v) => onPatch({ primary_contact_email: v })}
          />
        </Field>
        <Field label="Phone">
          <TextInput
            type="tel"
            value={client.primary_contact_phone ?? client.phone}
            onCommit={(v) =>
              onPatch({ primary_contact_phone: v, phone: v ?? client.phone })
            }
          />
        </Field>
        <Field label="Location">
          <TextInput
            value={workspace.location}
            onCommit={(v) => onPatchWorkspace({ location: v })}
            placeholder="City, Country"
          />
        </Field>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Business                                                       */
/* ------------------------------------------------------------------ */

function BusinessTab({
  client,
  onPatch,
}: {
  client: Client;
  onPatch: (patch: ClientPatch) => void | Promise<void>;
}) {
  return (
    <SectionCard
      title="Business information"
      description="Used in agreements, invoices and handover documents."
      Icon={Building2}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Owner name">
          <TextInput
            value={client.owner_name}
            onCommit={(v) => onPatch({ owner_name: v })}
          />
        </Field>
        <Field
          label="Business email"
          hint="Internal record only — not shown on generated documents."
        >
          <TextInput
            type="email"
            value={client.business_email}
            onCommit={(v) => onPatch({ business_email: v })}
          />
        </Field>
        <Field label="Business website">
          <TextInput
            type="url"
            value={client.business_website}
            onCommit={(v) => onPatch({ business_website: v })}
            placeholder="https://"
          />
        </Field>
        <Field label="GST number">
          <TextInput
            value={client.gst_number}
            onCommit={(v) => onPatch({ gst_number: v })}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Business address">
            <TextArea
              value={client.business_address}
              onCommit={(v) => onPatch({ business_address: v })}
              rows={3}
            />
          </Field>
        </div>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Project                                                        */
/* ------------------------------------------------------------------ */

function ProjectTab({
  client,
  workspace,
  onPatch,
  onPatchWorkspace,
}: {
  client: Client;
  workspace: WorkspacePayload;
  onPatch: (patch: ClientPatch) => void | Promise<void>;
  onPatchWorkspace: (partial: Partial<WorkspacePayload>) => void;
}) {
  // Derive a non-empty summary to always show something meaningful
  const effectiveSummary =
    workspace.summary ||
    client.project_description ||
    "A professional website project tailored to the client's business goals and target audience.";

  return (
    <>
      <SectionCard
        title="Project information"
        description="High-level definition of the engagement."
        Icon={Briefcase}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Project name">
              <TextInput
                value={client.project_name}
                onCommit={(v) => onPatch({ project_name: v })}
              />
            </Field>
          </div>
          <Field label="Website type">
            <TextInput
              value={workspace.website_type}
              onCommit={(v) => onPatchWorkspace({ website_type: v })}
              placeholder="Brochure, E-commerce, Landing..."
            />
          </Field>
          <Field label="Project status">
            <SelectInput<ProjectStatus>
              value={client.project_status}
              options={PROJECT_STATUS_OPTIONS}
              onChange={(v) => onPatch({ project_status: v })}
            />
          </Field>
          <Field label="Start date">
            <TextInput
              type="date"
              value={client.project_start_date}
              onCommit={(v) => onPatch({ project_start_date: v })}
            />
          </Field>
          <Field label="Launch date">
            <TextInput
              type="date"
              value={client.project_end_date ?? client.delivery_date}
              onCommit={(v) =>
                onPatch({ project_end_date: v, delivery_date: v })
              }
            />
          </Field>
          <Field label="Pages count">
            <NumberInput
              value={workspace.pages_count}
              onCommit={(v) => onPatchWorkspace({ pages_count: v })}
            />
          </Field>
          <Field label="Revision rounds">
            <NumberInput
              value={client.revision_count}
              onCommit={(v) => onPatch({ revision_count: v ?? 0 })}
            />
          </Field>
          <Field label="Support days">
            <NumberInput
              value={workspace.support_days}
              onCommit={(v) => onPatchWorkspace({ support_days: v })}
              placeholder="Days of post-launch support"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Understanding"
        description="Capture context so proposals and agreements stay aligned."
        Icon={ClipboardList}
      >
        <div className="space-y-4">
          <Field
            label="Summary"
            hint="Auto-filled from client message or project description. Edit to customise."
          >
            <TextArea
              value={effectiveSummary}
              onCommit={(v) => {
                const val = v || effectiveSummary;
                onPatchWorkspace({ summary: val });
                onPatch({ project_description: val });
              }}
              placeholder="Short summary of the engagement..."
            />
          </Field>
          <Field label="Primary challenge">
            <TextArea
              value={workspace.primary_challenge}
              onCommit={(v) => onPatchWorkspace({ primary_challenge: v })}
              placeholder="The single biggest problem you're solving."
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Goals"
        description="Outcomes the project must achieve. Auto-suggested based on industry — edit freely."
        Icon={CheckCircle2}
        actions={
          <button
            type="button"
            onClick={() =>
              onPatchWorkspace({
                goals: suggestGoalsForIndustry(client.industry),
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Re-generate suggestions from industry"
          >
            Re-suggest
          </button>
        }
      >
        <ListEditor
          items={workspace.goals}
          onChange={(goals) => onPatchWorkspace({ goals })}
          placeholder="e.g. Launch a credible online presence"
          addLabel="Add goal"
        />
      </SectionCard>

      <SectionCard
        title="Handover information"
        description="Domain and hosting details used in the project handover document."
        Icon={Globe}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Domain provider">
            <TextInput
              value={workspace.domain_provider}
              onCommit={(v) => onPatchWorkspace({ domain_provider: v })}
              placeholder="GoDaddy, Namecheap, Cloudflare..."
            />
          </Field>
          <Field label="Hosting provider">
            <TextInput
              value={workspace.hosting_provider}
              onCommit={(v) => onPatchWorkspace({ hosting_provider: v })}
              placeholder="Hostinger, Vercel, Netlify..."
            />
          </Field>
        </div>
      </SectionCard>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Scope                                                          */
/* ------------------------------------------------------------------ */

function ScopeTab({
  workspace,
  onPatchWorkspace,
}: {
  workspace: WorkspacePayload;
  onPatchWorkspace: (partial: Partial<WorkspacePayload>) => void;
}) {
  return (
    <>
      <SectionCard
        title="Deliverables"
        description="Tick items included in this engagement. Add custom ones below."
        Icon={ListChecks}
      >
        <CheckboxListEditor
          items={workspace.deliverables}
          onChange={(deliverables) => onPatchWorkspace({ deliverables })}
          suggestions={SUGGESTED_DELIVERABLES}
          placeholder="e.g. Multilingual support"
          addLabel="Add custom"
        />
      </SectionCard>

      <SectionCard
        title="Exclusions"
        description="Tick items that are out of scope to set clear expectations."
        Icon={X}
      >
        <CheckboxListEditor
          items={workspace.exclusions}
          onChange={(exclusions) => onPatchWorkspace({ exclusions })}
          suggestions={SUGGESTED_EXCLUSIONS}
          placeholder="e.g. Custom animations"
          addLabel="Add custom"
        />
      </SectionCard>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Timeline                                                       */
/* ------------------------------------------------------------------ */

function TimelineTab({
  workspace,
  onPatchWorkspace,
}: {
  workspace: WorkspacePayload;
  onPatchWorkspace: (partial: Partial<WorkspacePayload>) => void;
}) {
  function update(id: string, patch: Partial<WorkspaceTimelineEntry>) {
    onPatchWorkspace({
      timeline: workspace.timeline.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      ),
    });
  }
  function remove(id: string) {
    onPatchWorkspace({
      timeline: workspace.timeline.filter((t) => t.id !== id),
    });
  }
  return (
    <SectionCard
      title="Timeline"
      description="Phases, milestones and target dates. Edit dates only — structure is pre-built."
      Icon={CalendarClock}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onPatchWorkspace({ timeline: defaultTimelinePhases() });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            Reset phases
          </button>
          <button
            type="button"
            onClick={() =>
              onPatchWorkspace({
                timeline: [...workspace.timeline, newTimelineEntry()],
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent-glow transition-colors"
          >
            <Plus size={13} /> Add phase
          </button>
        </div>
      }
    >
      {workspace.timeline.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background/20 p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            No phases yet. The default Discovery → Design → Development → Launch
            structure will be added automatically on next open.
          </p>
          <button
            type="button"
            onClick={() => {
              onPatchWorkspace({ timeline: defaultTimelinePhases() });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-glow transition-colors"
          >
            <Plus size={14} /> Add default phases
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {workspace.timeline.map((entry, idx) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-border bg-background/40 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Phase {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove phase"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <Field label="Phase">
                  <input
                    value={entry.phase}
                    onChange={(e) =>
                      update(entry.id, { phase: e.target.value })
                    }
                    placeholder="Discovery, Design, Build, Launch..."
                    className={inputClass}
                  />
                </Field>
                <Field label="Start">
                  <input
                    type="date"
                    value={toDateInputValue(entry.start ?? null)}
                    onChange={(e) =>
                      update(entry.id, { start: e.target.value || null })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="End">
                  <input
                    type="date"
                    value={toDateInputValue(entry.end ?? null)}
                    onChange={(e) =>
                      update(entry.id, { end: e.target.value || null })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field
                  label="What Happens"
                  hint="Brief description of the Studio's work in this phase."
                >
                  <textarea
                    value={entry.notes ?? ""}
                    onChange={(e) =>
                      update(entry.id, { notes: e.target.value || null })
                    }
                    rows={2}
                    placeholder="Optional context for this phase."
                    className={textareaClass}
                  />
                </Field>
                <Field
                  label="Client Action"
                  hint="What the client needs to do or provide during this phase."
                >
                  <textarea
                    value={entry.client_action ?? ""}
                    onChange={(e) =>
                      update(entry.id, {
                        client_action: e.target.value || null,
                      })
                    }
                    rows={2}
                    placeholder={suggestClientAction(entry.phase)}
                    className={textareaClass}
                  />
                </Field>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Pricing                                                        */
/* ------------------------------------------------------------------ */

function PricingTab({
  client,
  workspace,
  itemsSubtotal,
  milestonesTotal,
  onPatch,
  onPatchWorkspace,
}: {
  client: Client;
  workspace: WorkspacePayload;
  itemsSubtotal: number;
  milestonesTotal: number;
  onPatch: (patch: ClientPatch) => void | Promise<void>;
  onPatchWorkspace: (partial: Partial<WorkspacePayload>) => void;
}) {
  const currency = workspace.currency ?? "₹";
  const fmt = (n: number) => formatCurrency(n, currency);

  function updateItem(id: string, patch: Partial<WorkspacePricingItem>) {
    onPatchWorkspace({
      pricing_items: workspace.pricing_items.map((it) =>
        it.id === id ? { ...it, ...patch } : it,
      ),
    });
  }
  function updateMilestone(id: string, patch: Partial<WorkspaceMilestone>) {
    onPatchWorkspace({
      milestones: workspace.milestones.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    });
  }

  const totalPrice = workspace.total_price ?? client.final_price ?? 0;

  return (
    <>
      <SectionCard title="Pricing" Icon={CircleDollarSign}>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Currency">
            <CurrencySelect
              value={currency}
              onChange={(v) => onPatchWorkspace({ currency: v })}
            />
          </Field>
          <Field label="Total price">
            <NumberInput
              value={workspace.total_price ?? client.final_price}
              onCommit={(v) => {
                // Single atomic workspace patch — patchWorkspace already syncs
                // final_price, advance_paid, remaining_amount, and payment_status
                // as part of its milestone/total_price change handler, so we
                // never need a separate onPatch({ final_price }) call here.
                const price = v ?? 0;
                // Auto-recalculate milestones when exactly 2 exist (the standard
                // 50/50 auto-generated split). Guards: only recalculate if the
                // milestone labels still look like the auto-generated ones, so
                // user-customised splits aren't silently overwritten.
                const ms = workspace.milestones;
                const isDefaultSplit =
                  ms.length === 2 && !ms[0].paid && !ms[1].paid;
                if (isDefaultSplit) {
                  const advance = Math.round(price * 0.5);
                  const final = price - advance;
                  onPatchWorkspace({
                    total_price: v,
                    milestones: ms.map((m, i) =>
                      i === 0
                        ? { ...m, amount: advance }
                        : { ...m, amount: final },
                    ),
                  });
                } else {
                  onPatchWorkspace({ total_price: v });
                }
              }}
            />
          </Field>
          <Field label="Extra revision charge">
            <NumberInput
              value={workspace.extra_revision_charge}
              onCommit={(v) => onPatchWorkspace({ extra_revision_charge: v })}
            />
          </Field>
          <Field label="Monthly maintenance">
            <NumberInput
              value={workspace.monthly_maintenance_fee}
              onCommit={(v) => onPatchWorkspace({ monthly_maintenance_fee: v })}
            />
          </Field>
          <Field
            label="Advance paid"
            hint={
              workspace.milestones.length > 0
                ? "Auto-calculated from paid milestones"
                : undefined
            }
          >
            {workspace.milestones.length > 0 ? (
              <div
                className={
                  inputClass +
                  " text-muted-foreground select-none cursor-default"
                }
              >
                {fmt(client.advance_paid)}
              </div>
            ) : (
              <NumberInput
                value={client.advance_paid}
                onCommit={(v) => {
                  const advance = v ?? 0;
                  const total = workspace.total_price ?? client.final_price ?? 0;
                  const remaining = Math.max(0, total - advance);
                  onPatch({
                    advance_paid: advance,
                    remaining_amount: remaining,
                    payment_status:
                      advance <= 0
                        ? "Not Started"
                        : advance >= total && total > 0
                          ? "Fully Paid"
                          : "Partially Paid",
                  });
                }}
              />
            )}
          </Field>
          <Field label="Payment status">
            <SelectInput<PaymentStatus>
              value={client.payment_status}
              options={PAYMENT_STATUS_OPTIONS}
              onChange={(v) => onPatch({ payment_status: v })}
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 ${paymentStatusClasses(
              client.payment_status,
            )}`}
          >
            {client.payment_status}
          </span>
          <span className="rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-muted-foreground">
            Remaining {fmt(client.remaining_amount || 0)}
          </span>
        </div>
      </SectionCard>

      <SectionCard
        title="Pricing items"
        description="Auto-generated from project type and pages. Edit amounts and labels freely."
        Icon={Tag}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onPatchWorkspace({
                  pricing_items: autoPricingItems(
                    workspace.website_type,
                    workspace.pages_count,
                    workspace.support_days,
                  ),
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              Re-generate
            </button>
            <button
              type="button"
              onClick={() =>
                onPatchWorkspace({
                  pricing_items: [...workspace.pricing_items, newPricingItem()],
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent-glow transition-colors"
            >
              <Plus size={13} /> Add item
            </button>
          </div>
        }
      >
        {workspace.pricing_items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/20 p-6 text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              No line items yet. Auto-generate from project type and pages
              count.
            </p>
            <button
              type="button"
              onClick={() => {
                onPatchWorkspace({
                  pricing_items: autoPricingItems(
                    workspace.website_type,
                    workspace.pages_count,
                    workspace.support_days,
                  ),
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-glow transition-colors"
            >
              <Plus size={14} /> Auto-generate items
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {workspace.pricing_items.map((it) => (
              <li
                key={it.id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(120px,160px)_auto] items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2"
              >
                <input
                  value={it.label}
                  onChange={(e) => updateItem(it.id, { label: e.target.value })}
                  placeholder="Item label"
                  className="min-w-0 bg-transparent text-sm text-foreground outline-none"
                />
                <input
                  inputMode="decimal"
                  value={it.amount}
                  onChange={(e) =>
                    updateItem(it.id, { amount: Number(e.target.value) || 0 })
                  }
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-right text-sm text-foreground outline-none focus:border-accent/60"
                />
                <button
                  type="button"
                  onClick={() =>
                    onPatchWorkspace({
                      pricing_items: workspace.pricing_items.filter(
                        (x) => x.id !== it.id,
                      ),
                    })
                  }
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
            <li className="flex items-center justify-end gap-3 pt-1 text-sm">
              <span className="text-muted-foreground">Items subtotal</span>
              <span className="font-medium text-foreground">
                {fmt(itemsSubtotal)}
              </span>
            </li>
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Payment milestones"
        description="Auto-created as 50% advance + 50% final. Amounts recalculate with total price."
        Icon={CheckCircle2}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onPatchWorkspace({
                  milestones: defaultMilestones(totalPrice),
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              Reset 50/50
            </button>
            <button
              type="button"
              onClick={() =>
                onPatchWorkspace({
                  milestones: [...workspace.milestones, newMilestone()],
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent-glow transition-colors"
            >
              <Plus size={13} /> Add milestone
            </button>
          </div>
        }
      >
        {workspace.milestones.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/20 p-6 text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              No milestones yet. Auto-create a 50% advance + 50% final split.
            </p>
            <button
              type="button"
              onClick={() =>
                onPatchWorkspace({
                  milestones: defaultMilestones(totalPrice),
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-glow transition-colors"
            >
              <Plus size={14} /> Auto-create milestones
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {workspace.milestones.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-background/40 px-3 py-2"
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(120px,150px)_minmax(120px,150px)_auto] items-center gap-2">
                  <label className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-background hover:border-accent/60">
                    <input
                      type="checkbox"
                      checked={Boolean(m.paid)}
                      onChange={(e) =>
                        updateMilestone(
                          m.id,
                          e.target.checked
                            ? { paid: true }
                            : { paid: false, paid_via: null },
                        )
                      }
                      className="size-3.5 accent-[color:var(--accent)]"
                      aria-label="Mark milestone as paid"
                    />
                  </label>
                  <MilestoneTextInput
                    value={m.label}
                    onCommit={(v) => updateMilestone(m.id, { label: v ?? "" })}
                    placeholder="Milestone label (e.g. 50% on kickoff)"
                    className="min-w-0 bg-transparent text-sm text-foreground outline-none"
                  />
                  <input
                    type="date"
                    defaultValue={toDateInputValue(m.due ?? null)}
                    key={`due-${m.id}-${m.due ?? ""}`}
                    onBlur={(e) =>
                      updateMilestone(m.id, { due: e.target.value || null })
                    }
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent/60"
                  />
                  <MilestoneAmountInput
                    value={m.amount}
                    onCommit={(v) => updateMilestone(m.id, { amount: v ?? 0 })}
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-right text-sm text-foreground outline-none focus:border-accent/60"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onPatchWorkspace({
                        milestones: workspace.milestones.filter(
                          (x) => x.id !== m.id,
                        ),
                      })
                    }
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove milestone"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {m.paid ? (
                  <div className="flex flex-wrap items-center gap-2 pl-10">
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Paid via
                    </span>
                    <select
                      value={m.paid_via ?? ""}
                      onChange={(e) =>
                        updateMilestone(m.id, {
                          paid_via: e.target.value || null,
                        })
                      }
                      className={
                        "rounded-md border bg-background px-2 py-1 text-sm text-foreground outline-none " +
                        (m.paid_via ? "border-border" : "border-accent/60")
                      }
                    >
                      <option value="" disabled>
                        Select payment method…
                      </option>
                      {PAYMENT_METHOD_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {!m.paid_via ? (
                      <span className="text-[11px] text-accent">
                        Pick how the client paid — this is what shows on the
                        invoice instead of "How to Pay".
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
            <li className="flex items-center justify-end gap-3 pt-1 text-sm">
              <span className="text-muted-foreground">Milestones total</span>
              <span className="font-medium text-foreground">
                {fmt(milestonesTotal)}
              </span>
            </li>
          </ul>
        )}
      </SectionCard>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Documents                                                      */
/* ------------------------------------------------------------------ */

function DocumentsTab({
  docs,
  loading,
  client,
  workspace,
  onDocGenerated,
  onPatch,
}: {
  docs: ClientDocument[] | null;
  loading: boolean;
  client: Client;
  workspace: WorkspacePayload;
  onDocGenerated: (updated: ClientDocument) => void;
  onPatch: (patch: import("../types").ClientPatch) => void;
}) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [genErrors, setGenErrors] = useState<Partial<Record<string, string>>>(
    {},
  );

  // Warning dialog state
  const [warn, setWarn] = useState<{
    docType: DocumentType;
    missing: string[];
    invoiceType: "advance" | "final" | "unified";
  } | null>(null);

  function handleGenerateClick(
    docType: DocumentType,
    invoiceType: "advance" | "final" | "unified" = "advance",
  ) {
    const missing = getMissingFields(docType, client, workspace);
    if (missing.length > 0) {
      setWarn({ docType, missing, invoiceType });
    } else {
      void doGenerate(docType, invoiceType);
    }
  }

  async function doGenerate(
    docType: DocumentType,
    invoiceType: "advance" | "final" | "unified" = "advance",
  ) {
    setWarn(null);
    const cardKey =
      docType === "Invoice" ? `${docType}-${invoiceType}` : docType;
    setGenerating(cardKey);
    setGenErrors((prev) => ({ ...prev, [cardKey]: undefined }));
    try {
      const existingDocs = docs ?? [];
      await generateAndPrint(
        docType,
        client,
        workspace,
        existingDocs,
        invoiceType,
      );
      const generatedAt = new Date().toISOString();

      // Side-effect: stamp agreement_date on the client when first generating the Agreement
      if (docType === "Agreement" && !client.agreement_date) {
        onPatch({ agreement_date: new Date().toISOString().slice(0, 10) });
      }
      // Build metadata with stable ID so it persists for future generations
      const prefix =
        docType === "Proposal"
          ? "PRO"
          : docType === "Agreement"
            ? "AGR"
            : docType === "Invoice"
              ? "INV"
              : "HND";
      const existingMeta =
        existingDocs.find((d) => d.doc_type === docType)?.metadata ?? {};
      const idKey = `${prefix.toLowerCase()}_id`;
      const stableDocId =
        typeof existingMeta[idKey] === "string"
          ? (existingMeta[idKey] as string)
          : `${prefix}-${new Date().getFullYear()}-${client.id.replace(/-/g, "").slice(-6).toUpperCase()}`;
      const metadata = { ...existingMeta, [idKey]: stableDocId };
      const updated = await upsertDocument(
        client.id,
        docType,
        generatedAt,
        metadata,
        invoiceType !== "unified" ? invoiceType : undefined,
      );
      onDocGenerated(updated);
    } catch (err) {
      setGenErrors((prev) => ({
        ...prev,
        [cardKey]: err instanceof Error ? err.message : "Generation failed.",
      }));
    } finally {
      setGenerating(null);
    }
  }

  return (
    <>
      {/* ── Missing-fields warning dialog ───────────────────────────────── */}
      {warn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-1 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <span className="text-sm font-semibold text-foreground">
                Missing fields — {warn.docType}
              </span>
            </div>
            <p className="mb-3 text-[12px] text-muted-foreground">
              The following fields are empty. The PDF will have blank spots for
              them. Do you still want to generate?
            </p>
            <ul className="mb-4 space-y-1">
              {warn.missing.map((m) => (
                <li
                  key={m}
                  className="flex items-center gap-2 text-[12px] text-amber-300"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-amber-400" />
                  {m}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWarn(null)}
                className="flex-1 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/40 transition-colors"
              >
                Go back and fill them
              </button>
              <button
                type="button"
                onClick={() => void doGenerate(warn.docType, warn.invoiceType)}
                className="flex-1 rounded-xl bg-amber-500/20 border border-amber-500/30 px-3 py-2 text-xs font-medium text-amber-200 hover:bg-amber-500/30 transition-colors"
              >
                Generate anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionCard
        title="Documents"
        description="Generated artefacts for this engagement."
        Icon={FileText}
      >
        {loading || docs == null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Loading documents...
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {docs.map((doc) => {
              const generated = doc.status === "Generated";
              const cardKey =
                doc.doc_type === "Invoice" && doc.invoice_subtype
                  ? `${doc.doc_type}-${doc.invoice_subtype}`
                  : doc.doc_type;
              const isGenerating = generating === cardKey;
              const error = genErrors[cardKey as DocumentType];
              const missingCount = getMissingFields(
                doc.doc_type,
                client,
                workspace,
              ).length;
              const displayLabel =
                doc.doc_type === "Invoice" && doc.invoice_subtype
                  ? `Invoice (${doc.invoice_subtype.charAt(0).toUpperCase() + doc.invoice_subtype.slice(1)})`
                  : doc.doc_type;
              return (
                <li
                  key={doc.id}
                  className="rounded-2xl border border-border bg-background/40 p-4"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {displayLabel}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {generated && doc.generated_at
                          ? `Generated ${formatDateTime(doc.generated_at)}`
                          : "Not generated yet"}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        generated
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                          : "border-border bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  {/* Incomplete fields hint */}
                  {missingCount > 0 && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400/80">
                      <AlertTriangle size={11} />
                      {missingCount} field{missingCount > 1 ? "s" : ""} missing
                    </p>
                  )}

                  {doc.file_url ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                    >
                      Open file →
                    </a>
                  ) : null}

                  <div className="mt-3">
                    {error && (
                      <p className="mb-2 text-[11px] text-destructive">
                        {error}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handleGenerateClick(
                          doc.doc_type,
                          (doc.invoice_subtype as "advance" | "final") ??
                            "advance",
                        )
                      }
                      disabled={generating !== null}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/80 transition-colors disabled:opacity-60"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Opening
                          PDF…
                        </>
                      ) : (
                        <>
                          <Download size={12} />
                          {generated ? "Re-generate PDF" : "Generate PDF"}
                        </>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </>
  );
}
