import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export function CtaPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden surface-card p-10 md:p-16 text-center"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,color-mix(in_oklab,var(--accent)_30%,transparent),transparent_60%)] pointer-events-none" />
      <div className="relative">
        <div className="text-xs uppercase tracking-[0.3em] text-accent">Ready when you are</div>
        <h2 className="mt-5 text-4xl md:text-6xl text-balance max-w-3xl mx-auto">
          Give your business the online presence it deserves.
        </h2>
        <p className="mt-5 text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Tell us about your clinic, café, or shop. We'll send a clear proposal — what we'll build,
          how long it takes, and what it costs. No pressure, no jargon.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-sm font-medium hover:bg-accent-glow transition-colors"
          >
            Request Proposal <ArrowUpRight size={16} />
          </Link>
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
          >
            See examples first
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
