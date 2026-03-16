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
      title={flow.role === "student" ? "把你正在找的人清楚发出来" : "把你愿意开放的指导与合作机会发出来"}
      description={
        flow.role === "student"
          ? "适用于比赛组队、项目招人、找队友和短期合作。表单按真实招募场景整理，不会强行做成复杂后台。"
          : "适用于导师带队、课题合作、实验室开放机会和指导支持。入口统一，但会根据导师身份展示对应字段。"
      }
      asideTitle="填写建议"
      asideDescription="招募信息越具体，越容易让对的人快速判断自己适不适合报名。"
      tips={[
        "标题直接写清楚项目或方向，不要写成空泛口号。",
        "角色说明尽量对应真实缺口，让报名者知道你缺什么人。",
        "预设标签和自定义标签一起用，方便后面继续做筛选。",
      ]}
    >
      <PublishForm role={flow.role} />
    </FormShell>
  );
}
