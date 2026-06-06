import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { HeroNetwork } from "@/components/site/HeroNetwork";
import { Section } from "@/components/site/Section";
import { JourneyFlow } from "@/components/site/JourneyFlow";
import { Comparison } from "@/components/site/Comparison";
import { Benefits } from "@/components/site/Benefits";
import { PortfolioGrid } from "@/components/site/PortfolioGrid";
import { ProcessTimeline } from "@/components/site/ProcessTimeline";
import { Faq } from "@/components/site/Faq";
import { CtaPanel } from "@/components/site/CtaPanel";
import { useMeta } from "@/lib/use-meta";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  useMeta({
    title: "AUREVON — Premium Websites for Local Businesses",
    description:
      "AUREVON is a web studio designing professional, trustworthy websites for cafes, clinics, gyms and salons across Telangana.",
  });
  return (
    <>
      {/* HERO */}
      <section className="relative pt-24 md:pt-32 pb-10 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--accent)_12%,transparent),transparent_60%)]" />
        <div className="container-aurevon grid min-w-0 gap-9 md:gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[11px] min-[390px]:text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent" />
              For clinic, café & salon owners in Telangana
            </div>
            <h1 className="mt-5 md:mt-6 text-[2.35rem] min-[390px]:text-[2.6rem] sm:text-5xl md:text-6xl lg:text-7xl text-balance leading-[1.06] md:leading-[1.05]">
              Your customers decide in seconds whether they{" "}
              <em className="text-accent not-italic">trust</em> you.
            </h1>
            <p className="mt-5 md:mt-6 text-base md:text-xl text-muted-foreground max-w-xl text-balance leading-relaxed">
              When someone searches for your clinic, café, or salon — what they find should feel as
              professional as the service you deliver inside. That's what we build.
            </p>
            <div className="mt-7 md:mt-8 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex w-full min-[390px]:w-auto items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-sm font-medium hover:bg-accent-glow transition-colors"
              >
                Request Proposal <ArrowUpRight size={16} />
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex w-full min-[390px]:w-auto items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                View portfolio
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroNetwork />
            <p className="text-center text-xs text-muted-foreground mt-3 md:mt-4 max-w-xs md:max-w-sm mx-auto">
              One place where hours, services, and contact details always stay clear.
            </p>
          </motion.div>
        </div>
      </section>

      <Section
        className="section-divider"
        eyebrow="The customer journey"
        title={
          <>
            People near you are <em className="text-accent not-italic">already</em> searching.
          </>
        }
        intro="Every day, someone in Hyderabad or Secunderabad looks for a clinic, café, or salon like yours. What shows up in that moment decides whether they call you — or your competitor."
      >
        <JourneyFlow />
      </Section>

      <Section
        className="section-divider"
        eyebrow="Missed opportunities"
        title="Same customer. Two very different outcomes."
        intro="When your business doesn't show up clearly online, you don't just miss a click — you lose someone who was ready to walk in or book today."
      >
        <Comparison />
      </Section>

      <Section
        className="section-divider"
        eyebrow="What you get"
        title="A website that works as hard as you do."
        intro="Not a brochure — a tool that handles the moments that turn a curious visitor into a paying customer."
      >
        <Benefits />
      </Section>

      <Section
        className="section-divider"
        eyebrow="Real examples"
        title="See what this looks like for businesses like yours."
        intro="Clinics and cafés across Telangana — each built so customers find hours, services, and contact details without picking up the phone first."
      >
        <PortfolioGrid variant="preview" />
        <div className="mt-12">
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 text-sm text-foreground hover:text-accent transition-colors"
          >
            Read the full case studies <ArrowUpRight size={14} />
          </Link>
        </div>
      </Section>

      <Section
        className="section-divider"
        eyebrow="How it works"
        title="Simple steps. No surprises."
        intro="You stay focused on running your business — we handle design, build, and launch with a process you can follow at every stage."
      >
        <ProcessTimeline />
      </Section>

      <Section
        className="section-divider"
        eyebrow="Common questions"
        title="Straight answers for business owners."
      >
        <Faq />
      </Section>

      <Section className="section-divider !pb-20 md:!pb-28">
        <CtaPanel />
      </Section>
    </>
  );
}
