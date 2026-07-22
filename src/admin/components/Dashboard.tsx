import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Columns3,
  Download,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  ListChecks,
  PhoneCall,
  Plus,
  RefreshCw,
  Table2,
  Users,
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
import {
  createLead,
  deleteLead,
  fetchLeads,
  nextSortOrder,
  reorderLeads,
  updateLead,
} from "../lib/leads";
import {
  convertLeadToClient,
  deleteClient,
  fetchClients,
  updateClient,
} from "../lib/clients";
import { addTimelineEvent, fetchTodayCallCount } from "../lib/timeline";
import { fetchOpenTasks } from "../lib/tasks";
import type {
  Client,
  ClientPatch,
  Lead,
  LeadPatch,
  LeadPriority,
  NewLeadInput,
  ProjectStatus,
  Task,
} from "../types";
import { isWithinDays, exportToCsv, reindex } from "../utils";
import { StatCard } from "./StatCard";
import { LoadingState, EmptyState } from "./states";
import { LeadFilters, EMPTY_FILTERS, type Filters } from "./LeadFilters";
import { LeadTable } from "./LeadTable";
import { LeadBoard } from "./LeadBoard";
import { LeadDrawer } from "./LeadDrawer";
import { AddLeadDialog } from "./AddLeadDialog";
import {
  ClientFilters,
  EMPTY_CLIENT_FILTERS,
  type ClientFiltersState,
} from "./ClientFilters";
import { ClientsTable } from "./ClientsTable";
import { ClientWorkspace } from "./ClientWorkspace";
import { CallScriptPage } from "./CallScriptPage";
import { DashboardOverview } from "./DashboardOverview";
import { GlobalSearch } from "./GlobalSearch";
import { TasksTab } from "./TasksTab";

type Tab = "overview" | "leads" | "clients" | "tasks" | "callscript";
type LeadView = "board" | "table";

