import Link from "next/link";
import { redirect } from "next/navigation";

import { PublishForm } from "@/components/forms/publish-form";
import { FormShell } from "@/components/ui/form-shell";
import { getUserFlowState, redirectForUserFlow } from "@/lib/auth";

type PublishPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PublishPage({ searchParams }: PublishPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : "/publish";
  const flow = await getUserFlowState();

  redirectForUserFlow(flow, nextPath);

  if (!flow.user || !flow.role) {
    redirect("/login?next=/publish");
  }

  return (
    <FormShell
      eyebrow="发招募"
      title={flow.role === "student" ? "清楚发出你想要找的人" : "把你愿意开放的合作机会发出来"}
      description={
        flow.role === "student"
          ? "适用于比赛组队、项目招人、找队友和短期合作。"
          : "适用于带队招募、课题合作、指导支持和实验室开放机会。"
      }
      asideTitle="填写时可以这样想"
      asideDescription="先把你想找谁、一起做什么、怎么联系和时间安排写清楚，不用一开始就写得很复杂。"
      tips={[
        "标题先让人一眼看懂你在招什么。",
        "把详细需求说明写清楚，比拆很多小栏更容易理解。",
        "标签先选最贴近的几个，后面还可以再补。",
      ]}
    >
      <div className="space-y-5">
        <div className="rounded-[1.5rem] border border-[rgba(36,107,250,0.16)] bg-[rgba(36,107,250,0.06)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--primary)]">我的报名和发布管理</p>
              <p className="text-sm leading-6 text-[var(--muted)]">
                想修改已发布的招募、查看谁报名了，或者继续处理自己的报名记录，都从这里进入。
              </p>
            </div>
            <Link href="/dashboard" className="ui-button-primary px-5 py-3 text-sm font-semibold">
              进入我的报名和发布管理
            </Link>
          </div>
        </div>

        <PublishForm role={flow.role} />
      </div>
    </FormShell>
  );
}
