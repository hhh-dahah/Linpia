import Link from "next/link";

import type { CaseCard as CaseCardType } from "@/types/case";

export function CaseCard({ item }: { item: CaseCardType }) {
  return (
    <article className="surface-card rounded-[1.75rem] p-6 hover:-translate-y-1">
      <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)]">{item.title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {item.resultTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[rgba(24,35,56,0.05)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
          >
            {tag}
          </span>
        ))}
      </div>
      {item.relatedOpportunityId ? (
        <div className="mt-6">
          <Link href={`/opportunities/${item.relatedOpportunityId}`} className="ui-link text-sm font-semibold text-[var(--primary)]">
            查看对应机会
          </Link>
        </div>
      ) : null}
    </article>
  );
}
