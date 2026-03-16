import { cn } from "@/lib/utils";

type FormShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  asideTitle: string;
  asideDescription: string;
  tips: string[];
  children: React.ReactNode;
  className?: string;
};

export function FormShell({
  eyebrow,
  title,
  description,
  asideTitle,
  asideDescription,
  tips,
  children,
  className,
}: FormShellProps) {
  return (
    <div className={cn("grid gap-6 xl:grid-cols-[0.92fr_1.08fr]", className)}>
      <aside className="surface-panel rounded-[1.9rem] px-6 py-7 sm:px-8 sm:py-8">
        <div className="chip">{eyebrow}</div>
        <h1 className="mt-5 font-display text-3xl font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-base">{description}</p>

        <div className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-muted)] p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{asideTitle}</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{asideDescription}</p>
          <div className="mt-5 space-y-3">
            {tips.map((tip, index) => (
              <div
                key={`${index}-${tip}`}
                className="rounded-2xl border border-[var(--line)] bg-white/88 px-4 py-3 text-sm leading-6 text-[var(--foreground)]"
              >
                <span className="mr-2 font-semibold text-[var(--primary)]">0{index + 1}</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="surface-card rounded-[1.9rem] px-5 py-6 sm:px-8 sm:py-8">{children}</section>
    </div>
  );
}
