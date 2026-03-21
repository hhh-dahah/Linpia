import Link from "next/link";

import type { MentorCard as MentorCardType } from "@/types/mentor";

type MentorCardProps = {
  item: MentorCardType;
  detailHref?: string;
};

export function MentorCard({ item, detailHref = `/mentors/${item.id}` }: MentorCardProps) {
  return (
    <article className="surface-card rounded-[1.75rem] p-6 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)]">{item.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {[item.school, item.college, item.lab].filter(Boolean).join(" · ") || item.organization}
          </p>
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
        {item.directionTags.length ? (
          item.directionTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[rgba(255,159,74,0.12)] px-3 py-1 text-xs font-medium text-[#c26e25]"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-[rgba(24,35,56,0.05)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
            研究方向待补充
          </span>
        )}
      </div>

      <div className="mt-5 space-y-2 text-sm text-[var(--muted)]">
        <p>可支持内容：{item.supportScope.join(" / ") || "待补充"}</p>
        <p>联系方式：{item.contactMode || "待补充"}</p>
      </div>

      <div className="mt-6 flex justify-end">
        <Link href={detailHref} className="ui-button-secondary px-4 py-2 text-sm font-semibold">
          查看导师资料
        </Link>
      </div>
    </article>
  );
}
