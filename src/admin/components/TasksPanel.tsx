import { useEffect, useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { createTask, deleteTask, fetchTasks, toggleTask } from "../lib/tasks";
import type { TimelineEntityType, Task } from "../types";
import { isOverdue, isToday, relativeDayLabel, toDateInputValue } from "../utils";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

export function TasksPanel({
  entityType,
  entityId,
  title = "Tasks",
}: {
  entityType: TimelineEntityType;
  entityId: string;
  title?: string;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchTasks(entityType, entityId)
      .then((data) => active && setTasks(data))
      .catch(() => active && setTasks([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [entityType, entityId]);

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      const created = await createTask(entityType, entityId, title, newDue || null);
      setTasks((prev) => [created, ...prev]);
      setNewTitle("");
      setNewDue("");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(task: Task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_done: !t.is_done } : t)),
    );
    try {
      await toggleTask(task.id, !task.is_done);
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_done: task.is_done } : t)),
      );
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setDeleting(true);
    const prev = tasks;
    setTasks((t) => t.filter((x) => x.id !== id));
    try {
      await deleteTask(id);
      setPendingDeleteId(null);
    } catch {
      setTasks(prev);
    } finally {
      setDeleting(false);
    }
  }

  const open = tasks.filter((t) => !t.is_done);
  const done = tasks.filter((t) => t.is_done);

  return (
    <div className="rounded-2xl border border-border bg-background/35 p-5">
      {title && (
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {title}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="e.g. Call tomorrow, Send demo, Buy domain"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
        />
        <input
          type="date"
          value={newDue}
          onChange={(e) => setNewDue(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/60"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newTitle.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-glow transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Add
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks yet. Add one above.
          </p>
        ) : (
          <>
            {open.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onDelete={() => setPendingDeleteId(task.id)}
              />
            ))}
            {done.length > 0 && (
              <details className="pt-1">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  {done.length} completed
                </summary>
                <div className="mt-2 space-y-2">
                  {done.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggle(task)}
                      onDelete={() => setPendingDeleteId(task.id)}
                    />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(isOpen) => !isOpen && setPendingDeleteId(null)}
        title="Delete this task?"
        description="This permanently removes the task. This action cannot be undone."
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const overdue = !task.is_done && isOverdue(task.due_date);
  const today = !task.is_done && isToday(task.due_date);
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-secondary/20 px-3 py-2.5">
      <button
        onClick={onToggle}
        aria-label={task.is_done ? "Mark as not done" : "Mark as done"}
        className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${
          task.is_done
            ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-200"
            : "border-border text-transparent hover:border-accent/50"
        }`}
      >
        <Check size={12} />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${task.is_done ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {task.title}
        </p>
      </div>
      {task.due_date && (
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${
            overdue
              ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
              : today
                ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                : "border-border text-muted-foreground"
          }`}
        >
          {relativeDayLabel(toDateInputValue(task.due_date))}
        </span>
      )}
      <button
        onClick={onDelete}
        className="shrink-0 text-muted-foreground opacity-100 transition-opacity hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Delete task"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
