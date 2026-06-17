export function ControlPanel({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="rounded-2xl border border-border bg-background/35 p-3">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-[11px] leading-snug text-muted-foreground/80">
          {hint}
        </span>
      )}
    </label>
  );
}

export function InfoTile({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-background/35 p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <Icon size={13} className="text-accent" />
        {label}
      </div>
      <div className="mt-2 break-words text-sm text-foreground">{value}</div>
    </div>
  );
}

export function ContactLink({
  Icon,
  href,
  label,
  value,
  hint,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <a
      href={href}
      className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-background/35 p-4 text-foreground hover:border-accent/40 hover:text-accent"
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-accent">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 truncate text-sm">{value}</div>
        {hint && (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
            {hint}
          </div>
        )}
      </div>
    </a>
  );
}
