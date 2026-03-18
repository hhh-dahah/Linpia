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
      title={flow.role === "student" ? "清楚发出你想要找的人" : "把你愿意开放的指导和合作机会发出来"}
      description={
        flow.role === "student"
          ? "适用于比赛组队、项目招人、找队友和短期合作。"
          : "如果你想带队、开放课题合作，或者愿意给学生一些方向和支持，可以先把这次开放的机会发出来。"
      }
      asideTitle="写的时候可以这样想"
      asideDescription="不用一下子写得很正式，把这次想找谁、一起做什么、什么时候方便对上，先说清楚就够了。"
      tips={[
        "标题先让人一眼看懂你在招什么，后面的细节再慢慢补充。",
        "角色说明尽量贴近真实合作场景，这样别人更容易判断自己适不适合。",
        "标签先选最贴近的几个，后面如果有新方向也可以再补。",
      ]}
    >
      <PublishForm role={flow.role} />
    </FormShell>
  );
}
