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
      title="先快速发出一条招募"
      description="先把你想找的人和要做的事写清楚，其他细节后面再补。"
      asideTitle="填的时候可以这样想"
      asideDescription="不用一上来就把所有细节写满，先把最关键的信息发出去，后面再慢慢补充。"
      tips={[
        "先把你想找的人和要做的事写清楚",
        "报名时要收哪些材料，也可以直接勾选",
        "先发出去，细节后面可以再补",
      ]}
    >
      <div className="space-y-5">
        <div className="rounded-[1.5rem] border border-[rgba(36,107,250,0.16)] bg-[rgba(36,107,250,0.06)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--primary)]">我的报名和发布管理</p>
              <p className="text-sm leading-6 text-[var(--muted)]">
                想修改已发布招募、看谁报名了，或者继续处理自己的报名记录，都从这里进入。
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
