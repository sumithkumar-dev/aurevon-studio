import proposalTemplate from "../../templates/proposal.html?raw";
import agreementTemplate from "../../templates/agreement.html?raw";
import invoiceTemplate from "../../templates/invoice.html?raw";
import handoverTemplate from "../../templates/handover.html?raw";
import { agency } from "../../config/agency.ts";
import { normalise } from "./documents";
import type { Client, ClientDocument, DocumentType } from "../types";
import type { WorkspacePayload, WorkspaceMilestone } from "./workspace";
import { suggestClientAction } from "./workspace";
import { getCurrencySymbol } from "./currency";

// ─── Validation ──────────────────────────────────────────────────────────────
//
// Each rule maps a human-readable label to a function that returns true when
// the field IS present (i.e. no warning needed).

type Rule = { label: string; ok: (c: Client, w: WorkspacePayload) => boolean };

const RULES: Record<DocumentType, Rule[]> = {
  Proposal: [
    { label: "Business name", ok: (c) => !!c.business_name?.trim() },
    {
      label: "Contact name",
      ok: (c) => !!(c.primary_contact_name ?? c.client_name)?.trim(),
    },
    {
      label: "Contact email",
      ok: (c) => !!(c.primary_contact_email ?? c.email)?.trim(),
    },
    {
      label: "Contact phone",
      ok: (c) => !!(c.primary_contact_phone ?? c.phone)?.trim(),
    },
    { label: "Project summary", ok: (_, w) => !!(w.summary ?? "").trim() },
    { label: "At least one goal", ok: (_, w) => w.goals.length > 0 },
    {
      label: "At least one deliverable",
      ok: (_, w) => w.deliverables.length > 0,
    },
    {
      label: "At least one timeline phase",
      ok: (_, w) => w.timeline.length > 0,
    },
    {
      label: "At least one pricing item",
      ok: (_, w) => w.pricing_items.length > 0,
    },
    { label: "Total price", ok: (c, w) => !!(w.total_price ?? c.final_price) },
    { label: "Project start date", ok: (c) => !!c.project_start_date?.trim() },
    {
      label: "Project launch date",
      ok: (c) => !!(c.project_end_date ?? c.delivery_date)?.trim(),
    },
  ],
  Agreement: [
    { label: "Business name", ok: (c) => !!c.business_name?.trim() },
    {
      label: "Contact name",
      ok: (c) => !!(c.primary_contact_name ?? c.client_name)?.trim(),
    },
    { label: "Client location", ok: (_, w) => !!w.location?.trim() },
    { label: "Project start date", ok: (c) => !!c.project_start_date?.trim() },
  ],
  Invoice: [
    { label: "Business name", ok: (c) => !!c.business_name?.trim() },
    {
      label: "Contact name",
      ok: (c) => !!(c.primary_contact_name ?? c.client_name)?.trim(),
    },
    {
      label: "Contact email",
      ok: (c) => !!(c.primary_contact_email ?? c.email)?.trim(),
    },
    {
      label: "Contact phone",
      ok: (c) => !!(c.primary_contact_phone ?? c.phone)?.trim(),
    },
    { label: "Client location", ok: (_, w) => !!w.location?.trim() },
    {
      label: "At least one milestone or pricing item",
      ok: (_, w) => w.milestones.length > 0 || w.pricing_items.length > 0,
    },
    { label: "Total price", ok: (c, w) => !!(w.total_price ?? c.final_price) },
  ],
  Handover: [
    { label: "Business name", ok: (c) => !!c.business_name?.trim() },
    {
      label: "Contact name",
      ok: (c) => !!(c.primary_contact_name ?? c.client_name)?.trim(),
    },
    { label: "Project summary", ok: (_, w) => !!(w.summary ?? "").trim() },
    {
      label: "Project launch date",
      ok: (c) => !!(c.project_end_date ?? c.delivery_date)?.trim(),
    },
    {
      label: "At least one deliverable",
      ok: (_, w) => w.deliverables.length > 0,
    },
    { label: "Website URL", ok: (c) => !!c.business_website?.trim() },
    { label: "Domain provider", ok: (_, w) => !!w.domain_provider?.trim() },
    { label: "Hosting provider", ok: (_, w) => !!w.hosting_provider?.trim() },
  ],
};

