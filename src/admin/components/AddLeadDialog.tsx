import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, X } from "lucide-react";
import { INDUSTRY_OPTIONS, PRIORITY_OPTIONS, SOURCE_OPTIONS } from "../constants";
import type { LeadPriority, LeadSource, NewLeadInput } from "../types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fieldClass =
  "mt-2 w-full min-w-0 bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 transition-colors";
const selectTriggerClass =
  "mt-2 w-full h-auto bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground shadow-none focus:ring-2 focus:ring-ring/40";
const labelClass =
  "text-[10px] uppercase tracking-[0.2em] text-muted-foreground";

type FormState = NewLeadInput & { note: string };

const EMPTY_FORM: FormState = {
  business_name: "",
  owner_name: "",
  phone: "",
  whatsapp_number: "",
  email: "",
  business_category: "",
  city: "",
  address: "",
  website_url: "",
  instagram_url: "",
  google_maps_url: "",
  facebook_url: "",
  priority: "Medium",
  source: "Cold Call",
  note: "",
};

export function AddLeadDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: NewLeadInput) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showOnlinePresence, setShowOnlinePresence] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.business_name.trim() || !form.owner_name.trim() || !form.phone.trim()) {
      setError("Business name, owner name and phone are required.");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        ...form,
        business_name: form.business_name.trim(),
        owner_name: form.owner_name.trim(),
        phone: form.phone.trim(),
        whatsapp_number: form.whatsapp_number?.trim() || null,
        email: form.email?.trim() || "",
        business_category: form.business_category.trim() || "Other",
        city: form.city?.trim() || null,
        address: form.address?.trim() || null,
        website_url: form.website_url?.trim() || null,
        instagram_url: form.instagram_url?.trim() || null,
        google_maps_url: form.google_maps_url?.trim() || null,
        facebook_url: form.facebook_url?.trim() || null,
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
          className="flex-1 overflow-y-auto p-5 space-y-5 [scrollbar-gutter:stable]"
        >
          {/* Basic information */}
          <div>
            <div className={labelClass + " mb-2"}>Basic information</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Business name *</span>
                <input
                  className={fieldClass}
                  value={form.business_name}
                  onChange={(e) => set("business_name", e.target.value)}
                  placeholder="e.g. Spice Garden Restaurant"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Owner name *</span>
                <input
                  className={fieldClass}
                  value={form.owner_name}
                  onChange={(e) => set("owner_name", e.target.value)}
                  placeholder="Owner / contact person"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Phone *</span>
                <input
                  className={fieldClass}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+91 ..."
                />
              </label>
              <label className="block">
                <span className={labelClass}>WhatsApp number</span>
                <input
                  className={fieldClass}
                  value={form.whatsapp_number ?? ""}
                  onChange={(e) => set("whatsapp_number", e.target.value)}
                  placeholder="If different from phone"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Email</span>
                <input
                  type="email"
                  className={fieldClass}
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="name@business.com"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Business category</span>
                <Select
                  value={form.business_category || undefined}
                  onValueChange={(v) => set("business_category", v)}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Select category" />
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
              <label className="block">
                <span className={labelClass}>City / district</span>
                <input
                  className={fieldClass}
                  value={form.city ?? ""}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="e.g. Warangal"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelClass}>Address</span>
                <input
                  className={fieldClass}
                  value={form.address ?? ""}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Street, area"
                />
              </label>
            </div>
          </div>

          {/* Online presence — optional, collapsible so the fast path stays fast */}
          <div className="rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setShowOnlinePresence((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className={labelClass}>
                Online presence <span className="normal-case text-muted-foreground/70">(optional)</span>
              </span>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform ${showOnlinePresence ? "rotate-180" : ""}`}
              />
            </button>
            {showOnlinePresence && (
              <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Website URL</span>
                  <input
                    className={fieldClass}
                    value={form.website_url ?? ""}
                    onChange={(e) => set("website_url", e.target.value)}
                    placeholder="https://"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Instagram URL</span>
                  <input
                    className={fieldClass}
                    value={form.instagram_url ?? ""}
                    onChange={(e) => set("instagram_url", e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Google Maps URL</span>
                  <input
                    className={fieldClass}
                    value={form.google_maps_url ?? ""}
                    onChange={(e) => set("google_maps_url", e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Facebook URL</span>
                  <input
                    className={fieldClass}
                    value={form.facebook_url ?? ""}
                    onChange={(e) => set("facebook_url", e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </label>
              </div>
            )}
          </div>

          {/* Sales info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Priority</span>
              <Select
                value={form.priority}
                onValueChange={(v) => set("priority", v as LeadPriority)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          <label className="block">
            <span className={labelClass}>First note (optional)</span>
            <textarea
              className={fieldClass}
              rows={3}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="e.g. Owner appears in reels, no recent Instagram posts..."
            />
          </label>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex justify-end gap-2 pt-1">
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
