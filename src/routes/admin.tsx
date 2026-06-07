import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useMeta } from "@/lib/use-meta";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

type Lead = {
  id: string;
  name: string;
  business_name: string;
  phone: string;
  email: string;
  industry: string;
  budget: string;
  message: string | null;
  created_at: string;
  status: LeadStatus;
};

type LeadStatus = "New" | "Contacted" | "Proposal Sent" | "Closed";
type LeadPriority = "High" | "Medium" | "Low";
type LeadNotes = Record<string, string>;

const STATUS_OPTIONS: LeadStatus[] = ["New", "Contacted", "Proposal Sent", "Closed"];
const PRIORITY_OPTIONS: LeadPriority[] = ["High", "Medium", "Low"];
const NOTES_STORAGE_KEY = "aurevon-admin-lead-notes";

function AdminDashboard() {
  useMeta({ title: "Admin — AUREVON" });
  const [session, setSession] = useState<{ email?: string | null } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { email: data.session.user.email } : null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ? { email: s.user.email } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="surface-card flex w-full max-w-sm items-center gap-3 p-5 text-sm text-muted-foreground">
          <Loader2 className="animate-spin text-accent" size={18} />
          Checking admin session...
        </div>
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  return <Dashboard email={session.email ?? ""} />;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md surface-card p-6 md:p-8"
      >
        <Link to="/" className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
          <span className="font-display text-lg tracking-[0.2em] text-foreground">AUREVON</span>
        </Link>
        <div className="mt-6 text-xs uppercase tracking-[0.3em] text-accent">Admin</div>
        <h1 className="mt-2 text-3xl text-foreground">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the email/password you created in your Supabase project.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-ring transition-colors"
              placeholder="you@aurevon.studio"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-ring transition-colors"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-sm font-medium hover:bg-accent-glow transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Dashboard({ email }: { email: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  // notes remain local-only (not in Supabase schema); status is Supabase-only
  const [leadNotes, setLeadNotes] = useState<LeadNotes>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Persist notes only (not status — that lives in Supabase)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(NOTES_STORAGE_KEY);
      if (stored) setLeadNotes(JSON.parse(stored) as LeadNotes);
    } catch {
      setLeadNotes({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(leadNotes));
  }, [leadNotes]);

  async function load({ quiet = false }: { quiet?: boolean } = {}) {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
      setLeads([]);
    } else {
      setLeads((data as Lead[]) ?? []);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    load();
  }, []);

  // status comes directly from lead.status (Supabase); priority remains derived
  const getStatus = (lead: Lead): LeadStatus =>
    (lead.status as LeadStatus) ?? "New";

  const getPriority = (lead: Lead): LeadPriority => derivePriority(lead);

  const getNotes = (lead: Lead): string => leadNotes[lead.id] ?? "";

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter((l) => {
      return [
        l.name,
        l.business_name,
        l.email,
        l.phone,
        l.industry,
        l.budget,
        l.message ?? "",
        getStatus(l),
        getPriority(l),
      ].some((v) => v.toLowerCase().includes(s));
    });
  }, [leads, q]);

  const stats = useMemo(() => {
    const thisWeek = leads.filter((l) => isWithinDays(l.created_at, 7)).length;
    const newCount = leads.filter((l) => getStatus(l) === "New").length;
    const highPriority = leads.filter((l) => getPriority(l) === "High").length;
    const proposalOrClosed = leads.filter((l) =>
      ["Proposal Sent", "Closed"].includes(getStatus(l)),
    ).length;

    return {
      total: leads.length,
      thisWeek,
      newCount,
      highPriority,
      proposalOrClosed,
      uniqueBusinesses: new Set(leads.map((l) => l.business_name.toLowerCase())).size,
    };
  }, [leads]);

  async function updateLeadStatus(id: string, status: LeadStatus) {
    const { error: err } = await supabase
      .from("contact_submissions")
      .update({ status })
      .eq("id", id);

    if (err) {
      console.error("Status update failed:", err.message);
      return;
    }

    // Optimistically update local leads state so UI reflects the change
    // immediately without a full refetch
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l)),
    );

    // Keep the drawer in sync if this lead is currently selected
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
  }

  function updateLeadNotes(id: string, notes: string) {
    setLeadNotes((prev) => ({ ...prev, [id]: notes }));
  }

  async function confirmDeleteLead() {
    if (!leadToDelete) return;
    setDeletingId(leadToDelete.id);
    const { error: err } = await supabase.from("contact_submissions").delete().eq("id", leadToDelete.id);

    if (err) {
      setError(err.message);
      setDeletingId(null);
      return;
    }

    setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
    setLeadNotes((prev) => {
      const next = { ...prev };
      delete next[leadToDelete.id];
      return next;
    });
    if (selected?.id === leadToDelete.id) setSelected(null);
    setLeadToDelete(null);
    setDeletingId(null);
  }

  function exportCsv() {
    const headers = [
      "created_at",
      "name",
      "business_name",
      "email",
      "phone",
      "industry",
      "budget",
      "message",
    ];
    const rows = filtered.map((l) =>
      headers
        .map((h) => {
          const v = (l as any)[h] ?? "";
          return `"${String(v).replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aurevon-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="container-aurevon min-h-16 py-3 flex flex-col gap-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="size-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
            <span className="font-display text-base min-[380px]:text-lg tracking-[0.18em] md:tracking-[0.2em]">
              AUREVON
            </span>
            <span className="ml-1 rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Admin
            </span>
          </Link>
          <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-end">
            <span className="truncate text-xs text-muted-foreground">{email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="container-aurevon py-6 md:py-8">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-accent">Dashboard</div>
            <h1 className="mt-2 text-3xl md:text-4xl text-foreground">Lead inbox</h1>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            Review submissions, track follow-up status, set priority, export CSV, and remove stale
            leads without changing the database schema.
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total leads" value={stats.total} Icon={Inbox} tone="accent" />
          <StatCard label="New" value={stats.newCount} Icon={Clock3} tone="blue" />
          <StatCard label="High priority" value={stats.highPriority} Icon={AlertTriangle} tone="red" />
          <StatCard label="This week" value={stats.thisWeek} Icon={CalendarClock} tone="green" />
          <StatCard label="Advanced" value={stats.proposalOrClosed} Icon={CheckCircle2} tone="violet" />
        </div>

        <div className="surface-card mb-4 p-3 md:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, business, status, priority..."
                className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                onClick={() => load({ quiet: true })}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary transition-colors disabled:opacity-60"
              >
                {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Refresh
              </button>
              <button
                onClick={exportCsv}
                disabled={!filtered.length}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-2 text-sm hover:bg-accent-glow transition-colors disabled:opacity-50"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="surface-card mb-4 flex items-start gap-3 p-4 text-sm text-destructive">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="surface-card overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState hasQuery={Boolean(q.trim())} onClear={() => setQ("")} />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-secondary/50 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Lead</th>
                      <th className="px-4 py-3 font-medium">Business</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium">Budget</th>
                      <th className="px-4 py-3 font-medium">Submitted</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead) => {
                      const status = getStatus(lead);
                      const priority = getPriority(lead);
                      const notes = getNotes(lead);
                      return (
                        <tr
                          key={lead.id}
                          className="border-t border-border/80 hover:bg-secondary/25 cursor-pointer transition-colors"
                          onClick={() => setSelected(lead)}
                        >
                          <td className="px-4 py-4">
                            <div className="font-medium text-foreground">{lead.name}</div>
                            <div className="mt-1 line-clamp-1 max-w-[210px] text-xs text-muted-foreground">
                              {notes ? notes : (lead.message?.trim() || "No message provided")}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-foreground">{lead.business_name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{lead.industry}</div>
                          </td>
                          <td className="px-4 py-4">
                            <StatusSelect
                              value={status}
                              onChange={(newStatus) => updateLeadStatus(lead.id, newStatus)}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <PrioritySelect
                              value={priority}
                              onChange={() => {
                                // priority is derived from budget; no-op to keep UI consistent
                              }}
                            />
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            <a
                              href={`mailto:${lead.email}`}
                              className="block max-w-[220px] truncate hover:text-accent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {lead.email}
                            </a>
                            <a
                              href={`tel:${lead.phone}`}
                              className="mt-1 block text-xs hover:text-accent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {lead.phone}
                            </a>
                          </td>
                          <td className="px-4 py-4 text-accent">{lead.budget}</td>
                          <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                            {formatDate(lead.created_at)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLeadToDelete(lead);
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

              <div className="divide-y divide-border md:hidden">
                {filtered.map((lead) => {
                  const status = getStatus(lead);
                  const priority = getPriority(lead);
                  return (
                    <button
                      key={lead.id}
                      onClick={() => setSelected(lead)}
                      className="block w-full p-4 text-left hover:bg-secondary/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{lead.business_name}</div>
                          <div className="mt-1 truncate text-sm text-muted-foreground">{lead.name}</div>
                        </div>
                        <PriorityBadge priority={priority} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge status={status} />
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          {lead.budget}
                        </span>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          {formatDate(lead.created_at)}
                        </span>
                      </div>
                      <div className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {lead.message?.trim() || "No message provided"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {selected && (
        <LeadDrawer
          lead={selected}
          notes={getNotes(selected)}
          onClose={() => setSelected(null)}
          onDelete={() => setLeadToDelete(selected)}
          onStatusChange={(status) => updateLeadStatus(selected.id, status)}
          onNotesChange={(notes) => updateLeadNotes(selected.id, notes)}
        />
      )}

      <AlertDialog open={Boolean(leadToDelete)} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent className="mx-4 max-w-md surface-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {leadToDelete?.business_name ?? "this lead"} from Supabase.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLead}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={Boolean(deletingId)}
            >
              {deletingId ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" /> Deleting
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LeadDrawer({
  lead,
  meta,
  onClose,
  onDelete,
  onMetaChange,
}: {
  lead: Lead;
  meta: LeadMeta;
  onClose: () => void;
  onDelete: () => void;
  onMetaChange: (patch: Partial<LeadMeta>) => void;
}) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    async function fetchNotes() {
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });

      if (!error) setNotes(data || []);
    }

    fetchNotes();
  }, [lead.id]);

  async function addNote() {
    if (!newNote.trim()) return;

    const { data, error } = await supabase
      .from("lead_notes")
      .insert({
        lead_id: lead.id,
        note: newNote.trim(),
      })
      .select();

    if (!error && data) {
      setNotes((prev) => [data[0], ...prev]);
      setNewNote("");
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
                <StatusBadge status={meta.status} />
                <PriorityBadge priority={meta.priority} />
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

          {/* STATUS + PRIORITY */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ControlPanel label="Status">
              <StatusSelect
                value={meta.status}
                onChange={(status) => onMetaChange({ status })}
              />
            </ControlPanel>

            <ControlPanel label="Priority">
              <PrioritySelect
                value={meta.priority}
                onChange={(priority) => onMetaChange({ priority })}
              />
            </ControlPanel>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoTile Icon={User} label="Contact" value={lead.name} />
            <InfoTile Icon={CalendarClock} label="Submitted" value={formatDateTime(lead.created_at)} />
            <InfoTile Icon={Building2} label="Budget" value={lead.budget} />
            <InfoTile Icon={MessageSquare} label="Industry" value={lead.industry} />
          </div>

          <div className="mt-5 grid gap-3">
            <ContactLink Icon={Mail} href={`mailto:${lead.email}`} label="Email" value={lead.email} />
            <ContactLink Icon={Phone} href={`tel:${lead.phone}`} label="Phone" value={lead.phone} />
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

          {/* NOTES SECTION */}
          <div className="mt-6 rounded-2xl border border-border bg-background/35 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Notes
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write a note..."
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />

              <button
                onClick={addNote}
                className="rounded-xl bg-accent px-4 py-2 text-sm text-white"
              >
                Add
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-border bg-secondary/20 p-3 text-sm"
                >
                  {n.note}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-border p-4 md:p-5">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <a
              href={`mailto:${lead.email}?subject=Re: Your website inquiry`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-white px-5 py-3 text-sm font-medium"
            >
              <Send size={14} /> Reply
            </a>

            <button
              onClick={onDelete}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm text-red-400"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: "accent" | "blue" | "red" | "green" | "violet";
}) {
  const toneClass = {
    accent: "text-accent bg-accent/10",
    blue: "text-sky-300 bg-sky-400/10",
    red: "text-rose-300 bg-rose-400/10",
    green: "text-emerald-300 bg-emerald-400/10",
    violet: "text-violet-300 bg-violet-400/10",
  }[tone];

  return (
    <div className="surface-card min-w-0 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-3xl font-display text-foreground">{value}</div>
        </div>
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl border border-border ${toneClass}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="animate-spin text-accent" size={16} />
        Loading submissions...
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-secondary/20 p-4">
            <div className="h-4 w-2/3 rounded-full bg-secondary" />
            <div className="mt-3 h-3 w-1/2 rounded-full bg-secondary/70" />
            <div className="mt-4 flex gap-2">
              <div className="h-7 w-24 rounded-full bg-secondary/80" />
              <div className="h-7 w-20 rounded-full bg-secondary/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ hasQuery, onClear }: { hasQuery: boolean; onClear: () => void }) {
  return (
    <div className="grid place-items-center px-5 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-2xl border border-border bg-secondary/50 text-accent">
        <Inbox size={22} />
      </div>
      <h3 className="mt-4 text-xl text-foreground">
        {hasQuery ? "No matching leads" : "No submissions yet"}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {hasQuery
          ? "Try a different name, email, business, status, priority, or budget."
          : "New contact form submissions will appear here as soon as they arrive."}
      </p>
      {hasQuery && (
        <button
          onClick={onClear}
          className="mt-5 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
        >
          Clear search
        </button>
      )}
    </div>
  );
}

function StatusSelect({ value, onChange }: { value: LeadStatus; onChange: (status: LeadStatus) => void }) {
  return (
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as LeadStatus)}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium outline-none ${statusClasses(value)}`}
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

function PrioritySelect({
  value,
  onChange,
}: {
  value: LeadPriority;
  onChange: (priority: LeadPriority) => void;
}) {
  return (
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as LeadPriority)}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium outline-none ${priorityClasses(value)}`}
    >
      {PRIORITY_OPTIONS.map((priority) => (
        <option key={priority} value={priority}>
          {priority}
        </option>
      ))}
    </select>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(status)}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${priorityClasses(priority)}`}>
      {priority}
    </span>
  );
}

function ControlPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="rounded-2xl border border-border bg-background/35 p-3">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoTile({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-background/35 p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <Icon size={13} className="text-accent" />
        {label}
      </div>
      <div className="mt-2 break-words text-sm text-foreground">{value}</div>
    </div>
  );
}

function ContactLink({
  Icon,
  href,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  label: string;
  value: string;
}) {
  return (
    <a
      href={href}
      className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-background/35 p-4 text-foreground hover:border-accent/40 hover:text-accent"
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-accent">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        <div className="mt-1 truncate text-sm">{value}</div>
      </div>
    </a>
  );
}

function derivePriority(lead: Lead): LeadPriority {
  const budget = lead.budget.toLowerCase();
  if (budget.includes("1l") || budget.includes("1L".toLowerCase()) || budget.includes("60k")) {
    return "High";
  }
  if (budget.includes("30k") || lead.message?.trim()) return "Medium";
  return "Low";
}

function statusClasses(status: LeadStatus) {
  switch (status) {
    case "New":
      return "border-sky-400/30 bg-sky-400/10 text-sky-200";
    case "Contacted":
      return "border-violet-400/30 bg-violet-400/10 text-violet-200";
    case "Proposal Sent":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    case "Closed":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }
}

function priorityClasses(priority: LeadPriority) {
  switch (priority) {
    case "High":
      return "border-rose-400/30 bg-rose-400/10 text-rose-200";
    case "Medium":
      return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    case "Low":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }
}

function isWithinDays(date: string, days: number) {
  return Date.now() - new Date(date).getTime() < days * 864e5;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}