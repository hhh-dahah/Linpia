import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationForm } from "@/components/forms/application-form";
import { PageHeading } from "@/components/ui/page-heading";
import { getCurrentUser } from "@/lib/auth";
import { getOpportunityById } from "@/lib/data";
import { formatDate } from "@/lib/utils";

type OpportunityDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OpportunityDetailPage({ params }: OpportunityDetailPageProps) {
  const { id } = await params;
  const [opportunity, user] = await Promise.all([getOpportunityById(id), getCurrentUser()]);

  if (!opportunity) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeading eyebrow={opportunity.type} title={opportunity.title} description={opportunity.summary} />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="surface-card rounded-[2rem] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">结构化摘要</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-[var(--muted)]">学校范围</p>
                <p className="mt-2 font-semibold">{opportunity.schoolScope}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-[var(--muted)]">截止时间</p>
                <p className="mt-2 font-semibold">{formatDate(opportunity.deadline)}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-[var(--muted)]">建议投入</p>
                <p className="mt-2 font-semibold">{opportunity.weeklyHours}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-[var(--muted)]">当前状态</p>
                <p className="mt-2 font-semibold">{opportunity.status}</p>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">当前进度</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{opportunity.progress}</p>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">试合作任务</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{opportunity.trialTask}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {opportunity.skills.map((skill) => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href={opportunity.feishuUrl || "https://www.feishu.cn/product/docs"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)]"
              >
                查看完整飞书文档
              </Link>
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">角色缺口</h2>
            <div className="mt-5 space-y-4">
              {opportunity.roleGaps.map((role) => (
                <div key={role.id} className="rounded-2xl border border-[rgba(17,40,79,0.08)] bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-[var(--foreground)]">{role.roleName}</h3>
                    <span className="text-sm text-[var(--muted)]">招募 {role.headcount} 人</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{role.responsibility}</p>
                  <p className="mt-2 text-sm text-[var(--foreground)]">要求：{role.requirements}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">每周投入：{role.weeklyHours}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="surface-panel rounded-[2rem] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">报名入口</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {user ? "登录状态下可直接提交备注与试合作链接。" : "你可以先浏览详情；真正报名时需要先登录。"}
            </p>
            <ApplicationForm opportunityId={opportunity.id} />
          </div>

          <div className="surface-panel rounded-[2rem] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">交付预期</h2>
            <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
              {opportunity.deliverables.map((item) => (
                <li key={item} className="rounded-2xl bg-[rgba(17,40,79,0.04)] px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
