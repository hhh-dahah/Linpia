import Link from "next/link";

import type { CaseCard as CaseCardType } from "@/types/case";

export function CaseCard({ item }: { item: CaseCardType }) {
  return (
    <article className="surface-card rounded-[1.75rem] p-6 hover:-translate-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-bold tracking-tight text-foreground">{item.title}</h3>
        {item.isDemo ? (
          <span className="rounded-full bg-[rgba(255,159,74,0.18)] px-3 py-1 text-xs font-semibold text-[#c26e25]">
            示例
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-7 text-muted">{item.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {item.resultTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[rgba(24,35,56,0.05)] px-3 py-1 text-xs font-medium text-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
      {item.relatedOpportunityId ? (
        <div className="mt-6">
          <Link href={`/opportunities/${item.relatedOpportunityId}`} className="ui-link text-sm font-semibold text-primary">
            查看对应机会
          </Link>
        </div>
      ) : null}
    </article>
  );
}
