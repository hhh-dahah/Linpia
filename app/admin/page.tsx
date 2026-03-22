import Link from "next/link";

import { getAdminDashboardSnapshot } from "@/lib/admin-data";
import { formatDate } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const snapshot = await getAdminDashboardSnapshot();

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[2rem] p-6 sm:p-8">
        <p className="chip w-fit">运营后台</p>
        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              统一管理人员、招募和报名
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              这套后台优先服务学校真实运营场景：既能管理用户自己完善的资料，也能直接录入展示型导师和学生档案，还能统一处理招募与报名。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/people" className="ui-button-primary px-5 py-3 text-sm font-semibold">
              去管人员
            </Link>
            <Link href="/admin/opportunities" className="ui-button-secondary px-5 py-3 text-sm font-semibold">
              去管招募
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "可展示人员", value: snapshot.peopleCount, hint: "学生与导师统一目录" },
          { label: "开放中的招募", value: snapshot.activeOpportunityCount, hint: "当前前台可见" },
          { label: "待处理报名", value: snapshot.pendingApplicationCount, hint: "建议优先跟进" },
        ].map((item) => (
          <article key={item.label} className="surface-panel rounded-[1.6rem] p-5">
            <p className="text-sm font-medium text-[var(--muted)]">{item.label}</p>
            <p className="mt-4 font-display text-4xl font-bold text-[var(--foreground)]">{item.value}</p>
            <p className="mt-3 text-sm text-[var(--muted)]">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="surface-panel rounded-[1.8rem] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--foreground)]">最近更新的人</h2>
            <Link href="/admin/people" className="ui-link text-sm font-semibold text-[var(--primary)]">
              查看全部
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {snapshot.recentPeople.map((item) => (
              <div key={item.id} className="rounded-2xl border border-line bg-white/80 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[var(--foreground)]">{item.name}</p>
                  <span className="chip">{item.role === "mentor" ? "导师" : "学生"}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {[item.school, item.major || item.college, item.grade || item.lab].filter(Boolean).join(" / ") || "资料待补充"}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel rounded-[1.8rem] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--foreground)]">最近发布的招募</h2>
            <Link href="/admin/opportunities" className="ui-link text-sm font-semibold text-[var(--primary)]">
              查看全部
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {snapshot.recentOpportunities.map((item) => (
              <div key={item.id} className="rounded-2xl border border-line bg-white/80 px-4 py-4">
                <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {item.creatorRole === "mentor" ? "导师" : "学生队长"} / {item.organization}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {item.status} / 报名 {item.applicantCount} 人
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel rounded-[1.8rem] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--foreground)]">最近报名</h2>
            <Link href="/admin/applications" className="ui-link text-sm font-semibold text-[var(--primary)]">
              查看全部
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {snapshot.recentApplications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-line bg-white/80 px-4 py-4">
                <p className="font-semibold text-[var(--foreground)]">{item.applicantName}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.opportunityTitle}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {item.status} / {formatDate(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
