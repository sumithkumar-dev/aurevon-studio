import { useMemo } from "react";
import { Briefcase, Check, Loader2, RefreshCw, User } from "lucide-react";
import type { Client, Lead, Task } from "../types";
import { toggleTask } from "../lib/tasks";
import { isOverdue, isToday, relativeDayLabel, toDateInputValue } from "../utils";

function TaskRow({
  task,
  entityLabel,
  entityIcon: Icon,
  onOpen,
  onToggled,
}: {
  task: Task;
  entityLabel: string;
  entityIcon: React.ComponentType<{ size?: number; className?: string }>;
  onOpen: () => void;
  onToggled: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/20 px-3 py-2.5">
      <button
        onClick={async () => {
          await toggleTask(task.id, true);
          onToggled();
        }}
        aria-label="Mark done"
        className="grid size-5 shrink-0 place-items-center rounded-md border border-border text-transparent hover:border-emerald-400/50 hover:text-emerald-300"
      >
        <Check size={12} />
      </button>
      <button
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="truncate text-sm text-foreground">{task.title}</span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          <Icon size={10} /> {entityLabel}
        </span>
      </button>
      {task.due_date && (
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${
            isOverdue(task.due_date)
              ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
              : isToday(task.due_date)
                ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                : "border-border text-muted-foreground"
          }`}
        >
          {relativeDayLabel(toDateInputValue(task.due_date))}
        </span>
      )}
    </div>
  );
}

export function TasksTab({
  tasks,
  leads,
  clients,
  loading,
  onRefresh,
  onSelectLead,
  onSelectClient,
}: {
  tasks: Task[];
  leads: Lead[];
  clients: Client[];
  loading: boolean;
  onRefresh: () => void;
  onSelectLead: (lead: Lead) => void;
  onSelectClient: (client: Client) => void;
}) {
  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const clientById = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients],
  );

  const overdue = tasks.filter((t) => isOverdue(t.due_date));
  const today = tasks.filter((t) => isToday(t.due_date));
  const upcoming = tasks.filter(
    (t) => t.due_date && !isOverdue(t.due_date) && !isToday(t.due_date),
  );
  const noDate = tasks.filter((t) => !t.due_date);

  function resolve(task: Task) {
    if (task.entity_type === "lead") {
      const lead = leadById.get(task.entity_id);
      return {
        label: lead?.business_name ?? "Lead",
        icon: User,
        open: () => lead && onSelectLead(lead),
      };
    }
    const client = clientById.get(task.entity_id);
    return {
      label: client?.business_name ?? "Client",
      icon: Briefcase,
      open: () => client && onSelectClient(client),
    };
  }

  function renderGroup(title: string, group: Task[]) {
    if (group.length === 0) return null;
    return (
      <div className="surface-card p-4 md:p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            {group.length}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {group.map((task) => {
            const { label, icon, open } = resolve(task);
            return (
              <TaskRow
                key={task.id}
                task={task}
                entityLabel={label}
                entityIcon={icon}
                onOpen={open}
                onToggled={onRefresh}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Every open task across your leads and clients, in one place.
        </p>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-xs hover:bg-secondary transition-colors disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} />
          )}
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="surface-card grid place-items-center p-10 text-sm text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="surface-card p-10 text-center text-sm text-muted-foreground">
          No open tasks. Add one from any lead or client.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {renderGroup("Overdue", overdue)}
          {renderGroup("Today", today)}
          {renderGroup("Upcoming", upcoming)}
          {renderGroup("No due date", noDate)}
        </div>
      )}
    </div>
  );
}
