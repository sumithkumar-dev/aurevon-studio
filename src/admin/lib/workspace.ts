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
  client_action?: string | null;
};

export type WorkspacePricingItem = {
  id: string;
  label: string;
  amount: number;
  description?: string | null;
  frequency?: string | null;
  highlight?: boolean;
};

export type WorkspaceMilestone = {
  id: string;
  label: string;
  due?: string | null;
  amount: number;
  paid?: boolean;
  /** How the client paid this milestone (e.g. "UPI", "Bank Transfer"). Only
   * meaningful when `paid` is true; cleared automatically when unpaid. */
  paid_via?: string | null;
};

export type CallScriptBlockKind =
  | "intro"
  | "discovery"
  | "pitch"
  | "objection"
  | "closing"
  | "custom";

export type CallScriptBlock = {
  id: string;
  kind: CallScriptBlockKind;
  title: string;
  body: string;
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
  domain_provider: string | null;
  hosting_provider: string | null;
  legacy_notes: string | null;
  call_script: CallScriptBlock[];
};

const WORKSPACE_TAG = "__workspace";

/**
 * Returns true only when terms_notes contains a fully valid workspace JSON
 * envelope — i.e. it starts with "{" AND contains the __workspace tag.
 *
 * This is the single source of truth for "has this client been saved before?"
 * Used in ClientWorkspace to decide whether to apply default values or trust
 * the saved data as-is.  The previous check (startsWith("{") only) was wrong:
 * it returned true for any JSON object, including ones without the tag that
 * parseWorkspace would silently convert to emptyWorkspace().
 */
export function hasWorkspaceTag(
  termsNotes: string | null | undefined,
): boolean {
  if (!termsNotes) return false;
  const trimmed = termsNotes.trim();
  if (!trimmed.startsWith("{")) return false;
  try {
    const r = JSON.parse(trimmed) as Record<string, unknown>;
    return r[WORKSPACE_TAG] === 1 || r[WORKSPACE_TAG] === true;
  } catch {
    return false;
  }
}

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
    currency: "₹",
    total_price: null,
    extra_revision_charge: null,
    monthly_maintenance_fee: null,
    domain_provider: null,
    hosting_provider: null,
    legacy_notes: null,
    call_script: [],
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
        client_action: str(r.client_action),
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
        description: str(r.description),
        frequency: str(r.frequency),
        highlight: typeof r.highlight === "boolean" ? r.highlight : false,
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
      // Only discard entries that have no id AND no meaningful content at all.
      // Previously this dropped entries with an empty label + amount 0, which
      // caused a newly-added blank milestone to vanish after the first save,
      // triggering a re-run of applyWorkspaceDefaults that regenerated milestones
      // with fresh random IDs — the root cause of the "values reset on refresh" bug.
      const hasId = typeof r.id === "string" && r.id.length > 0;
      const label = str(r.label);
      const amount = num(r.amount) ?? 0;
      if (!hasId && !label && amount === 0 && !r.due) return null;
      return {
        id: hasId ? (r.id as string) : ensureId("ms"),
        label: label ?? "",
        due: str(r.due),
        amount,
        paid: Boolean(r.paid),
        paid_via: str(r.paid_via),
      };
    })
    .filter(Boolean) as WorkspaceMilestone[];
}

function normaliseCallScript(v: unknown): CallScriptBlock[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((raw): CallScriptBlock | null => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as Record<string, unknown>;
      const id = typeof r.id === "string" && r.id ? r.id : ensureId("cs");
      const title = str(r.title) ?? "";
      const body = str(r.body) ?? "";
      const validKinds = ["intro", "discovery", "pitch", "objection", "closing", "custom"];
      const kind = validKinds.includes(r.kind as string)
        ? (r.kind as CallScriptBlockKind)
        : "custom";
      return { id, kind, title, body };
    })
    .filter(Boolean) as CallScriptBlock[];
}

/**
 * Parse the workspace payload out of the `terms_notes` column. If the column
 * contains plain (legacy) text instead of our JSON envelope, the text is
 * preserved as `legacy_notes`.
 */
export function parseWorkspace(
  termsNotes: string | null | undefined,
): WorkspacePayload {
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
    currency: str(r.currency) ?? "₹",
    total_price: num(r.total_price),
    extra_revision_charge: num(r.extra_revision_charge),
    monthly_maintenance_fee: num(r.monthly_maintenance_fee),
    domain_provider: str(r.domain_provider),
    hosting_provider: str(r.hosting_provider),
    legacy_notes: str(r.legacy_notes),
    call_script: normaliseCallScript(r.call_script),
  };
}

