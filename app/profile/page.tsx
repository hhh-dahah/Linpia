import Link from "next/link";

import { FormShell } from "@/components/ui/form-shell";
import { getUserFlowState, redirectForUserFlow } from "@/lib/auth";
import { getPersonalShowcase } from "@/lib/data";

type ProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : "/profile";
  const flow = await getUserFlowState();

  redirectForUserFlow(flow, nextPath);

  if (!flow.user || !flow.role) {
    return null;
  }

  const showcase = await getPersonalShowcase(flow.user.id, flow.role);

  return (
    <FormShell
      eyebrow="展示技能"
      title={flow.role === "student" ? "这是你现在对外展示的学生能力卡" : "这是你现在对外展示的导师主页"}
      description="展示技能不是单独的社区模块，而是个人主页体系的一部分。资料完善后，别人就能更快理解你适合什么合作。"
      asideTitle="你现在可以继续做什么"
      asideDescription="如果你想继续推进合作，可以直接去发招募，或者回到资料页继续补充。"
      tips={[
        "这页会根据你的身份展示不同内容。",
        "学生和导师都通过同一个入口进入展示体系。",
        "后续再补资料时，不会影响已经走通的导航结构。",
      ]}
    >
      {showcase ? (
        <div className="space-y-6">
          <div className="surface-panel rounded-[1.7rem] p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip">{flow.role === "student" ? "学生展示" : "导师展示"}</span>
              <span className="rounded-full bg-[rgba(36,107,250,0.08)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                {showcase.role === "student" ? "学生身份" : "导师身份"}
              </span>
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--foreground)]">{showcase.title}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">{showcase.subtitle || "资料还在继续完善中"}</p>
            <p className="mt-5 text-sm leading-7 text-[var(--muted)]">{showcase.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {showcase.tags.length ? (
                showcase.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[rgba(36,107,250,0.08)] px-3 py-1 text-xs font-medium text-[var(--primary)]"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-[rgba(17,40,79,0.06)] px-3 py-1 text-xs text-[var(--muted)]">
                  暂未添加标签
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {showcase.sections.map((section) => (
              <div key={section.label} className="rounded-[1.4rem] border border-[var(--line)] bg-white/88 p-5">
                <p className="text-sm text-[var(--muted)]">{section.label}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">
                  {section.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={showcase.editPath} className="ui-button-secondary px-5 py-3 text-sm font-semibold">
              {showcase.ctaLabel}
            </Link>
            <Link href="/publish" className="ui-button-primary px-5 py-3 text-sm font-semibold">
              去发布招募
            </Link>
            <Link href="/dashboard" className="ui-button-secondary px-5 py-3 text-sm font-semibold">
              进入我的发布管理
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.7rem] border border-[var(--line)] bg-[var(--surface-muted)] p-6 text-sm text-[var(--muted)]">
          你的资料还没准备好，请先补齐对应身份的信息。
        </div>
      )}
    </FormShell>
  );
}
