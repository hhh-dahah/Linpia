import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConversationReplyForm } from "@/components/inbox/conversation-reply-form";
import { getCurrentUser } from "@/lib/auth";
import { getConversationThreadById } from "@/lib/data";
import { formatDate } from "@/lib/utils";

type ConversationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConversationDetailPage({ params }: ConversationDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/conversations/${id}`)}`);
  }

  const snapshot = await getConversationThreadById(id, user.id);

  if (!snapshot) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/dashboard/inbox" className="ui-link text-sm font-semibold">
              返回通知与消息
            </Link>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              {snapshot.thread.counterpartName}
            </h1>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{snapshot.thread.opportunityTitle}</p>
          </div>
          <span className="rounded-full bg-[rgba(17,40,79,0.06)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
            {snapshot.thread.status === "open" ? "会话开放中" : "会话已关闭"}
          </span>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-panel rounded-[1.8rem] p-5">
          <h2 className="text-xl font-bold text-[var(--foreground)]">会话记录</h2>
          <div className="mt-5 space-y-4">
            {snapshot.messages.length ? (
              snapshot.messages.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-[1.4rem] px-4 py-4 ${
                    item.isMine
                      ? "bg-[rgba(36,107,250,0.08)] text-[var(--foreground)]"
                      : "bg-white/85 text-[var(--foreground)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold">{item.senderName}</p>
                    <p className="text-xs text-[var(--muted)]">{formatDate(item.createdAt)}</p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{item.body}</p>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-line border-dashed px-4 py-10 text-sm text-[var(--muted)]">
                还没有消息记录，状态更新会先写进这里。
              </div>
            )}
          </div>
        </div>

        <aside className="surface-panel rounded-[1.8rem] p-5">
          <h2 className="text-xl font-bold text-[var(--foreground)]">发送新消息</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            只发送和当前合作推进直接相关的信息，例如时间安排、材料补充、下一步确认。
          </p>

          <div className="mt-5">
            <ConversationReplyForm threadId={snapshot.thread.id} />
          </div>
        </aside>
      </section>
    </div>
  );
}
