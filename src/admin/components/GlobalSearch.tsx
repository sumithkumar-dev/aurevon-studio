import { useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Search, User, X } from "lucide-react";
import type { Client, Lead } from "../types";

function leadHaystack(l: Lead): string {
  return [
    l.business_name,
    l.owner_name,
    l.name,
    l.phone,
    l.whatsapp_number ?? "",
    l.instagram_url ?? "",
    l.google_maps_url ?? "",
    l.city ?? "",
    l.research_notes ?? "",
    l.general_notes ?? "",
    l.pain_points ?? "",
    l.objections ?? "",
    l.next_best_action ?? "",
    l.future_plans ?? "",
    l.decision_maker ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function clientHaystack(c: Client): string {
  return [
    c.business_name,
    c.client_name,
    c.owner_name ?? "",
    c.phone,
    c.email,
    c.business_website ?? "",
    c.current_features ?? "",
    c.terms_notes ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export function GlobalSearch({
  leads,
  clients,
  onSelectLead,
  onSelectClient,
}: {
  leads: Lead[];
  clients: Client[];
  onSelectLead: (lead: Lead) => void;
  onSelectClient: (client: Client) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const q = query.trim().toLowerCase();

  const matchedLeads = useMemo(() => {
    if (!q) return [];
    return leads.filter((l) => leadHaystack(l).includes(q)).slice(0, 5);
  }, [leads, q]);

  const matchedClients = useMemo(() => {
    if (!q) return [];
    return clients.filter((c) => clientHaystack(c).includes(q)).slice(0, 5);
  }, [clients, q]);

  const hasResults = matchedLeads.length > 0 || matchedClients.length > 0;

  return (
    <div ref={rootRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search leads, clients, notes..."
          className="w-full rounded-full border border-border bg-background/60 py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && q && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          {!hasResults ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              No matches for "{query}"
            </p>
          ) : (
            <>
              {matchedLeads.length > 0 && (
                <div className="mb-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Leads
                  </div>
                  {matchedLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => {
                        onSelectLead(lead);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-secondary/40"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-accent">
                        <User size={14} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-foreground">
                          {lead.business_name || "Untitled business"}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {lead.owner_name} · {lead.phone}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {matchedClients.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Clients
                  </div>
                  {matchedClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        onSelectClient(client);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-secondary/40"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-accent">
                        <Briefcase size={14} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-foreground">
                          {client.business_name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {client.client_name} · {client.phone}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
