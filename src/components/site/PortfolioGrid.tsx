import { motion } from "framer-motion";
import { ArrowUpRight, Lock, MapPin } from "lucide-react";
import { CASE_STUDIES as caseStudiesData, type CaseStudy } from "@/lib/portfolio-projects";

const CASE_STUDIES = (Array.isArray(caseStudiesData) ? caseStudiesData : []).filter(
  (project): project is CaseStudy => Boolean(project?.url && project?.title && project?.category),
);

function displayUrl(url: string | undefined) {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function BrowserMockup({
  project,
  size = "default",
}: {
  project: CaseStudy;
  size?: "default" | "large";
}) {
  if (!project.url) return null;

  const isLarge = size === "large";

  return (
    <div
      className={`browser-mockup rounded-2xl overflow-hidden bg-surface transition-transform duration-500 group-hover/mockup:-translate-y-1 ${
        isLarge ? "browser-mockup-lg" : ""
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex gap-1.5 shrink-0">
          <span className="size-3 rounded-full bg-[#FF5F57]" aria-hidden />
          <span className="size-3 rounded-full bg-[#FEBC2E]" aria-hidden />
          <span className="size-3 rounded-full bg-[#28C840]" aria-hidden />
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0 rounded-lg bg-secondary/80 border border-border px-3 py-1.5">
          <Lock size={11} className="shrink-0 text-muted-foreground/70" aria-hidden />
          <span className="text-[11px] text-muted-foreground truncate font-mono">
            {displayUrl(project.url)}
          </span>
        </div>
      </div>
      <div
        className={`relative overflow-hidden bg-background ${isLarge ? "aspect-[16/10]" : "aspect-[16/11]"}`}
      >
        <img
			src={project.image}
			alt={project.title}
			loading="lazy"
			className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
		/>
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

function PreviewCard({ project, index }: { project: CaseStudy; index: number }) {
  return (
    <motion.a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col surface-card p-5 md:p-6 hover:border-accent/40 hover:glow-ring transition-all duration-300"
    >
      <div className="group/mockup">
        <BrowserMockup project={project} />
      </div>

      <div className="flex flex-col flex-1 mt-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-medium">
            {project.category}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin size={11} aria-hidden />
            {project.location}
          </span>
        </div>
        <h3 className="text-xl md:text-2xl text-foreground mt-2">{project.title}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
          {project.tagline}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.highlights.slice(0, 3).map((h) => (
            <span
              key={h}
              className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/80 border border-border text-muted-foreground"
            >
              {h}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-5 flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-sm text-foreground/80 group-hover:text-accent transition-colors">
            View live site <ArrowUpRight size={14} />
          </span>
          <div className="shrink-0 size-9 rounded-full bg-secondary border border-border flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
            <ArrowUpRight size={16} />
          </div>
        </div>
      </div>
    </motion.a>
  );
}

function CaseStudyCard({ project, index }: { project: CaseStudy; index: number }) {
  const reversed = index % 2 === 1;

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="surface-card overflow-hidden"
    >
      <div
        className={`grid lg:grid-cols-2 gap-0 ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}
      >
        <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-medium">
              {project.category}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin size={11} aria-hidden />
              {project.location}
            </span>
          </div>

          <h3 className="text-3xl md:text-4xl text-foreground mt-3 text-balance">
            {project.title}
          </h3>
          <p className="text-base text-muted-foreground mt-3 leading-relaxed">{project.tagline}</p>

          <div className="mt-8 space-y-6">
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                The problem
              </h4>
              <p className="text-sm text-foreground/85 leading-relaxed">{project.challenge}</p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                What we built
              </h4>
              <p className="text-sm text-foreground/85 leading-relaxed">{project.built}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {project.highlights.map((h) => (
              <span
                key={h}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary/80 border border-border text-foreground/75"
              >
                {h}
              </span>
            ))}
          </div>
        </div>

        <div
          className={`p-6 md:p-8 lg:p-10 bg-background/30 border-t lg:border-t-0 border-border flex flex-col justify-center ${
            reversed ? "lg:border-r" : "lg:border-l"
          }`}
        >
          <div className="group/mockup">
            <BrowserMockup project={project} size="large" />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {project.outcomes.map((o) => (
              <div key={o.label} className="rounded-xl bg-secondary/50 border border-border p-4">
                <div className="text-[10px] uppercase tracking-[0.15em] text-accent">{o.label}</div>
                <p className="text-sm text-foreground/90 mt-1.5 leading-snug">{o.value}</p>
              </div>
            ))}
          </div>

          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-sm font-medium hover:bg-accent-glow transition-colors w-fit"
          >
            Visit {project.title} <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </motion.article>
  );
}

export function PortfolioGrid({ variant = "preview" }: { variant?: "preview" | "detailed" }) {
  if (variant === "detailed") {
    return (
      <div className="space-y-10 md:space-y-14">
        {CASE_STUDIES.map((project, i) => (
          <CaseStudyCard key={`${project.url}-${i}`} project={project} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {CASE_STUDIES.map((project, i) => (
        <PreviewCard key={`${project.url}-${i}`} project={project} index={i} />
      ))}
    </div>
  );
}