/** Serialise the workspace payload back into a string for `terms_notes`. */
export function serializeWorkspace(payload: WorkspacePayload): string {
  return JSON.stringify({ [WORKSPACE_TAG]: 1, ...payload });
}

export function newTimelineEntry(): WorkspaceTimelineEntry {
  return {
    id: ensureId("tl"),
    phase: "",
    start: null,
    end: null,
    notes: null,
    client_action: null,
  };
}
export function newPricingItem(): WorkspacePricingItem {
  return { id: ensureId("pi"), label: "", amount: 0 };
}
export function newMilestone(): WorkspaceMilestone {
  return {
    id: ensureId("ms"),
    label: "",
    due: null,
    amount: 0,
    paid: false,
    paid_via: null,
  };
}

export function newCallScriptBlock(kind: CallScriptBlockKind = "custom"): CallScriptBlock {
  const defaults: Record<CallScriptBlockKind, string> = {
    intro: "Introduction",
    discovery: "Discovery Questions",
    pitch: "Pitch / Value",
    objection: "Handle Objection",
    closing: "Close & Next Steps",
    custom: "Custom Block",
  };
  return { id: ensureId("cs"), kind, title: defaults[kind], body: "" };
}

/* ── Default phases ───────────────────────────────────────────────── */

/* ── Client action suggestions per phase ─────────────────────────── */

const PHASE_CLIENT_ACTIONS: Record<string, string> = {
  discovery:
    "Share brand assets, login credentials, and answer the onboarding questionnaire",
  design:
    "Review mockups and wireframes; provide consolidated feedback within 3 business days",
  development:
    "Provide final copy, images, and menu/product content; review staging site",
  launch:
    "Approve final site, confirm domain transfer, and complete final payment",
  review:
    "Test the live site on your own devices and report any issues within 48 hours",
  revision:
    "Compile all revision requests into a single document and share with the Studio",
  testing:
    "Test on mobile and desktop; confirm all links, forms, and pages work correctly",
  handover:
    "Receive login credentials, confirm access, and sign off on delivery",
};

/** Returns a suggested client_action string for a given phase name. */
export function suggestClientAction(phase: string): string {
  const key = phase.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, action] of Object.entries(PHASE_CLIENT_ACTIONS)) {
    if (key.includes(k)) return action;
  }
  return "Review deliverables and provide feedback within 3 business days";
}

export function defaultTimelinePhases(): WorkspaceTimelineEntry[] {
  const phases = [
    { name: "Discovery", action: PHASE_CLIENT_ACTIONS.discovery },
    { name: "Design", action: PHASE_CLIENT_ACTIONS.design },
    { name: "Development", action: PHASE_CLIENT_ACTIONS.development },
    { name: "Launch", action: PHASE_CLIENT_ACTIONS.launch },
  ];
  return phases.map(({ name, action }) => ({
    id: ensureId("tl"),
    phase: name,
    start: null,
    end: null,
    notes: null,
    client_action: action,
  }));
}

/* ── Industry-based goal suggestions ─────────────────────────────── */

