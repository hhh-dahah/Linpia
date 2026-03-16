import { cn } from "@/lib/utils";

type FieldLabelProps = {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
};

export function FieldLabel({ children, required = false, className }: FieldLabelProps) {
  return (
    <span className={cn("field-label inline-flex items-center gap-2", className)}>
      <span>{children}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold",
          required
            ? "bg-[rgba(217,45,32,0.1)] text-[var(--danger)]"
            : "bg-[rgba(17,40,79,0.06)] text-[var(--muted)]",
        )}
      >
        {required ? "必填" : "可选"}
      </span>
    </span>
  );
}
