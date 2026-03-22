import Link from "next/link";

import { FormShell } from "@/components/ui/form-shell";
import { getCurrentAccountRole, getCurrentUser } from "@/lib/auth";
import { getCurrentAdminUser } from "@/lib/admin";
import { getDashboardSnapshot } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="surface-card rounded-[2rem] px-6 py-8 text-center sm:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          登录后才能管理招募、报名和个人资料
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          游客可以先浏览页面；登录后再进入管理页，查看自己的资料、报名记录和已发布招募。
        </p>
        <div className="mt-8">
          <Link href="/login?next=/dashboard" className="ui-button-primary px-5 py-3 font-semibold">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  const role = await getCurrentAccountRole(user);
  const adminUser = await getCurrentAdminUser();
  const snapshot = await getDashboardSnapshot(user.id, role);
  const displayName =
    snapshot.profile && "name" in snapshot.profile ? snapshot.profile.name : user.email || "邻派用户";

  return (
    <FormShell
      eyebrow="我的发布管理"
      title={`欢迎回来，${displayName}`}
      description="这里统一管理你的资料、报名记录和已发布招募。前台入口按动作组织，但后台信息会根据身份自动区分。"
      asideTitle="你可以在这里做什么"
      asideDescription="无论你是学生还是导师，都用同一个管理页查看自己的记录。"
      tips={[
        role === "mentor" ? "建议先把研究方向和支持方式补完整。" : "建议先把方向、经历和联系方式补完整。",
        "发布招募和报名记录都会统一沉淀到这里。",
        "如果你是管理员，这里也能继续进入后台录入。",
      ]}
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">快捷入口</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">继续完善资料、发布招募，或者查看你当前的申请记录。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/profile" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
              查看个人资料
            </Link>
            <Link href="/publish" className="ui-button-primary px-4 py-2 text-sm font-semibold">
              发布招募
            </Link>
            {role === "mentor" ? (
              <Link href="/profile/mentor" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
                编辑导师资料
              </Link>
            ) : (
              <Link href="/profile/student" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
                编辑学生资料
              </Link>
            )}
            {adminUser ? (
              <Link href="/admin" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
                进入后台录入
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-panel rounded-[1.6rem] p-5">
            <h3 className="text-lg font-bold text-[var(--foreground)]">我的报名</h3>
            <div className="mt-4 space-y-3">
              {snapshot.applications.length ? (
                snapshot.applications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-line bg-surface-muted px-4 py-4">
                    <p className="font-semibold text-[var(--foreground)]">{item.opportunityTitle}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      状态：{item.status} · 提交于 {formatDate(item.submittedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">暂时还没有报名记录。</p>
              )}
            </div>
          </div>

          <div className="surface-panel rounded-[1.6rem] p-5">
            <h3 className="text-lg font-bold text-[var(--foreground)]">我的招募</h3>
            <div className="mt-4 space-y-3">
              {snapshot.opportunities.length ? (
                snapshot.opportunities.map((item) => (
              <div key={item.id} className="rounded-2xl border border-line bg-surface-muted px-4 py-4">
                    <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {item.type} · {item.status} · 已报名 {item.applicantCount} 人
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">你还没有发布招募，可以先去创建一条。</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </FormShell>
  );
}
