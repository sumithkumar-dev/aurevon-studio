import { motion } from "framer-motion";

const STEPS = [
  { n: "01", t: "Discussion", d: "We learn about your business, customers, and what success looks like for you." },
  { n: "02", t: "Planning", d: "We map out structure, content and a clear scope — no surprises, no jargon." },
  { n: "03", t: "Design", d: "We craft a clean, on-brand design that earns trust on the first scroll." },
  { n: "04", t: "Development", d: "We build it fast, responsive, and ready for search engines and real customers." },
  { n: "05", t: "Launch", d: "We ship, train you on updates, and stay available for what comes next." },
];

export function ProcessTimeline() {
  return (
    <div className="relative">
        <div className="absolute left-3.5 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2" />
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ originY: 0 }}
        className="absolute left-3.5 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent via-accent/40 to-transparent md:-translate-x-1/2"
      />

      <ol className="space-y-12 md:space-y-20">
        {STEPS.map((s, i) => {
          const right = i % 2 === 1;
          return (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`relative md:grid md:grid-cols-2 md:gap-12 items-center ${right ? "" : ""}`}
            >
              <div className={`md:${right ? "col-start-2" : "col-start-1"} pl-10 md:pl-0 ${right ? "md:pl-12" : "md:pr-12 md:text-right"}`}>
                <div className="text-[11px] md:text-xs uppercase tracking-[0.22em] md:tracking-[0.3em] text-accent">Step {s.n}</div>
                <h3 className="text-2xl md:text-4xl text-foreground mt-2">{s.t}</h3>
                <p className="text-muted-foreground mt-3 max-w-md md:ml-auto">{s.d}</p>
              </div>

              <div className="absolute left-3.5 md:left-1/2 top-2 -translate-x-1/2 size-3 rounded-full bg-accent shadow-[0_0_16px_var(--accent)] ring-4 ring-background" />
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
