import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Section } from "@/components/site/Section";
import { CtaPanel } from "@/components/site/CtaPanel";
import { Globe, Rocket, RefreshCcw, Gauge } from "lucide-react";
import { useMeta } from "@/lib/use-meta";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
});

const SERVICES = [
  {
    Icon: Globe,
    title: "Business Websites",
    summary: "A complete online home for your business.",
    desc: "Multi-page sites built around what your customers actually need: clear services, easy contact, and a credible first impression.",
    points: ["Home, services, about, contact", "On-brand design system", "Search-engine ready", "Mobile-first layout"],
  },
  {
    Icon: Rocket,
    title: "Landing Pages",
    summary: "One focused page that does its job.",
    desc: "Perfect for a new offering, a single location, or a campaign. Built tight, fast, and easy to share.",
    points: ["Single clear purpose", "Built in under 2 weeks", "Optimized for sharing", "Easy to update"],
  },
  {
    Icon: RefreshCcw,
    title: "Website Redesign",
    summary: "Bring an outdated site back to life.",
    desc: "We rebuild aging websites into something that finally represents how good your business actually is — without losing what works.",
    points: ["Audit of current site", "Migration of useful content", "Modern, durable design", "Smooth launch"],
  },
  {
    Icon: Gauge,
    title: "Performance Optimization",
    summary: "Faster pages. Better experience.",
    desc: "We tune your existing site for speed, search and mobile — so visitors stay and convert instead of leaving.",
    points: ["Speed & Core Web Vitals", "Image & asset audit", "SEO fundamentals", "Mobile experience pass"],
  },
];

function ServicesPage() {
  useMeta({
    title: "Services — AUREVON",
    description:
      "Business websites, landing pages, redesigns and performance optimization — built for local businesses.",
  });
  return (
    <>
      <section className="pt-24 md:pt-28 pb-6">
        <div className="container-aurevon max-w-4xl">
          <div className="text-xs uppercase tracking-[0.3em] text-accent">Services</div>
          <h1 className="mt-4 text-5xl md:text-6xl text-balance leading-[1.05]">
            Websites built around the way your business <em className="text-accent not-italic">actually</em> works.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            Every engagement is shaped around real outcomes — clearer information, easier contact, stronger first impressions.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {SERVICES.map((s, i) => {
            const Icon = s.Icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: (i % 2) * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="surface-card p-8"
              >
                <div className="size-12 rounded-xl bg-secondary border border-border flex items-center justify-center mb-6">
                  <Icon size={20} strokeWidth={1.6} />
                </div>
                <h2 className="text-3xl text-foreground">{s.title}</h2>
                <p className="mt-1 text-accent text-sm">{s.summary}</p>
                <p className="mt-4 text-muted-foreground leading-relaxed">{s.desc}</p>
                <ul className="mt-6 grid sm:grid-cols-2 gap-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-foreground/80">
                      <span className="size-1.5 rounded-full bg-accent" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </Section>

      <Section>
        <CtaPanel />
      </Section>
    </>
  );
}
