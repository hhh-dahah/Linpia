import { cn } from "@/lib/utils";

type PageHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export function PageHeading({ eyebrow, title, description, className }: PageHeadingProps) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow ? (
        <span className="chip mb-4">
          <span className="h-2 w-2 rounded-full bg-accent" />
          {eyebrow}
        </span>
      ) : null}
      <h1 className="font-display text-[2.5rem] font-bold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[3.35rem]">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 text-base leading-8 text-muted sm:text-[1.05rem]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
