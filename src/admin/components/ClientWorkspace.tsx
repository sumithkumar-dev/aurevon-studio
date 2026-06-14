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
  FileText,
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
  PaymentStatus,
  ProjectStatus,
} from "../types";
import {
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
import { fetchClientDocuments } from "../lib/documents";
import {
  emptyWorkspace,
  newMilestone,
  newPricingItem,
  newTimelineEntry,
  parseWorkspace,
  serializeWorkspace,
  type WorkspaceMilestone,
  type WorkspacePayload,
  type WorkspacePricingItem,
  type WorkspaceTimelineEntry,
} from "../lib/workspace";

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
  const initial = type === "date" ? toDateInputValue(value ?? null) : value ?? "";
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

/* ------------------------------------------------------------------ */
/* List editor (Goals / Deliverables / Exclusions)                     */
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

const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
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
  const [workspace, setWorkspace] = useState<WorkspacePayload>(() =>
    parseWorkspace(client.terms_notes),
  );
  useEffect(() => {
    setWorkspace(parseWorkspace(client.terms_notes));
  }, [client.id, client.terms_notes]);
  // Save status indicator (Saving / Saved / Error) for edits made in this workspace.
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
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

  function patchWorkspace(partial: Partial<WorkspacePayload>) {
    const next = { ...workspace, ...partial };
    setWorkspace(next);
    handlePatch({ terms_notes: serializeWorkspace(next) });
  }

  // Pricing totals.
  const itemsSubtotal = useMemo(
    () => workspace.pricing_items.reduce((sum, it) => sum + (it.amount || 0), 0),
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
                <ArrowLeft size={13} /> <span className="hidden sm:inline">Back</span>
              </button>
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
                <Briefcase size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Client workspace
                </div>
                <h1 className="truncate text-lg font-medium text-foreground md:text-xl">
                  {client.business_name || client.client_name || "Untitled client"}
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
                <Trash2 size={13} /> <span className="hidden sm:inline">Delete</span>
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
            <span>{saveError ?? "Save failed. Your change may not have been saved."}</span>
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
            <TimelineTab workspace={workspace} onPatchWorkspace={patchWorkspace} />
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
            <DocumentsTab docs={docs} loading={docsLoading} />
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
              onPatch({ primary_contact_name: v, client_name: v ?? client.client_name })
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
        <Field label="Email">
          <TextInput
            type="email"
            value={client.primary_contact_email ?? client.email}
            onCommit={(v) =>
              onPatch({ primary_contact_email: v, email: v ?? client.email })
            }
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
        <Field label="Business email">
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
          <Field label="Summary">
            <TextArea
              value={workspace.summary ?? client.project_description}
              onCommit={(v) => {
                onPatchWorkspace({ summary: v });
                onPatch({ project_description: v });
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
        description="Outcomes the project must achieve."
        Icon={CheckCircle2}
      >
        <ListEditor
          items={workspace.goals}
          onChange={(goals) => onPatchWorkspace({ goals })}
          placeholder="e.g. Launch a credible online presence"
          addLabel="Add goal"
        />
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
        description="Tangible items included in this engagement."
        Icon={ListChecks}
      >
        <ListEditor
          items={workspace.deliverables}
          onChange={(deliverables) => onPatchWorkspace({ deliverables })}
          placeholder="e.g. Responsive 6-page website"
          addLabel="Add deliverable"
        />
      </SectionCard>

      <SectionCard
        title="Exclusions"
        description="Out-of-scope items to set clear expectations."
        Icon={X}
      >
        <ListEditor
          items={workspace.exclusions}
          onChange={(exclusions) => onPatchWorkspace({ exclusions })}
          placeholder="e.g. Copywriting in regional languages"
          addLabel="Add exclusion"
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
      description="Phases, milestones and target dates."
      Icon={CalendarClock}
      actions={
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
      }
    >
      {workspace.timeline.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No phases yet. Add the first phase to start building the timeline.
        </p>
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
                    onChange={(e) => update(entry.id, { phase: e.target.value })}
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
              <div className="mt-3">
                <Field label="Notes">
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
  const currency = workspace.currency ?? "INR";
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

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

  return (
    <>
      <SectionCard title="Pricing" Icon={CircleDollarSign}>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Currency">
            <SelectInput<string>
              value={currency}
              options={["INR", "USD", "EUR", "GBP", "AED"] as const}
              onChange={(v) => onPatchWorkspace({ currency: v })}
            />
          </Field>
          <Field label="Total price">
            <NumberInput
              value={workspace.total_price ?? client.final_price}
              onCommit={(v) => {
                onPatchWorkspace({ total_price: v });
                onPatch({ final_price: v });
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
          <Field label="Advance paid">
            <NumberInput
              value={client.advance_paid}
              onCommit={(v) => onPatch({ advance_paid: v ?? 0 })}
            />
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
        Icon={Tag}
        actions={
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
        }
      >
        {workspace.pricing_items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No line items yet.</p>
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
              <span className="font-medium text-foreground">{fmt(itemsSubtotal)}</span>
            </li>
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Payment milestones"
        Icon={CheckCircle2}
        actions={
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
        }
      >
        {workspace.milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Break the total into milestones to track collection.
          </p>
        ) : (
          <ul className="space-y-2">
            {workspace.milestones.map((m) => (
              <li
                key={m.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_minmax(120px,150px)_minmax(120px,150px)_auto] items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2"
              >
                <label className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-background hover:border-accent/60">
                  <input
                    type="checkbox"
                    checked={Boolean(m.paid)}
                    onChange={(e) => updateMilestone(m.id, { paid: e.target.checked })}
                    className="size-3.5 accent-[color:var(--accent)]"
                    aria-label="Mark milestone as paid"
                  />
                </label>
                <input
                  value={m.label}
                  onChange={(e) => updateMilestone(m.id, { label: e.target.value })}
                  placeholder="Milestone label (e.g. 50% on kickoff)"
                  className="min-w-0 bg-transparent text-sm text-foreground outline-none"
                />
                <input
                  type="date"
                  value={toDateInputValue(m.due ?? null)}
                  onChange={(e) => updateMilestone(m.id, { due: e.target.value || null })}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent/60"
                />
                <input
                  inputMode="decimal"
                  value={m.amount}
                  onChange={(e) =>
                    updateMilestone(m.id, { amount: Number(e.target.value) || 0 })
                  }
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-right text-sm text-foreground outline-none focus:border-accent/60"
                />
                <button
                  type="button"
                  onClick={() =>
                    onPatchWorkspace({
                      milestones: workspace.milestones.filter((x) => x.id !== m.id),
                    })
                  }
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove milestone"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
            <li className="flex items-center justify-end gap-3 pt-1 text-sm">
              <span className="text-muted-foreground">Milestones total</span>
              <span className="font-medium text-foreground">{fmt(milestonesTotal)}</span>
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
}: {
  docs: ClientDocument[] | null;
  loading: boolean;
}) {
  return (
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
            return (
              <li
                key={doc.id}
                className="rounded-2xl border border-border bg-background/40 p-4"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {doc.doc_type}
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
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
