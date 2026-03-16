import Link from "next/link";

import { ProfileForm } from "@/components/forms/profile-form";
import { FormShell } from "@/components/ui/form-shell";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="surface-card rounded-[2rem] px-6 py-8 text-center sm:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          登录后才能管理资料、机会和报名记录
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          公共访客可以先浏览；登录后再进入控制台，创建个人资料、发布机会和查看投递状态。
        </p>
        <div className="mt-8">
          <Link href="/login?next=/dashboard" className="ui-button-primary px-5 py-3 font-semibold">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  const snapshot = await getDashboardSnapshot(user.id);
  const displayName = snapshot.profile?.name || user.email || "同学";

  return (
    <div className="space-y-6">
      <FormShell
        eyebrow="个人后台"
        title={`欢迎回来，${displayName}`}
        description="这里统一管理你的个人资料、投递记录和已发布机会。资料不需要一次填满，先把基础信息和方向挂出来就可以。"
        asideTitle="使用建议"
        asideDescription="把后台做成一个稳定、容易维护的信息面板，而不是一堆复杂入口。"
        tips={["先把姓名、方向和一句话介绍补上。", "技能、作品、投入时间可以慢慢完善。", "如果你是管理员，这里也能进入后台录入。"]}
      >
        <div className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">我的资料</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">完善技能、方向、作品外链和图片。</p>
            </div>
            {isAdminEmail(user.email) ? (
              <Link href="/dashboard/admin" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
                进入后台录入
              </Link>
            ) : null}
          </div>

          <ProfileForm profile={snapshot.profile} />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="surface-panel rounded-[1.6rem] p-5">
              <h3 className="text-lg font-bold text-[var(--foreground)]">我的投递</h3>
              <div className="mt-4 space-y-3">
                {snapshot.applications.length ? (
                  snapshot.applications.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-4">
                      <p className="font-semibold text-[var(--foreground)]">{item.opportunityTitle}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        状态：{item.status} · 提交于 {formatDate(item.submittedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">暂时还没有投递记录。</p>
                )}
              </div>
            </div>

            <div className="surface-panel rounded-[1.6rem] p-5">
              <h3 className="text-lg font-bold text-[var(--foreground)]">我的机会</h3>
              <div className="mt-4 space-y-3">
                {snapshot.opportunities.length ? (
                  snapshot.opportunities.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-4">
                      <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {item.type} · {item.status} · {item.applicantCount} 人已报名
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">你还没有发布机会，可以先去创建一个试试。</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </FormShell>
    </div>
  );
}
