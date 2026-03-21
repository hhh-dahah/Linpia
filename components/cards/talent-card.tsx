import Link from "next/link";

import type { TalentCard as TalentCardType } from "@/types/profile";

export function TalentCard({ item }: { item: TalentCardType }) {
  return (
    <article className="surface-card rounded-[1.75rem] p-6 hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(51,112,255,0.14),_rgba(116,194,255,0.22))] text-lg font-bold text-[var(--primary-strong)]">
          {item.name.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)]">{item.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {[item.school, item.major, item.grade].filter(Boolean).join(" · ") || "信息待补充"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{item.bio || "这个同学还在补充个人介绍。"}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {item.skills.length ? (
          item.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-[rgba(51,112,255,0.08)] px-3 py-1 text-xs font-medium text-[var(--primary-strong)]"
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-[rgba(24,35,56,0.05)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
            技能待补充
          </span>
        )}
      </div>

      <div className="mt-5 text-sm text-[var(--muted)]">
        可投入时间：
        <span className="font-medium text-[var(--foreground)]">{item.timeCommitment || "待沟通"}</span>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-[var(--foreground)]">
          感兴趣方向：{item.interestedDirections.join(" / ") || "待补充"}
        </span>
        <Link href={`/talent/${item.id}`} className="ui-button-secondary px-4 py-2 text-sm font-semibold">
          查看人才卡
        </Link>
      </div>
    </article>
  );
}
