export function StatCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number | string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: "accent" | "blue" | "red" | "green" | "violet";
}) {
  const toneClass = {
    accent: "text-accent bg-accent/10",
    blue: "text-sky-300 bg-sky-400/10",
    red: "text-rose-300 bg-rose-400/10",
    green: "text-emerald-300 bg-emerald-400/10",
    violet: "text-violet-300 bg-violet-400/10",
  }[tone];

  return (
    <div className="surface-card min-w-0 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 truncate text-3xl font-display text-foreground">
            {value}
          </div>
        </div>
        <div
          className={`grid size-10 shrink-0 place-items-center rounded-xl border border-border ${toneClass}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
