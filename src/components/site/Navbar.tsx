import { Link, useRouterState } from "@tanstack/react-router";
import aurevonLogoLight from "@/assets/logo/aurevon-logo-light.svg";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/services", label: "Services" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/process", label: "Process" },
  { to: "/contact", label: "Contact" },
] as const;

type Rect = { left: number; width: number };

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hoverRect, setHoverRect] = useState<Rect | null>(null);
  const [activeRect, setActiveRect] = useState<Rect | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const { location } = useRouterState();

  // Scroll background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile drawer on route change + lock body scroll
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Measure active pill position whenever route or layout changes
  const measureActive = () => {
    const activeLink = links.find((l) => location.pathname.startsWith(l.to));
    if (!activeLink || !navRef.current) {
      setActiveRect(null);
      return;
    }
    const el = itemRefs.current[activeLink.to];
    const parent = navRef.current.getBoundingClientRect();
    if (!el) {
      setActiveRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setActiveRect({ left: r.left - parent.left, width: r.width });
  };

  useEffect(() => {
    measureActive();
    const ro = new ResizeObserver(() => measureActive());
    if (navRef.current) ro.observe(navRef.current);
    window.addEventListener("resize", measureActive);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureActive);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleHover = (to: string) => {
    if (!navRef.current) return;
    const el = itemRefs.current[to];
    if (!el) return;
    const parent = navRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setHoverRect({ left: r.left - parent.left, width: r.width });
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled || open
          ? "backdrop-blur-xl bg-background/70 border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container-aurevon flex h-14 md:h-18 items-center justify-between">
        {/* Logo always goes home */}
        <Link
          to="/"
          aria-label="AUREVON Studios - Home"
          className="group flex min-w-0 items-center"
        >
          <img
            src={aurevonLogoLight}
            alt="Aurevon Studios"
            width="160"
            height="40"
            className="h-9 w-auto transition-opacity duration-300 group-hover:opacity-80"
            loading="eager"
          />
        </Link>

        {/* Desktop nav */}
        <nav
          ref={navRef}
          onMouseLeave={() => setHoverRect(null)}
          className="relative hidden md:flex items-center gap-1"
        >
          {/* Hover background pill */}
          <AnimatePresence>
            {hoverRect && (
              <motion.span
                key="hover"
                layoutId="nav-hover"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  left: hoverRect.left,
                  width: hoverRect.width,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 32,
                  mass: 0.6,
                }}
                className="absolute top-1/2 -translate-y-1/2 h-9 rounded-full bg-secondary/80 pointer-events-none"
                style={{ left: hoverRect.left, width: hoverRect.width }}
              />
            )}
          </AnimatePresence>

          {/* Active moving indicator */}
          {activeRect && (
            <motion.span
              layout
              initial={false}
              animate={{ left: activeRect.left, width: activeRect.width }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 30,
                mass: 0.7,
              }}
              className="absolute -bottom-1 h-[2px] rounded-full bg-accent shadow-[0_0_12px_var(--accent)] pointer-events-none"
              style={{ left: activeRect.left, width: activeRect.width }}
            />
          )}

          {links.map((l) => {
            const isActive = location.pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                ref={(el) => {
                  itemRefs.current[l.to] = el;
                }}
                onMouseEnter={() => handleHover(l.to)}
                onFocus={() => handleHover(l.to)}
                className={`relative z-10 px-4 py-2 text-sm tracking-wide transition-colors duration-300 ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <Link
            to="/contact"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:shadow-[0_0_28px_color-mix(in_oklab,var(--accent)_45%,transparent)]"
          >
            <span className="relative z-10">Request Proposal</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden relative size-9 grid place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "x" : "m"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="md:hidden fixed inset-0 top-14 bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              key="drawer"
              initial={{ y: "-100%", opacity: 0.4 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
              className="md:hidden fixed left-3 right-3 top-16 z-50 max-h-[calc(100dvh-4.5rem)] rounded-2xl border border-border bg-background/95 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.55)] overflow-y-auto overflow-x-hidden"
            >
              <div className="p-4 min-[390px]:p-5 flex flex-col">
                <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mb-3">
                  Menu
                </div>
                <nav className="flex flex-col">
                  {links.map((l, i) => {
                    const isActive = location.pathname.startsWith(l.to);
                    return (
                      <motion.div
                        key={l.to}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                      >
                        <Link
                          to={l.to}
                          className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-xl min-[390px]:text-[1.35rem] font-display tracking-wide transition-all duration-300 ${
                            isActive
                              ? "text-accent bg-secondary/60"
                              : "text-foreground hover:bg-secondary/40"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={`size-1.5 rounded-full transition-all ${
                                isActive
                                  ? "bg-accent shadow-[0_0_10px_var(--accent)] scale-100"
                                  : "bg-muted-foreground/40 scale-75 group-hover:bg-accent group-hover:scale-100"
                              }`}
                            />
                            {l.label}
                          </span>
                          <span
                            className={`text-xs tracking-[0.2em] transition-opacity ${
                              isActive ? "opacity-100 text-accent" : "opacity-0"
                            }`}
                          >
                            ACTIVE
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="mt-5"
                >
                  <Link
                    to="/contact"
                    className="flex items-center justify-center rounded-full bg-accent text-accent-foreground px-5 py-3 text-sm font-medium hover:bg-accent-glow transition-colors"
                  >
                    Request Proposal
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
