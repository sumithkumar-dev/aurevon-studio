import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/site/Section";
import { ProcessTimeline } from "@/components/site/ProcessTimeline";
import { CtaPanel } from "@/components/site/CtaPanel";
import { useMeta } from "@/lib/use-meta";

export const Route = createFileRoute("/process")({
  component: ProcessPage,
});

function ProcessPage() {
  useMeta({
    title: "Process — AUREVON",
    description: "How AUREVON works with local businesses, from first conversation to launch.",
  });
  return (
    <>
      <section className="pt-24 md:pt-28 pb-6">
        <div className="container-aurevon max-w-4xl">
          <div className="text-xs uppercase tracking-[0.3em] text-accent">Process</div>
          <h1 className="mt-4 text-5xl md:text-6xl text-balance leading-[1.05]">
            A calm, structured way to build something <em className="text-accent not-italic">good</em>.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            Most websites stall because the process is unclear. Ours is built around quiet, predictable steps — so you always know where things are and what's next.
          </p>
        </div>
      </section>

      <Section>
        <ProcessTimeline />
      </Section>

      <Section>
        <CtaPanel />
      </Section>
    </>
  );
}