export function Dashboard({
  email,
  fullName,
}: {
  email: string;
  fullName?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [leadView, setLeadView] = useState<LeadView>("board");

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Clients state
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsRefreshing, setClientsRefreshing] = useState(false);
  const [clientFilters, setClientFilters] =
    useState<ClientFiltersState>(EMPTY_CLIENT_FILTERS);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  // Dashboard overview state
  const [todayCallCount, setTodayCallCount] = useState(0);

  // Tasks tab state
  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  async function loadLeads({ quiet = false }: { quiet?: boolean } = {}) {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setLeads(await fetchLeads());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads.");
      setLeads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadClients({ quiet = false }: { quiet?: boolean } = {}) {
    if (quiet) setClientsRefreshing(true);
    else setClientsLoading(true);
    setError(null);
    try {
      setClients(await fetchClients());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients.");
      setClients([]);
    } finally {
      setClientsLoading(false);
      setClientsRefreshing(false);
    }
  }

  async function loadTasks() {
    setTasksLoading(true);
    try {
      setOpenTasks(await fetchOpenTasks());
    } catch {
      setOpenTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
    loadClients();
    fetchTodayCallCount()
      .then(setTodayCallCount)
      .catch(() => setTodayCallCount(0));
  }, []);

  useEffect(() => {
    if (tab === "tasks") loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ---------- LEADS ----------
  const filtered = useMemo(() => {
    const s = filters.q.trim().toLowerCase();
    return leads.filter((l) => {
      if (filters.source !== "All" && l.source !== filters.source) return false;
      if (filters.status !== "All" && l.status !== filters.status) return false;
      if (filters.priority !== "All" && l.priority !== filters.priority)
        return false;
      if (!s) return true;
      return [
        l.name,
        l.owner_name,
        l.business_name,
        l.email,
        l.phone,
        l.whatsapp_number ?? "",
        l.industry,
        l.business_category,
        l.city ?? "",
        l.instagram_url ?? "",
        l.google_maps_url ?? "",
        l.budget,
        l.final_budget ?? "",
        l.message ?? "",
        l.research_notes ?? "",
        l.general_notes ?? "",
        l.status,
        l.priority,
        l.source,
      ].some((v) => v.toLowerCase().includes(s));
    });
  }, [leads, filters]);

  const stats = useMemo(
    () => ({
      total: leads.length,
      newCount: leads.filter((l) => l.status === "New").length,
      highPriority: leads.filter((l) => l.priority === "High").length,
      thisWeek: leads.filter((l) => isWithinDays(l.created_at, 7)).length,
      advanced: leads.filter((l) =>
        [
          "Interested",
          "Demo Sent",
          "Meeting Scheduled",
          "Proposal Sent",
          "Negotiating",
        ].includes(l.status),
      ).length,
    }),
    [leads],
  );

  const hasFilters =
    Boolean(filters.q.trim()) ||
    filters.source !== "All" ||
    filters.status !== "All" ||
    filters.priority !== "All";

  /**
   * Single write path for every lead update — the drawer's field edits, the
   * board's status/priority pills, and drag-driven priority moves all funnel
   * through here. Beyond persisting the patch, it:
   *   - auto-assigns a sort_order when priority changes without one already
   *     supplied, so a lead always lands at the bottom of its new column;
   *   - logs a Call History entry whenever status or priority actually change;
   *   - automatically converts the lead into a Client the moment its status
   *     becomes "Won" (unless it's already been converted).
   */
  async function patchLead(id: string, patch: LeadPatch) {
    const before = leads.find((l) => l.id === id);
    let finalPatch = patch;
    if (
      patch.priority &&
      before &&
      patch.priority !== before.priority &&
      patch.sort_order === undefined
    ) {
      finalPatch = {
        ...patch,
        sort_order: nextSortOrder(leads, patch.priority),
      };
    }

    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...finalPatch } : l)),
    );
    setSelected((prev) =>
      prev?.id === id ? { ...prev, ...finalPatch } : prev,
    );

    try {
      await updateLead(id, finalPatch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
      loadLeads({ quiet: true });
      return;
    }

    if (!before) return;

    if (finalPatch.status && finalPatch.status !== before.status) {
      addTimelineEvent(
        "lead",
        id,
        "status_change",
        `Status changed to ${finalPatch.status}`,
      ).catch(() => {});

      if (finalPatch.status === "Won") {
        try {
          const client = await convertLeadToClient({
            ...before,
            ...finalPatch,
          } as Lead);
          setClients((prev) => [
            client,
            ...prev.filter((c) => c.id !== client.id),
          ]);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Lead was marked Won, but auto-conversion to a client failed.",
          );
        }
      }
    }

    if (finalPatch.priority && finalPatch.priority !== before.priority) {
      addTimelineEvent(
        "lead",
        id,
        "priority_change",
        `Priority changed to ${finalPatch.priority}`,
      ).catch(() => {});
    }
  }

  async function handleReorderCommit(orderedIds: string[]) {
    const updates = reindex(orderedIds);
    const updateMap = new Map(updates.map((u) => [u.id, u.sort_order]));
    setLeads((prev) =>
      prev.map((l) =>
        updateMap.has(l.id) ? { ...l, sort_order: updateMap.get(l.id)! } : l,
      ),
    );
    try {
      await reorderLeads(orderedIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed.");
      loadLeads({ quiet: true });
    }
  }

  function handleChangePriority(id: string, priority: LeadPriority) {
    patchLead(id, { priority });
  }

  async function handleCreate(input: NewLeadInput) {
    const created = await createLead(input, leads);
    setLeads((prev) => [created, ...prev]);
  }

  async function confirmDeleteLead() {
    if (!leadToDelete) return;
    setDeletingId(leadToDelete.id);
    try {
      await deleteLead(leadToDelete.id);
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      if (selected?.id === leadToDelete.id) setSelected(null);
      setLeadToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleConvert(lead: Lead) {
    const created = await convertLeadToClient(lead);
    setClients((prev) => {
      const without = prev.filter((c) => c.id !== created.id);
      return [created, ...without];
    });
    return created;
  }

  function exportCsv() {
    exportToCsv(
      filtered as unknown as Record<string, unknown>[],
      [
        "created_at",
        "owner_name",
        "business_name",
        "email",
        "phone",
        "whatsapp_number",
        "business_category",
        "city",
        "source",
        "status",
        "priority",
        "next_followup_date",
        "research_notes",
      ],
      "aurevon-leads",
    );
  }

  function openLeadFromSearch(lead: Lead) {
    setTab("leads");
    setSelected(lead);
  }

  function openClientFromSearch(client: Client) {
    setTab("clients");
    setSelectedClient(client);
  }

  // ---------- CLIENTS ----------
  const filteredClients = useMemo(() => {
    const s = clientFilters.q.trim().toLowerCase();
    return clients.filter((c) => {
      if (
        clientFilters.project_status !== "All" &&
        c.project_status !== clientFilters.project_status
      )
        return false;
      if (!s) return true;
      return [c.client_name, c.business_name, c.phone, c.email].some((v) =>
        v.toLowerCase().includes(s),
      );
    });
  }, [clients, clientFilters]);

  const clientStats = useMemo(
    () => ({
      total: clients.length,
      active: clients.filter((c) =>
        ["Advance Paid", "In Progress", "Review"].includes(c.project_status),
      ).length,
      delivered: clients.filter((c) => c.project_status === "Delivered").length,
      pending: clients.filter((c) => c.project_status === "Advance Pending")
        .length,
    }),
    [clients],
  );

  const hasClientFilters =
    Boolean(clientFilters.q.trim()) || clientFilters.project_status !== "All";

  async function patchClient(id: string, patch: ClientPatch) {
    // ── Single source of truth for remaining_amount ──────────────────────────
    // Always recompute remaining_amount from the final values that will exist
    // on the client after this patch is applied.
    //
    // When patchWorkspace sends { final_price, advance_paid, remaining_amount }
    // together (an atomic workspace save), we trust the patch's own
    // remaining_amount directly — it was derived from fresh milestone data.
    //
    // For any other patch (e.g. a name change that doesn't touch pricing),
    // we derive remaining_amount from whichever pricing fields ARE in the
    // patch, falling back to the current client state for those that aren't.
    //
    // The key fix: remaining_amount is ALWAYS included in the DB write so the
    // persisted value never diverges from the UI — this is what caused the
    // "values reset on refresh" symptom.
    const currentClient = clients.find((c) => c.id === id);

    const effectiveRemaining =
      // Trust an explicit remaining_amount from patchWorkspace
      patch.remaining_amount !== undefined
        ? patch.remaining_amount
        : // Otherwise derive it from whatever pricing fields this patch contains
          Math.max(
            0,
            (patch.final_price ?? currentClient?.final_price ?? 0) -
              (patch.advance_paid ?? currentClient?.advance_paid ?? 0),
          );

    // Build the patch that always writes remaining_amount to Supabase
    const persistPatch: ClientPatch = {
      ...patch,
      remaining_amount: effectiveRemaining,
    };

    // Optimistic UI update — apply immediately so the UI feels instant.
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...persistPatch } : c)),
    );
    setSelectedClient((prev) =>
      prev?.id === id ? { ...prev, ...persistPatch } : prev,
    );

    try {
      await updateClient(id, persistPatch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Client update failed.");
      // Roll back the optimistic update by re-fetching from DB
      loadClients({ quiet: true });
    }
  }

  async function confirmDeleteClient() {
    if (!clientToDelete) return;
    setDeletingClientId(clientToDelete.id);
    try {
      await deleteClient(clientToDelete.id);
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      if (selectedClient?.id === clientToDelete.id) setSelectedClient(null);
      setClientToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingClientId(null);
    }
  }

  function exportClientsCsv() {
    const headers = [
      "created_at",
      "client_name",
      "business_name",
      "email",
      "phone",
      "industry",
      "source",
      "final_budget",
      "quoted_price",
      "final_price",
      "advance_paid",
      "remaining_amount",
      "monthly_revenue",
      "project_status",
    ];
    const rows = filteredClients.map((c) =>
      headers
        .map((h) => {
          const v = (c as unknown as Record<string, unknown>)[h] ?? "";
          return `"${String(v).replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aurevon-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="container-aurevon min-h-16 py-3 flex flex-col gap-3 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0">
          <div className="flex min-w-0 items-center justify-between gap-3 lg:justify-start">
            <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
              <span className="font-display text-sm font-light tracking-[0.18em] text-foreground uppercase hidden sm:inline">
                Aurevon<span className="text-accent ml-1">Studios</span>
              </span>
              <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                CRM
              </span>
            </Link>
          </div>
          <div className="flex min-w-0 items-center gap-3 lg:flex-1 lg:justify-center">
            <GlobalSearch
              leads={leads}
              clients={clients}
              onSelectLead={openLeadFromSearch}
              onSelectClient={openClientFromSearch}
            />
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3 lg:justify-end">
            <span className="truncate text-xs text-muted-foreground">
              {email}
            </span>
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
        {/* Tabs */}
        <div className="mb-6 flex flex-nowrap items-center gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setTab("overview")}
            className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
              tab === "overview"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button
            onClick={() => setTab("leads")}
            className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
              tab === "leads"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={14} /> Leads
          </button>
          <button
            onClick={() => setTab("clients")}
            className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
              tab === "clients"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase size={14} /> Clients
          </button>
          <button
            onClick={() => setTab("tasks")}
            className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
              tab === "tasks"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListChecks size={14} /> Tasks
          </button>
          <button
            onClick={() => setTab("callscript")}
            className={`shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
              tab === "callscript"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PhoneCall size={14} /> Call Scripts
          </button>
        </div>

        {error && (
          <div className="surface-card mb-4 flex items-start gap-3 p-4 text-sm text-destructive">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {tab === "overview" && (
          <>
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[0.24em] text-accent">
                Overview
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl text-foreground">
                Good to see you, {fullName || email.split("@")[0]}.
              </h1>
            </div>
            {loading || clientsLoading ? (
              <LoadingState />
            ) : (
              <DashboardOverview
                leads={leads}
                clients={clients}
                todayCallCount={todayCallCount}
                onSelectLead={setSelected}
                onSelectClient={setSelectedClient}
              />
            )}
          </>
        )}

        {tab === "leads" && (
          <>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-accent">
                  Dashboard
                </div>
                <h1 className="mt-2 text-3xl md:text-4xl text-foreground">
                  Lead pipeline
                </h1>
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-sm font-medium hover:bg-accent-glow transition-colors"
              >
                <Plus size={16} /> Add Lead
              </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Total leads"
                value={stats.total}
                Icon={Inbox}
                tone="accent"
              />
              <StatCard
                label="New"
                value={stats.newCount}
                Icon={Clock3}
                tone="blue"
              />
              <StatCard
                label="High priority"
                value={stats.highPriority}
                Icon={AlertTriangle}
                tone="red"
              />
              <StatCard
                label="This week"
                value={stats.thisWeek}
                Icon={CalendarClock}
                tone="green"
              />
              <StatCard
                label="In progress"
                value={stats.advanced}
                Icon={CheckCircle2}
                tone="violet"
              />
            </div>

            <div className="surface-card mb-4 p-3 md:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <LeadFilters filters={filters} onChange={setFilters} />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <div className="col-span-2 flex justify-center rounded-full border border-border p-1 sm:col-span-1 sm:inline-flex">
                    <button
                      onClick={() => setLeadView("board")}
                      aria-label="Board view"
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                        leadView === "board"
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Columns3 size={13} /> Board
                    </button>
                    <button
                      onClick={() => setLeadView("table")}
                      aria-label="Table view"
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                        leadView === "table"
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Table2 size={13} /> Table
                    </button>
                  </div>
                  <button
                    onClick={() => loadLeads({ quiet: true })}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm hover:bg-secondary transition-colors disabled:opacity-60"
                  >
                    {refreshing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Refresh
                  </button>
                  <button
                    onClick={exportCsv}
                    disabled={!filtered.length}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-2.5 text-sm hover:bg-accent-glow transition-colors disabled:opacity-50"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="surface-card overflow-hidden">
                <LoadingState />
              </div>
            ) : filtered.length === 0 ? (
              <div className="surface-card overflow-hidden">
                <EmptyState
                  hasFilters={hasFilters}
                  onClear={() => setFilters(EMPTY_FILTERS)}
                />
              </div>
            ) : leadView === "board" ? (
              <LeadBoard
                leads={filtered}
                onSelect={setSelected}
                onPatch={patchLead}
                onReorderCommit={handleReorderCommit}
                onChangePriority={handleChangePriority}
              />
            ) : (
              <div className="surface-card overflow-hidden">
                <LeadTable
                  leads={filtered}
                  onSelect={setSelected}
                  onPatch={patchLead}
                  onDelete={setLeadToDelete}
                />
              </div>
            )}
          </>
        )}

        {tab === "clients" && (
          <>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-accent">
                  Dashboard
                </div>
                <h1 className="mt-2 text-3xl md:text-4xl text-foreground">
                  Clients
                </h1>
              </div>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total clients"
                value={clientStats.total}
                Icon={Briefcase}
                tone="accent"
              />
              <StatCard
                label="Active"
                value={clientStats.active}
                Icon={Clock3}
                tone="violet"
              />
              <StatCard
                label="Delivered"
                value={clientStats.delivered}
                Icon={CheckCircle2}
                tone="green"
              />
              <StatCard
                label="Advance pending"
                value={clientStats.pending}
                Icon={AlertTriangle}
                tone="red"
              />
            </div>

            <div className="surface-card mb-4 p-3 md:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <ClientFilters
                    filters={clientFilters}
                    onChange={setClientFilters}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <button
                    onClick={() => loadClients({ quiet: true })}
                    disabled={clientsRefreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm hover:bg-secondary transition-colors disabled:opacity-60"
                  >
                    {clientsRefreshing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Refresh
                  </button>
                  <button
                    onClick={exportClientsCsv}
                    disabled={!filteredClients.length}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-2.5 text-sm hover:bg-accent-glow transition-colors disabled:opacity-50"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="surface-card overflow-hidden">
              {clientsLoading ? (
                <LoadingState />
              ) : filteredClients.length === 0 ? (
                <EmptyState
                  hasFilters={hasClientFilters}
                  onClear={() => setClientFilters(EMPTY_CLIENT_FILTERS)}
                />
              ) : (
                <ClientsTable
                  clients={filteredClients}
                  onSelect={setSelectedClient}
                  onPatchStatus={(id, project_status: ProjectStatus) =>
                    patchClient(id, { project_status })
                  }
                  onDelete={setClientToDelete}
                />
              )}
            </div>
          </>
        )}

        {tab === "tasks" && (
          <>
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[0.24em] text-accent">
                Dashboard
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl text-foreground">
                Tasks
              </h1>
            </div>
            <TasksTab
              tasks={openTasks}
              leads={leads}
              clients={clients}
              loading={tasksLoading}
              onRefresh={loadTasks}
              onSelectLead={setSelected}
              onSelectClient={setSelectedClient}
            />
          </>
        )}

        {tab === "callscript" && <CallScriptPage />}
      </div>

      {selected && (
        <LeadDrawer
          lead={selected}
          onClose={() => setSelected(null)}
          onDelete={() => setLeadToDelete(selected)}
          onPatch={(patch) => patchLead(selected.id, patch)}
          onConvert={() => handleConvert(selected)}
        />
      )}

      {selectedClient && (
        <ClientWorkspace
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onDelete={() => setClientToDelete(selectedClient)}
          onPatch={(patch) => patchClient(selectedClient.id, patch)}
        />
      )}

      {showAdd && (
        <AddLeadDialog
          onClose={() => setShowAdd(false)}
          onCreate={handleCreate}
        />
      )}

      <AlertDialog
        open={Boolean(leadToDelete)}
        onOpenChange={(open) => !open && setLeadToDelete(null)}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md surface-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete lead?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              {leadToDelete?.business_name ?? "this lead"} and all of its notes,
              call history and tasks from Supabase. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              Cancel
            </AlertDialogCancel>
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

      <AlertDialog
        open={Boolean(clientToDelete)}
        onOpenChange={(open) => !open && setClientToDelete(null)}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md surface-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete client?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              {clientToDelete?.business_name ?? "this client"} and all of its
              notes, timeline and tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={Boolean(deletingClientId)}
            >
              {deletingClientId ? (
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
