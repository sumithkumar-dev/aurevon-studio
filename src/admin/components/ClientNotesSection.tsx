import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  addClientNote,
  deleteClientNote,
  fetchClientNotes,
} from "../lib/clients";
import type { ClientNote } from "../types";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

export function ClientNotesSection({ clientId }: { clientId: string }) {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchClientNotes(clientId)
      .then((d) => active && setNotes(d))
      .catch(() => active && setNotes([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [clientId]);

  async function handleAdd() {
    const content = newNote.trim();
    if (!content || saving) return;
    setSaving(true);
    try {
      const created = await addClientNote(clientId, content);
      setNotes((prev) => [created, ...prev]);
      setNewNote("");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setDeleting(true);
    const prev = notes;
    setNotes((n) => n.filter((x) => x.id !== id));
    try {
      await deleteClientNote(id);
      setPendingDeleteId(null);
    } catch {
      setNotes(prev);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-background/35 p-5">
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        Notes
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Write a note..."
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newNote.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-glow transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Add Note
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="group rounded-xl border border-border bg-secondary/20 p-3 text-sm text-foreground"
            >
              <p className="whitespace-pre-wrap break-words">{n.note}</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </span>
                <button
                  onClick={() => setPendingDeleteId(n.id)}
                  className="text-xs text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(isOpen) => !isOpen && setPendingDeleteId(null)}
        title="Delete this note?"
        description="This permanently removes the note. This action cannot be undone."
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