/** Returns a list of missing field labels. Empty array = all good. */
export function getMissingFields(
  docType: DocumentType,
  client: Client,
  workspace: WorkspacePayload,
): string[] {
  return RULES[docType]
    .filter((r) => !r.ok(client, workspace))
    .map((r) => r.label);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s: unknown): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(v: number | null | undefined): string {
  if (v == null) return "—";
  return v.toLocaleString("en-IN");
}

function today(): string {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dueDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats a stored ISO date string ("YYYY-MM-DD") into a client-readable
 * format ("19 Jun 2026"). Returns an empty string for null/undefined/invalid
 * inputs so template rendering gracefully shows nothing rather than "Invalid Date".
 * All document builders must route stored dates through this function — never
 * pass raw ISO strings into templates directly.
 */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  // Accept both "YYYY-MM-DD" and full ISO timestamp strings.
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Calculates a human-readable duration string from two ISO date strings.
 * Returns values like "3 Days", "1 Week", "2 Weeks", "3–4 Weeks".
 * Falls back to the raw start–end string if dates are invalid, so nothing
 * is ever blank in the PDF.
 */
function timelineDuration(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start || !end) return "";
  const s = new Date(start.includes("T") ? start : start + "T00:00:00");
  const e = new Date(end.includes("T") ? end : end + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";
  const diffDays = Math.round(
    (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "1 Day";
  if (diffDays === 1) return "1 Day";
  if (diffDays < 7) return `${diffDays} Days`;
  const weeks = diffDays / 7;
  if (weeks <= 1) return "1 Week";
  if (weeks <= 1.5) return "1–2 Weeks";
  if (weeks <= 2) return "2 Weeks";
  if (weeks <= 2.5) return "2–3 Weeks";
  if (weeks <= 3) return "3 Weeks";
  if (weeks <= 3.5) return "3–4 Weeks";
  if (weeks <= 4) return "4 Weeks";
  const months = Math.round(weeks / 4.33);
  return months <= 1 ? "1 Month" : `${months} Months`;
}

// for a single-agency CRM with hundreds of clients, not thousands.
function generateInvoiceNumber(clientId: string, prefix = "INV"): string {
  const hash = clientId.replace(/-/g, "").slice(-6).toUpperCase();

  return `${prefix}-${new Date().getFullYear()}-${hash}`;
}

/** Read a persisted doc ID from metadata, or create a stable one and return it. */
export function getOrCreateDocId(
  prefix: string,
  clientId: string,
  existingMetadata: Record<string, unknown>,
): string {
  const key = `${prefix.toLowerCase()}_id`;
  if (
    typeof existingMetadata[key] === "string" &&
    (existingMetadata[key] as string).length > 0
  ) {
    return existingMetadata[key] as string;
  }
  return generateInvoiceNumber(clientId, prefix);
}

// ─── Mini Handlebars Renderer ─────────────────────────────────────────────────

type Ctx = Record<string, unknown>;

function resolve(path: string, stack: Ctx[]): unknown {
  let depth = 0;
  let p = path.trim();
  while (p.startsWith("../")) {
    depth++;
    p = p.slice(3);
  }
  const ctx = stack[Math.max(0, stack.length - 1 - depth)];
  if (!ctx) return undefined;
  if (p === "this") return ctx[""] ?? ctx;
  const parts = p.startsWith("this.") ? p.slice(5).split(".") : p.split(".");
  let v: unknown = ctx;
  for (const k of parts) {
    if (v == null || typeof v !== "object") return undefined;
    v = (v as Ctx)[k];
  }
  return v;
}

function truthy(v: unknown): boolean {
  if (v == null || v === false || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// The renderer works in two passes: tokenize() turns the raw template into a
// flat stream of tags/text, then parseNodes() consumes that stream into a
// tree, matching each {{#each}}/{{#if}} to its *own* closing tag by walking
// the token stream in order (rather than regex-searching the whole template
// for the nearest "{{/each}}", which is what broke previously — a regex scan
// has no concept of nesting depth, so an inner block's closing tag would get
// matched as the outer block's closing tag whenever blocks were nested, e.g.
// {{#each scope.deliverables}} ... {{#if this.items}}{{#each this.items}} ...
// {{/each}}{{/if}} ... {{/each}}). Walking tokens with a cursor lets each
// open tag correctly find its matching close tag at any nesting depth.

type Token =
  | { kind: "text"; value: string }
  | { kind: "var"; path: string }
  | { kind: "open-each"; path: string }
  | { kind: "open-if"; path: string }
  | { kind: "else" }
  | { kind: "close-each" }
  | { kind: "close-if" };

type Node =
  | { kind: "text"; value: string }
  | { kind: "var"; path: string }
  | { kind: "each"; path: string; body: Node[] }
  | { kind: "if"; path: string; body: Node[]; elseBody: Node[] | null };

function tokenize(tpl: string): Token[] {
  const tokens: Token[] = [];
  const tagRe =
    /\{\{(#each\s+[^}]+|#if\s+[^}]+|else|\/each|\/if|[^#/][^}]*)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(tpl))) {
    if (m.index > last)
      tokens.push({ kind: "text", value: tpl.slice(last, m.index) });
    const raw = m[1];
    if (raw.startsWith("#each")) {
      tokens.push({ kind: "open-each", path: raw.slice(5).trim() });
    } else if (raw.startsWith("#if")) {
      tokens.push({ kind: "open-if", path: raw.slice(3).trim() });
    } else if (raw === "else") {
      tokens.push({ kind: "else" });
    } else if (raw === "/each") {
      tokens.push({ kind: "close-each" });
    } else if (raw === "/if") {
      tokens.push({ kind: "close-if" });
    } else {
      tokens.push({ kind: "var", path: raw.trim() });
    }
    last = tagRe.lastIndex;
  }
  if (last < tpl.length) tokens.push({ kind: "text", value: tpl.slice(last) });
  return tokens;
}

/** Consume tokens (via the shared cursor) into a node list, stopping at any
 * token kind named in `stopAt` (left unconsumed so the caller can inspect it). */
function parseNodes(
  tokens: Token[],
  cursor: { i: number },
  stopAt: Token["kind"][],
): Node[] {
  const nodes: Node[] = [];
  while (cursor.i < tokens.length && !stopAt.includes(tokens[cursor.i].kind)) {
    const tok = tokens[cursor.i++];
    if (tok.kind === "text") {
      nodes.push(tok);
    } else if (tok.kind === "var") {
      nodes.push(tok);
    } else if (tok.kind === "open-each") {
      const body = parseNodes(tokens, cursor, ["close-each"]);
      cursor.i++; // consume matching {{/each}}
      nodes.push({ kind: "each", path: tok.path, body });
    } else if (tok.kind === "open-if") {
      const body = parseNodes(tokens, cursor, ["else", "close-if"]);
      let elseBody: Node[] | null = null;
      if (tokens[cursor.i]?.kind === "else") {
        cursor.i++; // consume {{else}}
        elseBody = parseNodes(tokens, cursor, ["close-if"]);
      }
      cursor.i++; // consume matching {{/if}}
      nodes.push({ kind: "if", path: tok.path, body, elseBody });
    }
    // Stray close tags with no matching open are ignored rather than
    // emitted literally — better to drop a stray tag than leak it into
    // the rendered document.
  }
  return nodes;
}

function parseTemplate(tpl: string): Node[] {
  const cursor = { i: 0 };
  return parseNodes(tokenize(tpl), cursor, []);
}

function renderNodes(nodes: Node[], stack: Ctx[]): string {
  let out = "";
  for (const node of nodes) {
    if (node.kind === "text") {
      out += node.value;
    } else if (node.kind === "var") {
      if (node.path === "this") {
        const ctx = stack[stack.length - 1];
        out += esc(ctx?.[""] ?? ctx);
      } else {
        out += esc(resolve(node.path, stack));
      }
    } else if (node.kind === "each") {
      const arr = resolve(node.path, stack);
      if (Array.isArray(arr) && arr.length) {
        for (const item of arr) {
          const itemCtx: Ctx =
            item != null && typeof item === "object"
              ? (item as Ctx)
              : { "": item };
          out += renderNodes(node.body, [...stack, itemCtx]);
        }
      }
    } else if (node.kind === "if") {
      const ok = truthy(resolve(node.path, stack));
      if (ok) out += renderNodes(node.body, stack);
      else if (node.elseBody) out += renderNodes(node.elseBody, stack);
    }
  }
  return out;
}

function render(tpl: string, stack: Ctx[]): string {
  return renderNodes(parseTemplate(tpl), stack);
}

// ─── Data builders ────────────────────────────────────────────────────────────

function sharedBase(client: Client, workspace: WorkspacePayload) {
  return {
    agency: {
      name: agency.name,
      title: agency.title,
      tagline: agency.tagline,
      contact: {
        name: agency.owner_name,
        phone: agency.contact.phone,
        email: agency.contact.email,
        location: agency.contact.location,
      },
      social: {
        instagram: agency.social.instagram,
        instagram_url: `https://instagram.com/${agency.social.instagram.replace(/^@/, "")}`,
      },
    },
    client: {
      business_name: client.business_name ?? "",
      business_name_slug: (client.business_name ?? "client")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, ""),
      industry: client.industry ?? "",
      contact_name: client.primary_contact_name ?? client.client_name ?? "",
      contact_title: workspace.contact_title ?? "",
      email: client.primary_contact_email ?? client.email ?? "",
      phone: client.primary_contact_phone ?? client.phone ?? "",
      location: workspace.location ?? "",
    },
    // Shared business-policy variables, sourced from config/agency.ts so
    // every document (Proposal, Agreement, Invoice) always quotes the same
    // numbers. Previously each document hardcoded its own copies of these,
    // which had drifted out of sync with each other.
    terms: {
      payment_days: agency.legal.payment_terms_days,
      late_payment_days: agency.legal.late_payment_grace_days,
      payment_methods: agency.legal.payment_methods,
      payment_methods_label: agency.legal.payment_methods.join(" & "),
      proposal_valid_days: agency.legal.proposal_valid_days,
      governing_law: agency.legal.governing_law,
      response_days: agency.legal.client_response_days,
      reengagement_hold_days: agency.legal.reengagement_hold_days,
      termination_notice_days: agency.legal.termination_notice_days,
      cure_period_days: agency.legal.cure_period_days,
      confidentiality_years: agency.legal.confidentiality_years,
      refund_processing_days: agency.legal.refund_processing_days,
    },
    meta: {
      date_iso: new Date().toISOString().slice(0, 10),
    },
  };
}

/**
 * Estimated total project duration shown in the proposal header.
 *
 * This used to be hardcoded as `timeline.length * 2 weeks` — a placeholder
 * that had nothing to do with the actual dates on each phase, so editing
 * the real timeline (changing phase dates, adding/removing phases) never
 * changed the number shown to the client. It's now computed from real
 * dates: the client's own project start/launch dates if set (the same
 * dates already shown just above as project.start_date / project.launch_date),
 * otherwise the earliest phase start to the latest phase end across the
 * Timeline tab, so it always reflects whatever timeline is actually on the
 * document.
 */
function estimatedTotalTime(client: Client, workspace: WorkspacePayload): string {
  const explicitStart = client.project_start_date;
  const explicitEnd = client.project_end_date ?? client.delivery_date;
  if (explicitStart && explicitEnd) {
    const duration = timelineDuration(explicitStart, explicitEnd);
    if (duration) return duration;
  }

  const phaseDates = workspace.timeline
    .flatMap((t) => [t.start, t.end])
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d.includes("T") ? d : `${d}T00:00:00`))
    .filter((d) => !isNaN(d.getTime()));

  if (phaseDates.length >= 2) {
    const earliest = new Date(Math.min(...phaseDates.map((d) => d.getTime())));
    const latest = new Date(Math.max(...phaseDates.map((d) => d.getTime())));
    const duration = timelineDuration(
      earliest.toISOString().slice(0, 10),
      latest.toISOString().slice(0, 10),
    );
    if (duration) return duration;
  }

  return "To be confirmed";
}

function buildProposalData(
  client: Client,
  workspace: WorkspacePayload,
  proposalId: string,
) {
  const base = sharedBase(client, workspace);
  const total = workspace.total_price ?? client.final_price ?? null;
  return {
    ...base,
    project: {
      understanding: {
        summary: workspace.summary ?? client.project_description ?? "",
        challenge: workspace.primary_challenge ?? "",
        goals: workspace.goals,
      },
      pages_count: workspace.pages_count ?? "",
      revision_rounds: client.revision_count ?? 0,
      support_days: workspace.support_days ?? "",
      start_date: formatDate(client.project_start_date),
      launch_date: formatDate(client.project_end_date ?? client.delivery_date),
      assumptions: [] as string[],
      has_scope_content:
        workspace.deliverables.length > 0 ||
        workspace.exclusions.length > 0 ||
        workspace.timeline.length > 0,
    },
    scope: {
      deliverables: workspace.deliverables.map((d) => ({
        icon: "⬡",
        title: d
          .replace("{{pages_count}}", String(workspace.pages_count ?? ""))
          .replace(
            "{{project.pages_count}}",
            String(workspace.pages_count ?? ""),
          ),
        items: [] as string[],
      })),
      exclusions: workspace.exclusions,
    },
    process: {
      steps: [
        {
          title: "Discovery",
          description: "Requirements gathering",
          active: true,
        },
        {
          title: "Design",
          description: "Wireframes and mockups",
          active: false,
        },
        { title: "Development", description: "Website build", active: false },
        { title: "Launch", description: "Deployment & Go live", active: false },
      ],
    },
    timeline: workspace.timeline.map((t) => ({
      phase: t.phase,
      duration: timelineDuration(t.start, t.end),
      description: t.notes ?? "",
      client_action: t.client_action ?? suggestClientAction(t.phase),
    })),
    pricing: {
      currency: getCurrencySymbol(workspace.currency),
      total: fmt(total),
      extra_revision_charge: fmt(workspace.extra_revision_charge),
      payment_methods: agency.legal.payment_methods.join(" & "),
      payment_terms_days: agency.legal.payment_terms_days,
      late_payment_days: agency.legal.late_payment_grace_days,
      items: workspace.pricing_items.map((it) => ({
        name: it.label,
        description: it.description ?? "",
        frequency: it.frequency ?? "One-Time",
        price: fmt(it.amount),
        highlight: it.highlight ?? false,
      })),
      payments: workspace.milestones.map((m, idx) => {
        const base2 = total && total > 0 ? total : 1;
        return {
          phase: m.label,
          percent: Math.round((m.amount / base2) * 100),
          when: m.due ? `Due ${m.due}` : "",
          highlight: idx === workspace.milestones.length - 1,
        };
      }),
    },
    proposal: {
      id: proposalId,
      date: today(),
      date_iso: new Date().toISOString().slice(0, 10),
      validity_days: agency.legal.proposal_valid_days,
      estimated_total_time: estimatedTotalTime(client, workspace),
      next_steps: [
        {
          title: "Review & Approve",
          description: "Look over the deliverables, scope, and timeline.",
        },
        {
          title: "Sign the Agreement",
          description:
            "We will send a brief digital agreement to formalise our partnership.",
        },
        {
          title: "Submit Advance",
          description: "Process the initial deposit to secure your spot.",
        },
        {
          title: "Project Kickoff",
          description:
            "We'll send an onboarding checklist to collect your content.",
        },
      ],
    },
  };
}

function buildAgreementData(
  client: Client,
  workspace: WorkspacePayload,
  agreementId: string,
  proposalId: string,
) {
  const base = sharedBase(client, workspace);
  return {
    ...base,
    agreement: {
      id: agreementId,
      date: today(),
      date_iso: new Date().toISOString().slice(0, 10),
      proposal_id: proposalId,
    },
    project: {
      start_date: formatDate(client.project_start_date),
      launch_date: formatDate(client.project_end_date ?? client.delivery_date),
      pages_count: workspace.pages_count ?? "",
      revision_rounds: client.revision_count ?? 0,
      support_days: workspace.support_days ?? "",
    },
  };
}

function buildInvoiceData(
  client: Client,
  workspace: WorkspacePayload,
  invoiceId: string,
  proposalId: string,
  agreementId: string,
  invoiceType: "advance" | "final" | "unified" = "advance",
) {
  const base = sharedBase(client, workspace);
  const total = workspace.total_price ?? client.final_price ?? null;
  const allMilestones = workspace.milestones;

  let items: WorkspaceMilestone[];
  let invoiceLabel: string;

  if (invoiceType === "advance") {
    // Only the first milestone
    items = allMilestones.length > 0 ? [allMilestones[0]] : [];
    invoiceLabel = "advance payment";
  } else if (invoiceType === "final") {
    // All milestones except the first
    items = allMilestones.length > 1 ? allMilestones.slice(1) : allMilestones;
    invoiceLabel = "final payment";
  } else {
    // All unpaid milestones (or all if none marked paid)
    items = allMilestones.filter((m) => !m.paid);
    if (!items.length) items = allMilestones;
    invoiceLabel = "project invoice";
  }

  // If no milestones at all, fall back to pricing items
  const lineItems =
    items.length > 0
      ? items.map((m) => ({ name: m.label, price: fmt(m.amount) }))
      : workspace.pricing_items.map((it) => ({
          name: it.label,
          price: fmt(it.amount),
        }));

  // Subtotal = sum of the items actually shown (not a hardcoded first-item only)
  const subtotalAmount =
    items.length > 0
      ? items.reduce((s, m) => s + m.amount, 0)
      : workspace.pricing_items.reduce((s, it) => s + it.amount, 0);

  // Remaining = total minus what's shown in this invoice
  const shownAmount = subtotalAmount;
  const remaining = total != null ? total - shownAmount : null;

  // Payment status → dynamic badge. Prefer the per-item milestone state
  // (more precise — these are the specific line items this invoice covers)
  // and fall back to the client-level payment_status dropdown for invoices
  // built straight from pricing_items (no milestones at all).
  const itemsAllPaid = items.length > 0 && items.every((m) => m.paid);
  const isPaid =
    itemsAllPaid ||
    client.payment_status === "Fully Paid" ||
    (invoiceType === "advance" && client.payment_status === "Advance Paid");
  const statusLabel = isPaid ? "Paid" : "Pending";
  const statusClass = isPaid ? "paid" : "pending";

  // How the client actually paid, so a paid invoice can say "Paid via UPI"
  // instead of repeating "How to Pay" instructions they no longer need.
  const paidVia =
    items.find((m) => m.paid && m.paid_via)?.paid_via ??
    allMilestones.find((m) => m.paid && m.paid_via)?.paid_via ??
    null;

  // Context copy is fully derived from invoiceType — never hardcoded in the
  // template — so an advance invoice and a final invoice never share wording
  // that only makes sense for one of them.
  const contextHeading =
    invoiceType === "advance"
      ? "Advance Payment"
      : invoiceType === "final"
        ? "Final Payment"
        : "Payment Due";
  const contextText =
    invoiceType === "advance"
      ? "This invoice covers the advance payment required before project commencement. Work begins only after this payment is received and confirmed."
      : invoiceType === "final"
        ? "This invoice covers the remaining balance due upon project completion."
        : "This invoice covers the total amount due for this engagement.";

  return {
    ...base,
    invoice: {
      id: invoiceId,
      date: today(),
      date_iso: new Date().toISOString().slice(0, 10),
      due_date: dueDate(agency.legal.payment_terms_days),
      proposal_id: proposalId,
      agreement_id: agreementId,
      currency: getCurrencySymbol(workspace.currency),
      project_name: client.project_name ?? "Website Design & Development",
      start_date: formatDate(client.project_start_date),
      advance_label: invoiceLabel,
      context_heading: contextHeading,
      context_text: contextText,
      is_advance: invoiceType === "advance",
      is_final: invoiceType === "final",
      subtotal: fmt(subtotalAmount),
      total: fmt(subtotalAmount),
      remaining: remaining != null && remaining > 0 ? fmt(remaining) : "—",
      items: lineItems,
      status_label: statusLabel,
      status_class: statusClass,
      is_paid: isPaid,
      paid_via: paidVia,
    },
  };
}

function buildHandoverData(
  client: Client,
  workspace: WorkspacePayload,
  agreementId: string,
) {
  const base = sharedBase(client, workspace);
  const pricingItems = workspace.pricing_items.map((it) => ({
    name: it.label,
    description: it.description ?? "",
    frequency: it.frequency ?? "One-Time",
    price: fmt(it.amount),
    highlight: it.highlight ?? false,
  }));
  return {
    ...base,
    meta: {
      date_iso: new Date().toISOString().slice(0, 10),
    },
    project: {
      understanding: {
        summary: workspace.summary ?? client.project_description ?? "",
      },
      launch_date: formatDate(client.project_end_date ?? client.delivery_date),
    },
    pricing: {
      currency: getCurrencySymbol(workspace.currency),
      has_maintenance: pricingItems.some((it) => it.highlight),
      items: pricingItems,
    },
    handover: {
      domain_provider: workspace.domain_provider ?? "",
      hosting_provider: workspace.hosting_provider ?? "",
      website_url: client.business_website ?? "",
      support_period: workspace.support_days
        ? `${workspace.support_days} days`
        : "",
      assets_delivered: workspace.deliverables,
    },
    agreement: {
      number: agreementId,
      project_scope: client.project_name ?? "",
    },
  };
}

// ─── Template & data selector ────────────────────────────────────────────────

const TEMPLATES: Record<DocumentType, string> = {
  Proposal: proposalTemplate,
  Agreement: agreementTemplate,
  Invoice: invoiceTemplate,
  Handover: handoverTemplate,
};

function buildData(
  docType: DocumentType,
  client: Client,
  workspace: WorkspacePayload,
  existingDocs: ClientDocument[],
  invoiceType: "advance" | "final" | "unified" = "advance",
): Record<string, unknown> {
  // Resolve stable IDs from persisted metadata, or create new stable ones
  const proposalMeta =
    existingDocs.find((d) => d.doc_type === "Proposal")?.metadata ?? {};
  const agreementMeta =
    existingDocs.find((d) => d.doc_type === "Agreement")?.metadata ?? {};
  const invoiceMeta =
    existingDocs.find((d) => d.doc_type === "Invoice")?.metadata ?? {};

  const proposalId = getOrCreateDocId("PRO", client.id, proposalMeta);
  const agreementId = getOrCreateDocId("AGR", client.id, agreementMeta);
  const invoiceId = getOrCreateDocId("INV", client.id, invoiceMeta);

  switch (docType) {
    case "Proposal":
      return buildProposalData(client, workspace, proposalId) as Record<
        string,
        unknown
      >;
    case "Agreement":
      return buildAgreementData(
        client,
        workspace,
        agreementId,
        proposalId,
      ) as Record<string, unknown>;
    case "Invoice":
      return buildInvoiceData(
        client,
        workspace,
        invoiceId,
        proposalId,
        agreementId,
        invoiceType,
      ) as Record<string, unknown>;
    case "Handover":
      return buildHandoverData(client, workspace, agreementId) as Record<
        string,
        unknown
      >;
  }
}

// ─── PDF via window.print() ──────────────────────────────────────────────────
//
// Architecture:
//   Handlebars HTML template
//     → rendered HTML string (built here, in-browser)
//     → Blob URL opened in a new tab
//     → tab auto-calls window.print() via the __aurevonPrint flag
//     → user's browser renders and saves the PDF
//     → tab closes itself after the print dialog is dismissed
//
// No server required. The user's own browser does all rendering.

/**
 * Renders the document template to HTML, opens it in a new browser tab,
 * and auto-triggers window.print() so the user can save it as PDF.
 *
 * The tab closes itself automatically after the print dialog is dismissed.
 */
export async function generateAndPrint(
  docType: DocumentType,
  client: Client,
  workspace: WorkspacePayload,
  existingDocs: ClientDocument[] = [],
  invoiceType: "advance" | "final" | "unified" = "advance",
): Promise<void> {
  // 1. Build the data context and render to HTML (entirely in-browser).
  const data = buildData(docType, client, workspace, existingDocs, invoiceType);
  const html = render(TEMPLATES[docType], [data as Ctx]);

  // 2. Inject the __aurevonPrint flag so the template's auto-print script fires.
  //    We splice it in just before </head> so it runs before any other scripts.
  const htmlWithFlag = html.replace(
    "</head>",
    "<script>window.__aurevonPrint = true;<\/script></head>",
  );

  // 3. Create a Blob URL and open it in a new tab. The tab's auto-print script
  //    calls window.print() after fonts load, then window.close() after printing.
  const blob = new Blob([htmlWithFlag], { type: "text/html; charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const tab = window.open(url, "_blank");

  // Revoke the Blob URL once the tab has loaded (2 s is ample for local blobs).
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  if (!tab) {
    throw new Error(
      "Could not open a new tab. Please allow pop-ups for this site and try again.",
    );
  }
}
