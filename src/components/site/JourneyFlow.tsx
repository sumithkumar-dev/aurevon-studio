import { motion } from "framer-motion";
import { User, Search, Globe, Phone } from "lucide-react";

const steps = [
  { Icon: User, label: "Customer", sub: "has a need" },
  { Icon: Search, label: "Search / Maps / Instagram", sub: "looks for options" },
  { Icon: Globe, label: "Your Website", sub: "decides if you're a fit" },
  { Icon: Phone, label: "Calls · WhatsApps · Visits", sub: "becomes a customer" },
];

export function JourneyFlow() {
  return (
    <div className="relative">
      <div className="grid gap-4 md:grid-cols-4">
        {steps.map((s, i) => {
          const Icon = s.Icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative surface-card p-5 md:p-6"
            >
              <div className="flex items-center justify-between mb-5 md:mb-6">
                <div className="size-10 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <Icon size={18} strokeWidth={1.6} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">0{i + 1}</span>
              </div>
              <div className="text-base text-foreground font-sans font-medium">{s.label}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.sub}</div>

              {i < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + 0.3, duration: 0.5 }}
                    className="origin-left h-px w-6 bg-gradient-to-r from-accent to-transparent"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* moving dot along the journey */}
      <div className="mt-10 relative h-px bg-border overflow-hidden rounded-full">
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]"
          animate={{ left: ["0%", "100%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
