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
      asideDescription="先把这次想找谁、一起做什么、什么时间适合对上说清楚，不用一开始就写得很复杂。"
      tips={[
        "标题先让人一眼看懂你在招什么。",
        "角色说明尽量贴近真实合作场景。",
        "标签先选最贴近的几个，后面还可以再补。",
      ]}
    >
      <PublishForm role={flow.role} />
    </FormShell>
  );
}
