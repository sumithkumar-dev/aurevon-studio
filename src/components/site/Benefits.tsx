import { motion } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  Smartphone,
  Info,
  Eye,
  ShieldCheck,
} from "lucide-react";

const items = [
  {
    Icon: Sparkles,
    t: "Better first impressions",
    d: "A polished website signals quality before a customer ever walks in.",
  },
  {
    Icon: MessageSquare,
    t: "Easier customer contact",
    d: "Clear ways to call, message, book, or get directions - without friction.",
  },
  {
    Icon: Smartphone,
    t: "Mobile-first experience",
    d: "Designed for the way customers actually browse - fast, on phones.",
  },
  {
    Icon: Info,
    t: "Clear business information",
    d: "Hours, services, menu, prices, location - exactly where people look.",
  },
  {
    Icon: Eye,
    t: "Stronger visibility",
    d: "Built so search engines and maps understand and surface your business.",
  },
  {
    Icon: ShieldCheck,
    t: "Professional credibility",
    d: "Looks and feels trustworthy - the kind of business people pick first.",
  },
];

export function Benefits() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((it, i) => {
        const Icon = it.Icon;
        return (
          <motion.div
            key={it.t}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              delay: (i % 3) * 0.08,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group surface-card p-5 md:p-6 hover:border-accent/40 transition-colors"
          >
            <div className="size-11 rounded-xl bg-secondary border border-border flex items-center justify-center mb-5 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
              <Icon size={18} strokeWidth={1.6} />
            </div>
            <h3 className="text-lg md:text-xl text-foreground">{it.t}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {it.d}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