const INDUSTRY_GOALS: Record<string, string[]> = {
  restaurant: [
    "Enable online table reservations or order enquiries",
    "Showcase menu with photos and dietary info",
    "Improve local SEO to rank in 'near me' searches",
    "Drive social media traffic with Instagram link",
    "Build brand credibility with testimonials & gallery",
  ],
  cafe: [
    "Enable online table reservations or order enquiries",
    "Showcase menu with photos and seasonal specials",
    "Improve local SEO to rank in 'near me' searches",
    "Drive social media traffic with Instagram link",
    "Build brand credibility with testimonials & gallery",
  ],
  clinic: [
    "Allow patients to book appointments online",
    "Present services and specialist team clearly",
    "Build trust with credentials, testimonials & FAQs",
    "Improve local search visibility",
    "Provide downloadable forms or health resources",
  ],
  healthcare: [
    "Allow patients to book appointments online",
    "Present services and specialist team clearly",
    "Build trust with credentials, testimonials & FAQs",
    "Improve local search visibility",
    "Provide downloadable forms or health resources",
  ],
  gym: [
    "Showcase membership plans and pricing clearly",
    "Allow class bookings or trial session sign-ups",
    "Highlight trainers and transformation stories",
    "Drive Instagram and YouTube traffic",
    "Rank for local fitness searches",
  ],
  fitness: [
    "Showcase membership plans and pricing clearly",
    "Allow class bookings or trial session sign-ups",
    "Highlight trainers and transformation stories",
    "Drive Instagram and YouTube traffic",
    "Rank for local fitness searches",
  ],
  ecommerce: [
    "Drive product discovery and increase conversion rate",
    "Provide a fast, mobile-friendly shopping experience",
    "Reduce cart abandonment with a smooth checkout",
    "Enable product search, filtering and reviews",
    "Build customer trust with secure payment badges",
  ],
  retail: [
    "Drive product discovery and increase conversion rate",
    "Provide a fast, mobile-friendly shopping experience",
    "Showcase bestsellers and seasonal promotions",
    "Enable product search, filtering and reviews",
    "Build customer trust with secure payment badges",
  ],
  education: [
    "Present courses, curriculum and faculty clearly",
    "Allow prospective students to apply or enquire online",
    "Showcase student success stories and testimonials",
    "Improve search rankings for course-related keywords",
    "Provide resources or a student portal",
  ],
  realestate: [
    "Showcase property listings with search and filters",
    "Allow buyers or renters to enquire or book viewings",
    "Build agent credibility with bios and reviews",
    "Rank for local property searches",
    "Capture leads with contact and callback forms",
  ],
  saas: [
    "Communicate product value proposition in under 5 seconds",
    "Drive sign-ups or free trial activations",
    "Showcase features, integrations and pricing clearly",
    "Build trust with customer logos, case studies & reviews",
    "Reduce support load with an accessible help or docs section",
  ],
  agency: [
    "Showcase portfolio and case studies to attract ideal clients",
    "Generate inbound enquiry and proposal requests",
    "Communicate services and process clearly",
    "Build credibility with testimonials and client logos",
    "Rank for relevant local or niche search terms",
  ],
  law: [
    "Present practice areas and expertise clearly",
    "Allow clients to book a consultation online",
    "Build trust with credentials, bar memberships and reviews",
    "Rank for local legal search terms",
    "Provide a secure contact form for confidential enquiries",
  ],
  legal: [
    "Present practice areas and expertise clearly",
    "Allow clients to book a consultation online",
    "Build trust with credentials, bar memberships and reviews",
    "Rank for local legal search terms",
    "Provide a secure contact form for confidential enquiries",
  ],
};

const DEFAULT_GOALS = [
  "Establish a professional and credible online presence",
  "Generate leads and enquiries through the website",
  "Improve mobile experience for visitors",
  "Rank higher in local and industry search results",
  "Clearly communicate services, value and pricing",
];

export function suggestGoalsForIndustry(
  industry: string | null | undefined,
): string[] {
  if (!industry) return DEFAULT_GOALS;
  const key = industry.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, goals] of Object.entries(INDUSTRY_GOALS)) {
    if (key.includes(k)) return goals;
  }
  return DEFAULT_GOALS;
}

/* ── Auto pricing items from project parameters ─────────────────── */

export function autoPricingItems(
  websiteType: string | null | undefined,
  pagesCount: number | null | undefined,
  supportDays: number | null | undefined,
): WorkspacePricingItem[] {
  const items: WorkspacePricingItem[] = [];

  const type = (websiteType ?? "").toLowerCase();
  const pages = pagesCount ?? 5;
  const support = supportDays ?? 30;

  // Discovery & Strategy
  items.push({
    id: ensureId("pi"),
    label: "Discovery & Strategy — Kickoff session, sitemap, content planning",
    amount: 0,
  });

  // Design
  const designLabel = `Website Design — ${pages} page${pages !== 1 ? "s" : ""}, responsive layout, brand-aligned`;
  items.push({ id: ensureId("pi"), label: designLabel, amount: 0 });

  // Development
  const devLabel =
    type.includes("ecommerce") || type.includes("shop")
      ? "Development — Custom build, product catalogue, cart & checkout"
      : "Development — Custom build, contact form, SEO setup, integrations";
  items.push({ id: ensureId("pi"), label: devLabel, amount: 0 });

  //Domain
  const domainLabel = "Domain Registration — Domain name registration guidance and setup";
  items.push({ id: ensureId("pi"), label: domainLabel, amount: 0 });

  // Launch & Handover
  items.push({
    id: ensureId("pi"),
    label: "Launch & Handover — QA testing, domain setup, walkthrough session",
    amount: 0,
  });

  // Support (if specified)
  if (support > 0) {
    items.push({
      id: ensureId("pi"),
      label: `Post-Launch Support — ${support}-day support period`,
      amount: 0,
    });
  }

  return items;
}

