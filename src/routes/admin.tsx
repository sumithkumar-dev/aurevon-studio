import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// The entire admin CRM (Dashboard, ClientWorkspace, CallScriptPage, the
// proposal/invoice template engine, and the Supabase client it all shares)
// is only ever needed by someone actually navigating to /admin. Loading it
// via React.lazy() — rather than the static top-level import this used to
// be — makes Vite/Rollup emit it as its own chunk, so a marketing-site
// visitor (clinic/café/salon browsing on their phone) never downloads any
// of it. This is the single change that keeps the public bundle lean;
// nothing else about the route needs to change for it to take effect.
const AdminPage = lazy(() =>
  import("@/admin").then((m) => ({ default: m.AdminPage })),
);

function AdminRouteFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="surface-card flex w-full max-w-sm items-center gap-3 p-5 text-sm text-muted-foreground">
        <Loader2 className="animate-spin text-accent" size={18} />
        Loading admin...
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin")({
  component: () => (
    <Suspense fallback={<AdminRouteFallback />}>
      <AdminPage />
    </Suspense>
  ),
});
