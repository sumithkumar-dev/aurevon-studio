import { Inbox, Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="animate-spin text-accent" size={16} />
        Loading leads...
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-secondary/20 p-4"
          >
            <div className="h-4 w-2/3 rounded-full bg-secondary" />
            <div className="mt-3 h-3 w-1/2 rounded-full bg-secondary/70" />
            <div className="mt-4 flex gap-2">
              <div className="h-7 w-24 rounded-full bg-secondary/80" />
              <div className="h-7 w-20 rounded-full bg-secondary/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="grid place-items-center px-5 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-2xl border border-border bg-secondary/50 text-accent">
        <Inbox size={22} />
      </div>
      <h3 className="mt-4 text-xl text-foreground">
        {hasFilters ? "No matching leads" : "No leads yet"}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Try adjusting your search or filters."
          : "New website submissions and manually added leads will appear here."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-5 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
