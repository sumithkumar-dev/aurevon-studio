import { useMemo } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  IndianRupee,
  PhoneCall,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";
import { FUNNEL_STATUSES } from "../constants";
import type { Client, Lead } from "../types";
import {
  formatDate,
  isOverdue,
  isToday,
  isUpcoming,
  relativeDayLabel,
} from "../utils";
import { StatCard } from "./StatCard";

function funnelBarClass(status: string) {
  switch (status) {
    case "New":
      return "bg-sky-400/70";
    case "Ready to Call":
      return "bg-indigo-400/70";
    case "Interested":
      return "bg-cyan-400/70";
    case "Demo Sent":
      return "bg-blue-400/70";
    case "Meeting Scheduled":
      return "bg-fuchsia-400/70";
    case "Won":
      return "bg-emerald-400/70";
    default:
      return "bg-accent/70";
  }
}

function formatMoney(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function FollowUpList({
  title,
  tone,
  leads,
  onSelectLead,
  emptyLabel,
}: {
  title: string;
  tone: "rose" | "amber" | "sky";
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  emptyLabel: string;
}) {
  const toneClass =
    tone === "rose"
      ? "text-rose-300"
      : tone === "amber"
        ? "text-amber-300"
        : "text-sky-300";
  return (
    <div className="surface-card p-4 md:p-5">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-medium ${toneClass}`}>{title}</h3>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          {leads.length}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {leads.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyLabel}</p>
        ) : (
          leads.slice(0, 6).map((lead) => (
            <button
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-secondary/40 transition-colors"
            >
              <span className="min-w-0 truncate text-foreground">
                {lead.business_name || "Untitled business"}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {lead.next_followup_date && relativeDayLabel(lead.next_followup_date)}
              </span>
            </button>
          ))
        )}
        {leads.length > 6 && (
          <div className="pt-1 text-center text-[11px] text-muted-foreground">
            +{leads.length - 6} more
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardOverview({
  leads,
  clients,
  todayCallCount,
  onSelectLead,
  onSelectClient,
}: {
  leads: Lead[];
  clients: Client[];
  todayCallCount: number;
  onSelectLead: (lead: Lead) => void;
  onSelectClient: (client: Client) => void;
}) {
  const openLeads = useMemo(
    () => leads.filter((l) => l.status !== "Won" && l.status !== "Lost"),
    [leads],
  );

  const overdueFollowUps = useMemo(
    () => openLeads.filter((l) => isOverdue(l.next_followup_date)),
    [openLeads],
  );
  const todayFollowUps = useMemo(
    () => openLeads.filter((l) => isToday(l.next_followup_date)),
    [openLeads],
  );
  const upcomingFollowUps = useMemo(
    () => openLeads.filter((l) => isUpcoming(l.next_followup_date, 7)),
    [openLeads],
  );

  const funnel = useMemo(() => {
    const counts = FUNNEL_STATUSES.map((status) => ({
      status,
      count: leads.filter((l) => l.status === status).length,
    }));
    const max = Math.max(1, ...counts.map((c) => c.count));
    return { counts, max };
  }, [leads]);

  const lostCount = useMemo(
    () => leads.filter((l) => l.status === "Lost").length,
    [leads],
  );

  const revenueThisMonth = useMemo(() => {
    const now = new Date();
    return clients
      .filter((c) => {
        const d = new Date(c.created_at);
        return (
          d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, c) => sum + (c.final_price ?? c.quoted_price ?? 0), 0);
  }, [clients]);

  const mrr = useMemo(
    () =>
      clients
        .filter((c) => c.project_status !== "Cancelled")
        .reduce((sum, c) => sum + (c.monthly_revenue || 0), 0),
    [clients],
  );

  const renewals = useMemo(() => {
    const items: { client: Client; label: string; date: string; overdue: boolean }[] = [];
    for (const c of clients) {
      if (c.domain_expiry && (isUpcoming(c.domain_expiry, 30) || isOverdue(c.domain_expiry))) {
        items.push({
          client: c,
          label: "Domain",
          date: c.domain_expiry,
          overdue: isOverdue(c.domain_expiry),
        });
      }
      if (c.hosting_expiry && (isUpcoming(c.hosting_expiry, 30) || isOverdue(c.hosting_expiry))) {
        items.push({
          client: c,
          label: "Hosting",
          date: c.hosting_expiry,
          overdue: isOverdue(c.hosting_expiry),
        });
      }
    }
    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [clients]);

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue this month"
          value={formatMoney(revenueThisMonth)}
          Icon={IndianRupee}
          tone="green"
        />
        <StatCard
          label="Monthly recurring revenue"
          value={formatMoney(mrr)}
          Icon={RefreshCcw}
          tone="accent"
        />
        <StatCard
          label="Today's calls"
          value={todayCallCount}
          Icon={PhoneCall}
          tone="blue"
        />
        <StatCard
          label="Today's follow-ups"
          value={todayFollowUps.length}
          Icon={CalendarClock}
          tone="violet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lead funnel */}
        <div className="surface-card p-4 md:p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Lead funnel</h3>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp size={12} /> {leads.length} total · {lostCount} lost
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {funnel.counts.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">
                  {status}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary/50">
                  <div
                    className={`h-full rounded-full ${funnelBarClass(status)}`}
                    style={{ width: `${(count / funnel.max) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs text-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming renewals */}
        <div className="surface-card p-4 md:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              Upcoming renewals
            </h3>
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {renewals.length}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {renewals.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nothing expiring in the next 30 days.
              </p>
            ) : (
              renewals.slice(0, 6).map((r, i) => (
                <button
                  key={`${r.client.id}-${r.label}-${i}`}
                  onClick={() => onSelectClient(r.client)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-secondary/40 transition-colors"
                >
                  <span className="min-w-0 truncate text-foreground">
                    {r.client.business_name}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {r.label}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-xs ${r.overdue ? "text-rose-300" : "text-muted-foreground"}`}
                  >
                    {formatDate(r.date)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Follow-ups */}
      <div className="grid gap-4 lg:grid-cols-3">
        <FollowUpList
          title="Overdue follow-ups"
          tone="rose"
          leads={overdueFollowUps}
          onSelectLead={onSelectLead}
          emptyLabel="Nothing overdue. Nice work."
        />
        <FollowUpList
          title="Today's follow-ups"
          tone="amber"
          leads={todayFollowUps}
          onSelectLead={onSelectLead}
          emptyLabel="No follow-ups due today."
        />
        <FollowUpList
          title="Upcoming follow-ups"
          tone="sky"
          leads={upcomingFollowUps}
          onSelectLead={onSelectLead}
          emptyLabel="Nothing in the next 7 days."
        />
      </div>

      {clients.length === 0 && leads.length === 0 && (
        <div className="surface-card flex items-center gap-3 p-5 text-sm text-muted-foreground">
          <ArrowUpRight size={16} className="text-accent" />
          Add your first lead to see the pipeline come to life here.
        </div>
      )}
    </div>
  );
}
