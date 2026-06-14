import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  Inbox,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
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
  updateLead,
} from "../lib/leads";
import {
  convertLeadToClient,
  deleteClient,
  fetchClients,
  updateClient,
} from "../lib/clients";
import type {
  Client,
  ClientPatch,
  Lead,
  LeadPatch,
  NewLeadInput,
  ProjectStatus,
} from "../types";
import { isWithinDays } from "../utils";
import { StatCard } from "./StatCard";
import { LoadingState, EmptyState } from "./states";
import { LeadFilters, EMPTY_FILTERS, type Filters } from "./LeadFilters";
import { LeadTable } from "./LeadTable";
import { LeadDrawer } from "./LeadDrawer";
import { AddLeadDialog } from "./AddLeadDialog";
import {
  ClientFilters,
  EMPTY_CLIENT_FILTERS,
  type ClientFiltersState,
} from "./ClientFilters";
import { ClientsTable } from "./ClientsTable";
import { ClientWorkspace } from "./ClientWorkspace";

type Tab = "leads" | "clients";

export function Dashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("leads");

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
  const [clientFilters, setClientFilters] = useState<ClientFiltersState>(
    EMPTY_CLIENT_FILTERS,
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

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

  useEffect(() => {
    loadLeads();
    loadClients();
  }, []);

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
        l.business_name,
        l.email,
        l.phone,
        l.industry,
        l.budget,
        l.final_budget ?? "",
        l.message ?? "",
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
        ["Interested", "Proposal Sent"].includes(l.status),
      ).length,
    }),
    [leads],
  );

  const hasFilters =
    Boolean(filters.q.trim()) ||
    filters.source !== "All" ||
    filters.status !== "All" ||
    filters.priority !== "All";

  async function patchLead(id: string, patch: LeadPatch) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
    try {
      await updateLead(id, patch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
      loadLeads({ quiet: true });
    }
  }

  async function handleCreate(input: NewLeadInput) {
    const created = await createLead(input);
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
    const headers = [
      "created_at",
      "name",
      "business_name",
      "email",
      "phone",
      "industry",
      "budget",
      "final_budget",
      "source",
      "status",
      "priority",
      "follow_up_date",
      "message",
    ];
    const rows = filtered.map((l) =>
      headers
        .map((h) => {
          const v = (l as unknown as Record<string, unknown>)[h] ?? "";
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
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              ...patch,
              remaining_amount:
                (patch.final_price ?? c.final_price ?? 0) -
                (patch.advance_paid ?? c.advance_paid ?? 0),
            }
          : c,
      ),
    );
    setSelectedClient((prev) =>
      prev?.id === id
        ? {
            ...prev,
            ...patch,
            remaining_amount:
              (patch.final_price ?? prev.final_price ?? 0) -
              (patch.advance_paid ?? prev.advance_paid ?? 0),
          }
        : prev,
    );
    try {
      await updateClient(id, patch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Client update failed.");
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
        <div className="container-aurevon min-h-16 py-3 flex flex-col gap-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="size-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
            <span className="font-display text-base min-[380px]:text-lg tracking-[0.18em] md:tracking-[0.2em]">
              AUREVON
            </span>
            <span className="ml-1 rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              CRM
            </span>
          </Link>
          <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-end">
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
        <div className="mb-6 inline-flex rounded-full border border-border bg-surface p-1">
          <button
            onClick={() => setTab("leads")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
              tab === "leads"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={14} /> Leads
          </button>
          <button
            onClick={() => setTab("clients")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
              tab === "clients"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase size={14} /> Clients
          </button>
        </div>

        {tab === "leads" ? (
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
              <StatCard label="Total leads" value={stats.total} Icon={Inbox} tone="accent" />
              <StatCard label="New" value={stats.newCount} Icon={Clock3} tone="blue" />
              <StatCard label="High priority" value={stats.highPriority} Icon={AlertTriangle} tone="red" />
              <StatCard label="This week" value={stats.thisWeek} Icon={CalendarClock} tone="green" />
              <StatCard label="In progress" value={stats.advanced} Icon={CheckCircle2} tone="violet" />
            </div>

            <div className="surface-card mb-4 p-3 md:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <LeadFilters filters={filters} onChange={setFilters} />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
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
                <EmptyState
                  hasFilters={hasFilters}
                  onClear={() => setFilters(EMPTY_FILTERS)}
                />
              ) : (
                <LeadTable
                  leads={filtered}
                  onSelect={setSelected}
                  onPatch={patchLead}
                  onDelete={setLeadToDelete}
                />
              )}
            </div>
          </>
        ) : (
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
              <StatCard label="Total clients" value={clientStats.total} Icon={Briefcase} tone="accent" />
              <StatCard label="Active" value={clientStats.active} Icon={Clock3} tone="violet" />
              <StatCard label="Delivered" value={clientStats.delivered} Icon={CheckCircle2} tone="green" />
              <StatCard label="Advance pending" value={clientStats.pending} Icon={AlertTriangle} tone="red" />
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

            {error && (
              <div className="surface-card mb-4 flex items-start gap-3 p-4 text-sm text-destructive">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

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
        <AlertDialogContent className="mx-4 max-w-md surface-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete lead?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              {leadToDelete?.business_name ?? "this lead"} and all of its notes
              from Supabase. This action cannot be undone.
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

      <AlertDialog
        open={Boolean(clientToDelete)}
        onOpenChange={(open) => !open && setClientToDelete(null)}
      >
        <AlertDialogContent className="mx-4 max-w-md surface-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete client?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              {clientToDelete?.business_name ?? "this client"} and all of its
              notes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
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
