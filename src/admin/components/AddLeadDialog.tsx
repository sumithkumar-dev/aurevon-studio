import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { BUDGET_OPTIONS, INDUSTRY_OPTIONS, SOURCE_OPTIONS } from "../constants";
import type { LeadSource, NewLeadInput } from "../types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fieldClass =
  "mt-2 w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 transition-colors";
const selectTriggerClass =
  "mt-2 w-full h-auto bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground shadow-none focus:ring-2 focus:ring-ring/40";
const labelClass =
  "text-[10px] uppercase tracking-[0.2em] text-muted-foreground";

export function AddLeadDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: NewLeadInput) => Promise<void>;
}) {
  const [form, setForm] = useState<NewLeadInput>({
    name: "",
    business_name: "",
    phone: "",
    email: "",
    source: "Cold Call",
    industry: "",
    budget: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof NewLeadInput>(key: K, value: NewLeadInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.business_name.trim()) {
      setError("Name and business name are required.");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        ...form,
        name: form.name.trim(),
        business_name: form.business_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        industry: form.industry.trim() || "—",
        budget: form.budget.trim() || "—",
        note: form.note?.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4 py-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="surface-card relative flex max-h-full w-full max-w-lg flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-accent">
              New lead
            </div>
            <h2 className="mt-1 text-xl text-foreground">Add Lead</h2>
          </div>
          <Button
            onClick={onClose}
            variant="accentOutline"
            size="pillIcon"
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Name *</span>
              <input
                className={fieldClass}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Contact name"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Business name *</span>
              <input
                className={fieldClass}
                value={form.business_name}
                onChange={(e) => set("business_name", e.target.value)}
                placeholder="Company"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Phone</span>
              <input
                className={fieldClass}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 ..."
              />
            </label>
            <label className="block">
              <span className={labelClass}>Email</span>
              <input
                type="email"
                className={fieldClass}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@business.com"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Source</span>
              <Select
                value={form.source}
                onValueChange={(v) => set("source", v as LeadSource)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block">
              <span className={labelClass}>Industry</span>
              <Select
                value={form.industry || undefined}
                onValueChange={(v) => set("industry", v)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Budget</span>
              <Select
                value={form.budget || undefined}
                onValueChange={(v) => set("budget", v)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Notes</span>
              <textarea
                className={fieldClass}
                rows={3}
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                placeholder="Optional first note about this lead..."
              />
            </label>
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="accentOutline"
              size="pill"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              variant="accent"
              size="pill"
              className="disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Create lead
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
