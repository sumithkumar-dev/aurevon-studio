import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2, LogOut, Mail, Phone, Search, RefreshCw, Trash2, Download, Inbox, Building2,
} from "lucide-react";
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
};

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
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="animate-spin text-accent" />
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
        className="w-full max-w-md surface-card p-8"
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
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Password</label>
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
            {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in…</> : "Sign in"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Dashboard({ email }: { email: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter((l) =>
      [l.name, l.business_name, l.email, l.phone, l.industry, l.budget, l.message ?? ""]
        .some((v) => v.toLowerCase().includes(s)),
    );
  }, [leads, q]);

  async function deleteLead(id: string) {
    if (!confirm("Delete this submission permanently?")) return;
    const { error: err } = await supabase.from("contact_submissions").delete().eq("id", id);
    if (err) {
      alert(err.message);
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function exportCsv() {
    const headers = ["created_at", "name", "business_name", "email", "phone", "industry", "budget", "message"];
    const rows = filtered.map((l) =>
      headers.map((h) => {
        const v = (l as any)[h] ?? "";
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(","),
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
        <div className="container-aurevon h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
            <span className="font-display text-lg tracking-[0.2em]">AUREVON</span>
            <span className="ml-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground">{email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="container-aurevon py-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <StatCard label="Total leads" value={leads.length} Icon={Inbox} />
          <StatCard
            label="This week"
            value={leads.filter((l) => Date.now() - new Date(l.created_at).getTime() < 7 * 864e5).length}
            Icon={Mail}
          />
          <StatCard
            label="Unique businesses"
            value={new Set(leads.map((l) => l.business_name.toLowerCase())).size}
            Icon={Building2}
          />
        </div>

        {/* Toolbar */}
        <div className="surface-card p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, business…"
              className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent/60 transition-colors"
            />
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={!filtered.length}
            className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-2 text-sm hover:bg-accent-glow transition-colors disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {error && <div className="surface-card p-4 text-sm text-destructive mb-4">{error}</div>}

        {/* Table */}
        <div className="surface-card overflow-hidden">
          {loading ? (
            <div className="p-12 grid place-items-center text-muted-foreground">
              <Loader2 className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Inbox className="mx-auto mb-3 text-accent" />
              No submissions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Business</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Industry</th>
                    <th className="px-4 py-3 font-medium">Budget</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr
                      key={l.id}
                      className="border-t border-border hover:bg-secondary/30 cursor-pointer transition-colors"
                      onClick={() => setSelected(l)}
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-foreground">{l.name}</td>
                      <td className="px-4 py-3 text-foreground">{l.business_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{l.email}</div>
                        <div className="text-xs">{l.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{l.industry}</td>
                      <td className="px-4 py-3 text-accent">{l.budget}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteLead(l.id); }}
                          className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md h-full overflow-y-auto bg-surface border-l border-border p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-accent">Submission</div>
                <h2 className="mt-2 text-2xl text-foreground">{selected.business_name}</h2>
                <p className="text-sm text-muted-foreground">{selected.name}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground text-xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <Row label="Email" value={
                <a className="text-accent hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a>
              } />
              <Row label="Phone" value={
                <a className="text-accent hover:underline" href={`tel:${selected.phone}`}>
                  <span className="inline-flex items-center gap-1.5"><Phone size={12} /> {selected.phone}</span>
                </a>
              } />
              <Row label="Industry" value={selected.industry} />
              <Row label="Budget" value={selected.budget} />
              <Row label="Submitted" value={new Date(selected.created_at).toLocaleString()} />
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Message</div>
                <p className="mt-2 text-foreground whitespace-pre-wrap leading-relaxed">
                  {selected.message?.trim() || <span className="text-muted-foreground">No message.</span>}
                </p>
              </div>
            </dl>

            <div className="mt-8 flex gap-2">
              <a
                href={`mailto:${selected.email}?subject=Re: Your website inquiry`}
                className="flex-1 inline-flex justify-center items-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-2.5 text-sm hover:bg-accent-glow transition-colors"
              >
                <Mail size={14} /> Reply
              </a>
              <button
                onClick={() => deleteLead(selected.id)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, Icon }: { label: string; value: number; Icon: any }) {
  return (
    <div className="surface-card p-5 flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-display text-foreground">{value}</div>
      </div>
      <div className="size-10 rounded-xl bg-secondary border border-border grid place-items-center text-accent">
        <Icon size={18} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-foreground">{value}</div>
    </div>
  );
}
