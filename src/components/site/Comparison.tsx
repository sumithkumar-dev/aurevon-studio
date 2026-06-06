import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const left = [
  "Customer searches your business",
  "No website or only social profiles",
  "Cannot find timings, services, prices",
  "Loses trust and chooses a competitor",
];
const right = [
  "Customer searches your business",
  "A clean, professional website appears",
  "Finds exactly what they need in seconds",
  "Calls, books, or visits with confidence",
];

function Column({
  variant,
  title,
  items,
}: {
  variant: "miss" | "win";
  title: string;
  items: string[];
}) {
  const isWin = variant === "win";
  const Icon = isWin ? Check : X;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`surface-card p-5 md:p-9 relative overflow-hidden ${isWin ? "glow-ring" : ""}`}
    >
      <div className="flex items-center gap-2 mb-5 md:mb-8">
        <span
          className={`text-[11px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.25em] ${
            isWin ? "text-accent" : "text-muted-foreground"
          }`}
        >
          {title}
        </span>
      </div>

      <ol className="space-y-4 md:space-y-5">
        {items.map((t, i) => (
          <motion.li
            key={t}
            initial={{ opacity: 0, x: isWin ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex gap-3 md:gap-4 items-start"
          >
            <div
              className={`mt-0.5 size-6 shrink-0 rounded-full flex items-center justify-center ${
                isWin ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Icon size={13} strokeWidth={2.5} />
            </div>
            <div className="text-sm md:text-base text-foreground/90">{t}</div>
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
}

export function Comparison() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Column variant="miss" title="Without a website" items={left} />
      <Column variant="win" title="With a professional website" items={right} />
    </div>
  );
}
