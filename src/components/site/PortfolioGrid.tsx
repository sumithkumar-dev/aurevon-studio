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
      className={`browser-mockup w-full max-w-full min-w-0 rounded-xl md:rounded-2xl overflow-hidden bg-surface transition-transform duration-500 group-hover/mockup:-translate-y-1 ${
        isLarge ? "browser-mockup-lg" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex gap-1.5 shrink-0">
          <span className="size-2.5 md:size-3 rounded-full bg-[#FF5F57]" aria-hidden />
          <span className="size-2.5 md:size-3 rounded-full bg-[#FEBC2E]" aria-hidden />
          <span className="size-2.5 md:size-3 rounded-full bg-[#28C840]" aria-hidden />
        </div>
        <div className="flex-1 flex items-center gap-1.5 md:gap-2 min-w-0 max-w-full rounded-lg bg-secondary/80 border border-border px-2.5 md:px-3 py-1.5">
          <Lock size={11} className="shrink-0 text-muted-foreground/70" aria-hidden />
          <span className="block min-w-0 max-w-full text-[10px] min-[390px]:text-[11px] text-muted-foreground truncate font-mono">
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
      className="group flex w-full max-w-full min-w-0 flex-col overflow-hidden surface-card p-4 md:p-6 hover:border-accent/40 hover:glow-ring transition-all duration-300"
    >
      <div className="group/mockup w-full max-w-full min-w-0 overflow-hidden">
        <BrowserMockup project={project} />
      </div>

      <div className="flex min-w-0 flex-col flex-1 mt-4 md:mt-6">
        <div className="flex min-w-0 items-center gap-2 flex-wrap">
          <span className="max-w-full text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] text-accent font-medium">
            {project.category}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="inline-flex min-w-0 max-w-full items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin size={11} className="shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{project.location}</span>
          </span>
        </div>
        <h3 className="text-lg min-[390px]:text-xl md:text-2xl text-foreground mt-2 break-words">{project.title}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2 break-words">
          {project.tagline}
        </p>

        <div className="mt-4 flex min-w-0 flex-wrap gap-1.5">
          {project.highlights.slice(0, 3).map((h) => (
            <span
              key={h}
              className="max-w-full break-words text-[10px] min-[390px]:text-[11px] leading-snug px-2 py-1 rounded-full bg-secondary/80 border border-border text-muted-foreground"
            >
              {h}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-5 flex min-w-0 items-center justify-between gap-3">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-foreground/80 group-hover:text-accent transition-colors">
            View live site <ArrowUpRight size={14} />
          </span>
          <div className="hidden min-[390px]:flex shrink-0 size-8 md:size-9 rounded-full bg-secondary border border-border items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
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
      className="surface-card w-full max-w-full min-w-0 overflow-hidden"
    >
      <div
        className={`grid min-w-0 lg:grid-cols-2 gap-0 ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}
      >
        <div className="min-w-0 p-5 md:p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex min-w-0 items-center gap-2 flex-wrap">
            <span className="max-w-full text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] text-accent font-medium">
              {project.category}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex min-w-0 max-w-full items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin size={11} className="shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{project.location}</span>
            </span>
          </div>

          <h3 className="text-2xl md:text-4xl text-foreground mt-3 text-balance break-words">
            {project.title}
          </h3>
          <p className="text-base text-muted-foreground mt-3 leading-relaxed break-words">{project.tagline}</p>

          <div className="mt-6 md:mt-8 space-y-5 md:space-y-6">
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                The problem
              </h4>
              <p className="text-sm text-foreground/85 leading-relaxed break-words">{project.challenge}</p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                What we built
              </h4>
              <p className="text-sm text-foreground/85 leading-relaxed break-words">{project.built}</p>
            </div>
          </div>

          <div className="mt-6 md:mt-8 flex min-w-0 flex-wrap gap-2">
            {project.highlights.map((h) => (
              <span
                key={h}
                className="max-w-full break-words text-[11px] md:text-xs leading-snug px-2.5 md:px-3 py-1.5 rounded-full bg-secondary/80 border border-border text-foreground/75"
              >
                {h}
              </span>
            ))}
          </div>
        </div>

        <div
          className={`min-w-0 p-5 md:p-8 lg:p-10 bg-background/30 border-t lg:border-t-0 border-border flex flex-col justify-center ${
            reversed ? "lg:border-r" : "lg:border-l"
          }`}
        >
          <div className="group/mockup w-full max-w-full min-w-0 overflow-hidden">
            <BrowserMockup project={project} size="large" />
          </div>

          <div className="mt-6 md:mt-8 grid min-w-0 gap-2.5 md:gap-3 sm:grid-cols-3">
            {project.outcomes.map((o) => (
              <div key={o.label} className="min-w-0 rounded-xl bg-secondary/50 border border-border p-3 md:p-4">
                <div className="text-[10px] uppercase tracking-[0.12em] md:tracking-[0.15em] text-accent break-words">{o.label}</div>
                <p className="text-sm text-foreground/90 mt-1.5 leading-snug break-words">{o.value}</p>
              </div>
            ))}
          </div>

          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 md:mt-8 inline-flex w-full md:w-fit items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-5 md:px-6 py-3 text-sm font-medium hover:bg-accent-glow transition-colors"
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
      <div className="w-full max-w-full min-w-0 space-y-8 md:space-y-14">
        {CASE_STUDIES.map((project, i) => (
          <CaseStudyCard key={`${project.url}-${i}`} project={project} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-full min-w-0 grid-cols-1 gap-5 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
      {CASE_STUDIES.map((project, i) => (
        <PreviewCard key={`${project.url}-${i}`} project={project} index={i} />
      ))}
    </div>
  );
}
