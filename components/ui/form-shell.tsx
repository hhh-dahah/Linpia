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
    <div className={cn("grid gap-4 overflow-x-clip xl:grid-cols-[0.92fr_1.08fr] xl:gap-6", className)}>
      <aside className="surface-panel min-w-0 overflow-hidden rounded-[1.6rem] px-5 py-6 sm:rounded-[1.9rem] sm:px-8 sm:py-8">
        <div className="chip">{eyebrow}</div>
        <h1 className="mt-5 break-words font-display text-[2.15rem] font-bold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 break-words text-sm leading-7 text-muted sm:text-base">{description}</p>

          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-line bg-surface-muted p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-foreground">{asideTitle}</h2>
          <p className="mt-2 break-words text-sm leading-7 text-muted">{asideDescription}</p>
          <div className="mt-5 space-y-3">
            {tips.map((tip, index) => (
              <div
                key={`${index}-${tip}`}
                  className="overflow-hidden rounded-2xl border border-line bg-white/88 px-4 py-3 text-sm leading-6 text-foreground"
              >
                <span className="mr-2 font-semibold text-primary">0{index + 1}</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="surface-card min-w-0 overflow-hidden rounded-[1.6rem] px-4 py-5 sm:rounded-[1.9rem] sm:px-8 sm:py-8">
        {children}
      </section>
    </div>
  );
}
