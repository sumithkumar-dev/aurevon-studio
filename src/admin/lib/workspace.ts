// Helpers for the extended Client Workspace payload that is persisted as JSON
// inside the existing `clients.terms_notes` column. No schema changes required:
// the workspace owns this column from now on, and any pre-existing plain text
// is preserved as `legacy_notes` so it stays visible/editable in the UI.

export type WorkspaceTimelineEntry = {
  id: string;
  phase: string;
  start?: string | null;
  end?: string | null;
  notes?: string | null;
};

export type WorkspacePricingItem = {
  id: string;
  label: string;
  amount: number;
};

export type WorkspaceMilestone = {
  id: string;
  label: string;
  due?: string | null;
  amount: number;
  paid?: boolean;
};

export type WorkspacePayload = {
  contact_title: string | null;
  location: string | null;
  website_type: string | null;
  pages_count: number | null;
  support_days: number | null;
  summary: string | null;
  primary_challenge: string | null;
  goals: string[];
  deliverables: string[];
  exclusions: string[];
  timeline: WorkspaceTimelineEntry[];
  pricing_items: WorkspacePricingItem[];
  milestones: WorkspaceMilestone[];
  currency: string | null;
  total_price: number | null;
  extra_revision_charge: number | null;
  monthly_maintenance_fee: number | null;
  legacy_notes: string | null;
};

const WORKSPACE_TAG = "__workspace";

export function emptyWorkspace(): WorkspacePayload {
  return {
    contact_title: null,
    location: null,
    website_type: null,
    pages_count: null,
    support_days: null,
    summary: null,
    primary_challenge: null,
    goals: [],
    deliverables: [],
    exclusions: [],
    timeline: [],
    pricing_items: [],
    milestones: [],
    currency: "INR",
    total_price: null,
    extra_revision_charge: null,
    monthly_maintenance_fee: null,
    legacy_notes: null,
  };
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function ensureId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function normaliseTimeline(v: unknown): WorkspaceTimelineEntry[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((raw): WorkspaceTimelineEntry | null => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as Record<string, unknown>;
      const phase = str(r.phase);
      if (!phase && !r.start && !r.end && !r.notes) return null;
      return {
        id: typeof r.id === "string" ? r.id : ensureId("tl"),
        phase: phase ?? "",
        start: str(r.start),
        end: str(r.end),
        notes: str(r.notes),
      };
    })
    .filter(Boolean) as WorkspaceTimelineEntry[];
}

function normalisePricing(v: unknown): WorkspacePricingItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((raw): WorkspacePricingItem | null => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as Record<string, unknown>;
      const label = str(r.label);
      const amount = num(r.amount) ?? 0;
      if (!label && amount === 0) return null;
      return {
        id: typeof r.id === "string" ? r.id : ensureId("pi"),
        label: label ?? "",
        amount,
      };
    })
    .filter(Boolean) as WorkspacePricingItem[];
}

function normaliseMilestones(v: unknown): WorkspaceMilestone[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((raw): WorkspaceMilestone | null => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as Record<string, unknown>;
      const label = str(r.label);
      const amount = num(r.amount) ?? 0;
      if (!label && amount === 0 && !r.due) return null;
      return {
        id: typeof r.id === "string" ? r.id : ensureId("ms"),
        label: label ?? "",
        due: str(r.due),
        amount,
        paid: Boolean(r.paid),
      };
    })
    .filter(Boolean) as WorkspaceMilestone[];
}

/**
 * Parse the workspace payload out of the `terms_notes` column. If the column
 * contains plain (legacy) text instead of our JSON envelope, the text is
 * preserved as `legacy_notes`.
 */
export function parseWorkspace(termsNotes: string | null | undefined): WorkspacePayload {
  const base = emptyWorkspace();
  if (!termsNotes) return base;

  const trimmed = termsNotes.trim();
  if (!trimmed.startsWith("{")) {
    return { ...base, legacy_notes: termsNotes };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ...base, legacy_notes: termsNotes };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ...base, legacy_notes: termsNotes };
  }
  const r = parsed as Record<string, unknown>;
  if (r[WORKSPACE_TAG] !== 1 && r[WORKSPACE_TAG] !== true) {
    return { ...base, legacy_notes: termsNotes };
  }

  return {
    contact_title: str(r.contact_title),
    location: str(r.location),
    website_type: str(r.website_type),
    pages_count: num(r.pages_count),
    support_days: num(r.support_days),
    summary: str(r.summary),
    primary_challenge: str(r.primary_challenge),
    goals: isStringArray(r.goals) ? r.goals : [],
    deliverables: isStringArray(r.deliverables) ? r.deliverables : [],
    exclusions: isStringArray(r.exclusions) ? r.exclusions : [],
    timeline: normaliseTimeline(r.timeline),
    pricing_items: normalisePricing(r.pricing_items),
    milestones: normaliseMilestones(r.milestones),
    currency: str(r.currency) ?? "INR",
    total_price: num(r.total_price),
    extra_revision_charge: num(r.extra_revision_charge),
    monthly_maintenance_fee: num(r.monthly_maintenance_fee),
    legacy_notes: str(r.legacy_notes),
  };
}

/** Serialise the workspace payload back into a string for `terms_notes`. */
export function serializeWorkspace(payload: WorkspacePayload): string {
  return JSON.stringify({ [WORKSPACE_TAG]: 1, ...payload });
}

export function newTimelineEntry(): WorkspaceTimelineEntry {
  return { id: ensureId("tl"), phase: "", start: null, end: null, notes: null };
}
export function newPricingItem(): WorkspacePricingItem {
  return { id: ensureId("pi"), label: "", amount: 0 };
}
export function newMilestone(): WorkspaceMilestone {
  return { id: ensureId("ms"), label: "", due: null, amount: 0, paid: false };
}