/* ── Default payment milestones ─────────────────────────────────── */

export function defaultMilestones(
  totalPrice: number | null,
): WorkspaceMilestone[] {
  const total = totalPrice ?? 0;
  const advance = Math.round(total * 0.5);
  const final = total - advance;
  return [
    {
      id: ensureId("ms"),
      label: "50% Advance — On project kickoff",
      due: null,
      amount: advance,
      paid: false,
    },
    {
      id: ensureId("ms"),
      label: "50% Final — On project delivery",
      due: null,
      amount: final,
      paid: false,
    },
  ];
}

/* ── Build defaults for a fresh workspace ────────────────────────── */

export type ClientSeed = {
  message?: string | null;
  project_description?: string | null;
  industry?: string | null;
  website_type?: string | null;
  pages_count?: number | null;
  support_days?: number | null;
  total_price?: number | null;
};

/**
 * Given an existing (possibly empty) workspace and seed data from the Client
 * record, fills in any fields that are empty/missing with sensible defaults.
 * Never overwrites data the user has already entered.
 */
export function applyWorkspaceDefaults(
  ws: WorkspacePayload,
  seed: ClientSeed,
): WorkspacePayload {
  let changed = false;
  const next = { ...ws };

  // 1. Summary — auto-fill from lead message or project_description
  if (!next.summary) {
    const fallback = seed.message || seed.project_description || null;
    if (fallback) {
      next.summary = fallback;
      changed = true;
    } else {
      // Provide a generic placeholder so it's never empty
      next.summary =
        "A professional website project tailored to the client's business goals and target audience.";
      changed = true;
    }
  }

  // 2. Timeline — auto-create default phases if empty
  if (!next.timeline || next.timeline.length === 0) {
    next.timeline = defaultTimelinePhases();
    changed = true;
  }

  // 3. Goals — auto-suggest based on industry if empty
  if (!next.goals || next.goals.length === 0) {
    next.goals = suggestGoalsForIndustry(seed.industry);
    changed = true;
  }

  // 4. Pricing items — auto-generate from project params if empty
  if (!next.pricing_items || next.pricing_items.length === 0) {
    const wt = next.website_type ?? seed.website_type;
    const pc = next.pages_count ?? seed.pages_count;
    const sd = next.support_days ?? seed.support_days;
    next.pricing_items = autoPricingItems(wt, pc, sd);
    changed = true;
  }

  // 5. Milestones — auto-create 50/50 split ONLY when:
  //    a) the milestones array is genuinely empty, AND
  //    b) we have a real price to split (avoids generating ₹0/₹0 placeholders
  //       that get normalised away on every reload, causing endless regeneration
  //       with new random IDs — the root cause of the "reset on refresh" bug).
  if (!next.milestones || next.milestones.length === 0) {
    const price = next.total_price ?? seed.total_price;
    if (price !== null && price !== undefined && price > 0) {
      next.milestones = defaultMilestones(price);
      changed = true;
    }
    // If price is null/0, leave milestones as [] so the user adds them
    // manually once they enter a project total. Generating zero-amount
    // milestones causes normaliseMilestones to drop them on the next parse,
    // triggering another applyWorkspaceDefaults pass with fresh random IDs
    // that silently overwrites whatever the user had saved.
  }

  return changed ? next : ws;
}

/* ── Suggested deliverables & exclusions ─────────────────────────── */

export const SUGGESTED_DELIVERABLES = [
  "Responsive website (mobile, tablet, desktop)",
  "Up to {{project.pages_count}} custom-designed pages",
  "Contact form with email notification",
  "Google Maps integration",
  "On-page SEO setup (meta titles, descriptions, sitemap)",
  "Social media links & Instagram feed integration",
  "Image gallery / portfolio section",
  "WhatsApp chat button",
  "Google Analytics setup",
  "Basic speed & performance optimisation",
];

export const SUGGESTED_EXCLUSIONS = [
  "Copywriting and content creation",
  "Photography or videography",
  "Logo design or branding",
  "Domain registration & renewal",
  "Hosting setup & fees",
  "Third-party software subscriptions",
  "E-commerce / online payments",
  "Ongoing content updates after handover",
  "Email hosting or G Suite setup",
  "Multilingual or regional language content",
];
