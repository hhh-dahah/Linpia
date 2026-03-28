import Link from "next/link";
import { redirect } from "next/navigation";

import { markNotificationReadAction } from "@/app/actions";
import { FormFeedback } from "@/components/ui/form-feedback";
import { getCurrentUser } from "@/lib/auth";
import { listConversationThreads, listNotificationEvents } from "@/lib/data";

type InboxPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessageState(params?: Record<string, string | string[] | undefined>) {
  const error = typeof params?.error === "string" ? params.error : "";

  if (error) {
    return { status: "error" as const, message: error };
  }

  return null;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard/inbox");
  }

  const params = (await searchParams) ?? {};
  const feedback = getMessageState(params);
  const [notifications, conversations] = await Promise.all([
    listNotificationEvents(user.id),
    listConversationThreads(user.id),
  ]);

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[2rem] p-6 sm:p-8">
        <p className="chip w-fit">通知与消息</p>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          只保留和撮合直接相关的通知与会话
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          这里不会变成社交广场，只承接报名、状态更新和合作推进中的必要沟通。
        </p>
      </section>

      {feedback ? <FormFeedback state={feedback} /> : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="surface-panel rounded-[1.8rem] p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[var(--foreground)]">通知中心</h2>
            <Link href="/dashboard" className="ui-link text-sm font-semibold">
              返回我的 / 后台
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {notifications.length ? (
              notifications.map((item) => (
                <article key={item.id} className="rounded-[1.4rem] border border-line bg-white/85 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
                    </div>
                    {!item.isRead ? (
                      <span className="rounded-full bg-[rgba(36,107,250,0.12)] px-2 py-1 text-xs font-semibold text-[var(--primary)]">
                        新
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={item.linkHref} className="ui-button-secondary px-4 py-2 text-sm font-semibold">
                      查看详情
                    </Link>
                    {!item.isRead ? (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="notificationId" value={item.id} />
                        <input type="hidden" name="redirectTo" value="/dashboard/inbox" />
                        <button type="submit" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
                          标记已读
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-line border-dashed px-4 py-10 text-sm text-[var(--muted)]">
                暂时还没有通知。
              </div>
            )}
          </div>
        </div>

        <div className="surface-panel rounded-[1.8rem] p-5">
          <h2 className="text-xl font-bold text-[var(--foreground)]">会话列表</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            每条会话都绑定在一次具体合作关系里，避免脱离机会上下文单独聊天。
          </p>

          <div className="mt-5 space-y-3">
            {conversations.length ? (
              conversations.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/conversations/${item.id}`}
                  className="block rounded-[1.4rem] border border-line bg-white/85 p-4 transition hover:border-[rgba(36,107,250,0.28)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{item.counterpartName}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{item.opportunityTitle}</p>
                    </div>
                    {item.unreadCount > 0 ? (
                      <span className="rounded-full bg-[rgba(255,159,74,0.12)] px-2 py-1 text-xs font-semibold text-[#c26e25]">
                        {item.unreadCount} 条未读
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--foreground)]">
                    {item.lastMessagePreview || "还没有发送消息，状态同步会先出现在这里。"}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-line border-dashed px-4 py-10 text-sm text-[var(--muted)]">
                暂时还没有会话。
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
