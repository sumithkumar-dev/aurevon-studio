import { useEffect } from "react";
import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "../components/site/Navbar";
import { Footer } from "../components/site/Footer";

/**
 * Radix UI (Select, AlertDialog, Dialog, etc.) locks `<body>` with
 * `pointer-events: none` while an overlay is open, and un-locks it when the
 * overlay closes. If the tab loses focus while one is open or mid-transition
 * — e.g. generating a document opens a new tab for the print dialog, and
 * the user switches back afterwards — the un-lock can be missed, leaving
 * every button on the page silently unclickable with no visible error.
 *
 * This is a defensive safety net, not a fix for a specific component: on
 * every regained focus, if the lock is present but nothing is actually open,
 * clear it.
 */
function useStuckPointerLockGuard() {
  useEffect(() => {
    function clearIfStuck() {
      if (document.body.style.pointerEvents !== "none") return;
      const openOverlay = document.querySelector(
        '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"], [data-state="open"][role="listbox"], [data-state="open"][role="menu"]',
      );
      if (!openOverlay) {
        document.body.style.removeProperty("pointer-events");
      }
    }
    window.addEventListener("focus", clearIfStuck);
    document.addEventListener("visibilitychange", clearIfStuck);
    return () => {
      window.removeEventListener("focus", clearIfStuck);
      document.removeEventListener("visibilitychange", clearIfStuck);
    };
  }, []);
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-glow"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  // eslint-disable-next-line no-console
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-glow"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-border px-5 py-2.5 text-sm text-foreground hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * /admin is now a separate lazy-loaded chunk (see routes/admin.tsx) so the
 * public marketing bundle doesn't ship the whole CRM. The one trade-off:
 * navigating to /admin now needs one extra chunk fetch instead of already
 * having the code in memory. This warms that chunk in the background once
 * the browser is idle, so by the time someone actually opens /admin it's
 * usually already cached. A hard reload while already on /admin still pays
 * for one chunk fetch — same as any other code-split route — since there's
 * no idle time to warm it before the page needs it.
 */
function useIdlePrefetchAdminChunk() {
  useEffect(() => {
    const win = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
    };
    const schedule = win.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    const id = schedule(() => {
      import("@/admin").catch(() => {
        // Best-effort warm-up only — a failure here just means the normal
        // on-demand load will happen instead.
      });
    });
    return () => {
      if (typeof id === "number" && win.requestIdleCallback === undefined) {
        window.clearTimeout(id);
      }
    };
  }, []);
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");
  useStuckPointerLockGuard();
  useIdlePrefetchAdminChunk();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isAdmin && <Navbar />}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}
