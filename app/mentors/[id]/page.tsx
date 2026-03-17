import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/ui/page-heading";
import { getMentorById } from "@/lib/data";

type MentorDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MentorDetailPage({ params }: MentorDetailPageProps) {
  const { id } = await params;
  const mentor = await getMentorById(id);

  if (!mentor) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="导师资料"
        title={mentor.name}
        description={[mentor.school, mentor.college, mentor.lab].filter(Boolean).join(" · ") || mentor.organization}
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="surface-card rounded-[2rem] p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip">导师资料</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mentor.isOpen
                    ? "bg-[rgba(24,163,111,0.12)] text-[var(--success)]"
                    : "bg-[rgba(24,35,56,0.06)] text-[var(--muted)]"
                }`}
              >
                {mentor.isOpen ? "开放申请" : "暂未开放"}
              </span>
              {mentor.isDemo ? (
                <span className="rounded-full bg-[rgba(255,159,74,0.18)] px-3 py-1 text-xs font-semibold text-[#c26e25]">
                  示例
                </span>
              ) : null}
            </div>

            <h2 className="mt-5 text-xl font-bold text-[var(--foreground)]">研究方向与支持方式</h2>
            <p className="mt-4 text-sm leading-8 text-[var(--muted)]">{mentor.direction || "暂未填写"}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {mentor.directionTags.length ? (
                mentor.directionTags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-[rgba(17,40,79,0.06)] px-3 py-1 text-xs text-[var(--muted)]">
                  暂未添加方向标签
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-[var(--muted)]">可支持内容</p>
                <p className="mt-2 font-semibold text-[var(--foreground)]">
                  {mentor.supportScope.join(" / ") || "暂未填写"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-[var(--muted)]">支持方式</p>
                <p className="mt-2 font-semibold text-[var(--foreground)]">{mentor.supportMethod || "暂未填写"}</p>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">申请与联系说明</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
              <p>申请说明：{mentor.applicationNotes || "暂未填写"}</p>
              <p>联系方式：{mentor.contactMode || "暂未填写"}</p>
              <p>组织：{mentor.organization || "暂未填写"}</p>
            </div>
          </div>
        </div>

        <aside className="surface-panel rounded-[2rem] p-6">
          <h2 className="text-xl font-bold text-[var(--foreground)]">下一步建议</h2>
          <p className="mt-4 text-sm leading-8 text-[var(--muted)]">
            如果你对这位导师的方向感兴趣，可以先回到招募池查看是否有开放中的导师招募，也可以先完善自己的个人资料再去申请合作。
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/opportunities" className="ui-button-primary px-5 py-3 text-center font-semibold">
              去看开放招募
            </Link>
            <Link href="/profile" className="ui-button-secondary px-5 py-3 text-center font-semibold">
              去完善个人资料
            </Link>
            <Link href="/talent#mentor-section" className="ui-button-secondary px-5 py-3 text-center font-semibold">
              返回导师区
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
