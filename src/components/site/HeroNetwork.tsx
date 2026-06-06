import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Camera, MessageCircle, Users, Globe, type LucideIcon } from "lucide-react";

type Node = {
  key: string;
  label: string;
  Icon: LucideIcon;
  angle: number;
  radius: number;
};

const NODES: Node[] = [
  { key: "search", label: "Google Search", Icon: Search, angle: -150, radius: 42 },
  { key: "maps", label: "Google Maps", Icon: MapPin, angle: -90, radius: 44 },
  { key: "ig", label: "Instagram", Icon: Camera, angle: -30, radius: 42 },
  { key: "wa", label: "WhatsApp", Icon: MessageCircle, angle: 30, radius: 42 },
  { key: "cust", label: "Customers", Icon: Users, angle: 90, radius: 44 },
  { key: "other", label: "Referrals", Icon: Globe, angle: 150, radius: 42 },
];

function polar(angleDeg: number, radiusPct: number) {
  const a = (angleDeg * Math.PI) / 180;
  return {
    x: 50 + Math.cos(a) * radiusPct,
    y: 50 + Math.sin(a) * radiusPct,
  };
}

/**
 * Robust mount gate.
 *
 * Root cause of "animation only plays after navigating away and back":
 * Framer Motion's `initial` prop is applied during the very first paint. If
 * the component is mounted while the browser is still hydrating styles /
 * fonts, the transition can be skipped — the element snaps to the `animate`
 * state without interpolating. We force a single rAF tick before flipping
 * the gate, which guarantees that the `initial` styles are committed first,
 * and the transition reliably plays on the next frame.
 */
function useReadyToAnimate() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);
  return ready;
}

export function HeroNetwork() {
  const ready = useReadyToAnimate();
  const state = ready ? "shown" : "hidden";

  return (
    <div className="relative aspect-square w-full max-w-[560px] mx-auto">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_60%)]" />

      {[0.95, 0.7, 0.45].map((s, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-border"
          style={{ transform: `scale(${s})` }}
          variants={{ hidden: { opacity: 0 }, shown: { opacity: 0.6 - i * 0.15 } }}
          initial="hidden"
          animate={state}
          transition={{ delay: 0.2 + i * 0.15, duration: 0.8 }}
        />
      ))}

      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <linearGradient id="line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="hub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-glow)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </radialGradient>
        </defs>

        {NODES.map((n, i) => {
          const p = polar(n.angle, n.radius);
          return (
            <g key={n.key}>
              <motion.line
                x1={50}
                y1={50}
                x2={p.x}
                y2={p.y}
                stroke="var(--color-border)"
                strokeWidth={0.25}
                variants={{
                  hidden: { pathLength: 0, opacity: 0 },
                  shown: { pathLength: 1, opacity: 1 },
                }}
                initial="hidden"
                animate={state}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.7 }}
              />
              {ready && (
                <motion.circle
                  r={0.7}
                  fill="var(--accent-glow)"
                  initial={{ cx: p.x, cy: p.y, opacity: 0 }}
                  animate={{
                    cx: [p.x, 50],
                    cy: [p.y, 50],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2.4,
                    delay: 1.4 + i * 0.25,
                    repeat: Infinity,
                    repeatDelay: 1.6,
                    ease: "easeInOut",
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {NODES.map((n, i) => {
        const p = polar(n.angle, n.radius);
        const Icon = n.Icon;
        return (
          <motion.div
            key={n.key}
            variants={{
              hidden: { opacity: 0, scale: 0.6 },
              shown: { opacity: 1, scale: 1 },
            }}
            initial="hidden"
            animate={state}
            transition={{ delay: 0.6 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 md:size-14 rounded-2xl bg-surface border border-border flex items-center justify-center text-foreground shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                <Icon size={20} strokeWidth={1.6} />
              </div>
              <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">{n.label}</span>
            </div>
          </motion.div>
        );
      })}

      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.6 },
          shown: { opacity: 1, scale: 1 },
        }}
        initial="hidden"
        animate={state}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={
            ready
              ? {
                  boxShadow: [
                    "0 0 0 0 color-mix(in oklab, var(--accent) 40%, transparent)",
                    "0 0 0 18px color-mix(in oklab, var(--accent) 0%, transparent)",
                  ],
                }
              : undefined
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          className="rounded-3xl"
        >
          <div className="surface-card glow-ring px-5 py-4 md:px-6 md:py-5 flex items-center gap-3">
            <div className="size-9 md:size-10 rounded-xl bg-accent flex items-center justify-center">
              <Globe className="text-accent-foreground" size={18} />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your</div>
              <div className="text-base md:text-lg text-foreground font-display">Website</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
