import type { MentorCard as MentorCardType } from "@/types/mentor";

export function MentorCard({ item }: { item: MentorCardType }) {
  return (
    <article className="surface-card rounded-[1.75rem] p-6 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)]">{item.name}</h3>
            {item.isDemo ? (
              <span className="rounded-full bg-[rgba(255,159,74,0.18)] px-3 py-1 text-xs font-semibold text-[#c26e25]">
                示例
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">{item.organization}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            item.isOpen
              ? "bg-[rgba(24,163,111,0.12)] text-[var(--success)]"
              : "bg-[rgba(24,35,56,0.06)] text-[var(--muted)]"
          }`}
        >
          {item.isOpen ? "开放申请" : "暂未开放"}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">{item.direction}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {item.directionTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[rgba(255,159,74,0.12)] px-3 py-1 text-xs font-medium text-[#c26e25]"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-5 space-y-2 text-sm text-[var(--muted)]">
        <p>支持方式：{item.supportScope.join(" / ")}</p>
        <p>联系说明：{item.contactMode}</p>
      </div>
    </article>
  );
}
