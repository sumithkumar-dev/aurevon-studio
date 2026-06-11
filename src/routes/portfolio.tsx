import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/site/Section";
import { PortfolioGrid } from "@/components/site/PortfolioGrid";
import { CtaPanel } from "@/components/site/CtaPanel";
import { useMeta } from "@/lib/use-meta";

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
});

function PortfolioPage() {
  useMeta({
    title: "Portfolio - AUREVON",
    description:
      "Case studies from AUREVON - dental clinics, dermatology practices, and cafés across Telangana.",
  });
  return (
    <>
      <section className="pt-[5.5rem] md:pt-32 pb-4 md:pb-8">
        <div className="container-aurevon max-w-4xl">
          <div className="flex items-center gap-2 mb-5">
            <span className="size-1.5 rounded-full bg-accent" />
            <span className="text-[11px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.25em] text-muted-foreground">
              Portfolio
            </span>
          </div>
          <h1 className="text-[2.35rem] min-[390px]:text-[2.6rem] md:text-6xl text-balance leading-[1.06] md:leading-[1.05]">
            What a professional website looks like for{" "}
            <em className="text-accent not-italic">your</em> kind of business.
          </h1>
          <p className="mt-5 md:mt-6 text-base md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Real examples for clinics and cafés across Telangana - built so
            customers find what they need, trust what they see, and know exactly
            how to reach you.
          </p>
        </div>
      </section>

      <Section className="!pt-0">
        <PortfolioGrid variant="detailed" />
      </Section>

      <Section className="section-divider">
        <CtaPanel />
      </Section>
    </>
  );
}
