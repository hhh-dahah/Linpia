import Link from "next/link";

import { formatDate } from "@/lib/utils";
import type { OpportunityCard as OpportunityCardType } from "@/types/opportunity";

export function OpportunityCard({ item }: { item: OpportunityCardType }) {
  return (
    <article className="surface-card rounded-[1.75rem] p-6 hover:-translate-y-1">
      <div className="flex flex-wrap items-center gap-3">
        <span className="chip">{item.type}</span>
        <span className="rounded-full bg-[rgba(36,107,250,0.08)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          {item.creatorRoleLabel}
        </span>
        <span className="rounded-full bg-[rgba(255,159,74,0.14)] px-3 py-1 text-xs font-semibold text-[#c26e25]">
          {item.status}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-bold tracking-tight text-[var(--foreground)]">{item.title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {item.tags.length ? (
          item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[rgba(24,35,56,0.05)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-[rgba(17,40,79,0.05)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
            暂未添加标签
          </span>
        )}
      </div>
      <div className="mt-5 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
        <div>发布方：{item.creatorName}</div>
        <div>组织：{item.creatorOrganization || item.organization}</div>
        <div>所需方向：{item.roleSummary.join(" / ") || "见详情"}</div>
        <div>截止时间：{formatDate(item.deadline)}</div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-[var(--foreground)]">已报名 {item.applicantCount} 人</span>
        <div className="flex gap-2">
          <Link href={`/opportunities/${item.id}`} className="ui-button-secondary px-4 py-2 text-sm font-semibold">
            查看详情
          </Link>
          <Link href={`/opportunities/${item.id}#apply`} className="ui-button-primary px-4 py-2 text-sm font-semibold">
            立即报名
          </Link>
        </div>
      </div>
    </article>
  );
}
