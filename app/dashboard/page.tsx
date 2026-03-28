import Link from "next/link";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FormShell } from "@/components/ui/form-shell";
import { getCurrentAdminUser } from "@/lib/admin";
import { getCurrentAccountRole, getCurrentUser } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/data";
import { formatDate } from "@/lib/utils";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessageState(params?: Record<string, string | string[] | undefined>) {
  const error = typeof params?.error === "string" ? params.error : "";
  const message = typeof params?.message === "string" ? params.message : "";

  if (error) {
    return { status: "error" as const, message: error };
  }

  if (message) {
    return { status: "success" as const, message };
  }

  return null;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="surface-card rounded-[2rem] px-6 py-8 text-center sm:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          登录后才能管理你的报名、招募和消息
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          你可以先浏览平台内容，登录后再回到这里查看自己的资料、报名记录、已发布招募和站内通知。
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
  const feedback = getMessageState((await searchParams) ?? {});
  const displayName =
    snapshot.profile && "name" in snapshot.profile ? snapshot.profile.name : user.email || "邻派用户";

  return (
    <FormShell
      eyebrow="我的 / 后台"
      title={`欢迎回来，${displayName}`}
      description="这里统一管理你的资料、报名、招募、通知和轻消息，不再把核心协作流程拆散在不同页面里。"
      asideTitle="当前重点"
      asideDescription="3000 用户前，我们优先保证撮合闭环稳定：资料展示清楚、机会筛选明确、报名状态透明、通知和会话只服务于合作推进。"
      tips={[
        role === "mentor"
          ? "优先补齐导师资料，别人更容易判断你是否适合提供支持。"
          : "优先补齐学生资料和作品链接，能明显提高被看见和被联系的概率。",
        "所有与报名直接相关的通知和消息，都会收口到这里。",
        "后台入口仍保留，但不会挤占前台主流程。",
      ]}
    >
      <div className="space-y-8">
        {feedback ? <FormFeedback state={feedback} /> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">快捷入口</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              继续完善资料、发布招募，或查看你当前的报名、通知和会话。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/profile" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
              查看个人资料
            </Link>
            <Link href="/publish" className="ui-button-primary px-4 py-2 text-sm font-semibold">
              发布招募
            </Link>
            <Link href="/dashboard/inbox" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
              查看通知与消息
            </Link>
            {adminUser ? (
              <Link href="/admin" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
                进入后台
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="surface-panel rounded-[1.6rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[var(--foreground)]">我的报名</h3>
              <span className="text-xs font-medium text-[var(--muted)]">结构化报名与状态跟踪</span>
            </div>
            <div className="mt-4 space-y-3">
              {snapshot.applications.length ? (
                snapshot.applications.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/applications/${item.id}`}
                    className="block rounded-2xl border border-line bg-surface-muted px-4 py-4 transition hover:border-[rgba(51,102,255,0.28)] hover:shadow-[0_10px_30px_rgba(37,99,235,0.08)]"
                  >
                    <p className="font-semibold text-[var(--foreground)]">{item.opportunityTitle}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      提交于 {formatDate(item.submittedAt)} · 当前状态：{item.status}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">暂时还没有报名记录。</p>
              )}
            </div>
          </section>

          <section className="surface-panel rounded-[1.6rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[var(--foreground)]">我的招募</h3>
              <span className="text-xs font-medium text-[var(--muted)]">管理公开详情与申请处理</span>
            </div>
            <div className="mt-4 space-y-3">
              {snapshot.opportunities.length ? (
                snapshot.opportunities.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/opportunities/${item.id}`}
                    className="block rounded-2xl border border-line bg-surface-muted px-4 py-4 transition hover:border-[rgba(51,102,255,0.28)] hover:shadow-[0_10px_30px_rgba(37,99,235,0.08)]"
                  >
                    <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {item.type} · {item.status} · 已报名 {item.applicantCount} 人
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">你还没有发布招募，可以先创建一条。</p>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="surface-panel rounded-[1.6rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[var(--foreground)]">最近通知</h3>
              <Link href="/dashboard/inbox" className="ui-link text-sm font-semibold">
                打开通知中心
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {snapshot.notifications.length ? (
                snapshot.notifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.linkHref}
                    className="block rounded-2xl border border-line bg-surface-muted px-4 py-4 transition hover:border-[rgba(51,102,255,0.28)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
                      {!item.isRead ? (
                        <span className="rounded-full bg-[rgba(36,107,250,0.12)] px-2 py-1 text-xs font-semibold text-[var(--primary)]">
                          新
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">暂时还没有新的通知。</p>
              )}
            </div>
          </section>

          <section className="surface-panel rounded-[1.6rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[var(--foreground)]">最近会话</h3>
              <Link href="/dashboard/inbox" className="ui-link text-sm font-semibold">
                查看全部会话
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {snapshot.conversations.length ? (
                snapshot.conversations.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/conversations/${item.id}`}
                    className="block rounded-2xl border border-line bg-surface-muted px-4 py-4 transition hover:border-[rgba(51,102,255,0.28)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-[var(--foreground)]">{item.counterpartName}</p>
                      {item.unreadCount > 0 ? (
                        <span className="rounded-full bg-[rgba(255,159,74,0.12)] px-2 py-1 text-xs font-semibold text-[#c26e25]">
                          {item.unreadCount} 条未读
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">{item.opportunityTitle}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--foreground)]">
                      {item.lastMessagePreview || "还没有发送消息，状态同步会先出现在这里。"}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">暂时还没有会话记录。</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </FormShell>
  );
}
