import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/forms/profile-form";
import { FormShell } from "@/components/ui/form-shell";
import { getCurrentUser, getUserFlowState } from "@/lib/auth";
import { getStudentProfileByUserId } from "@/lib/data";

type StudentProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentProfilePage({ searchParams }: StudentProfilePageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : "/profile";
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const flow = await getUserFlowState();
  if (flow.role === "mentor") {
    redirect(`/profile/mentor?next=${encodeURIComponent(nextPath)}`);
  }
  if (flow.status === "needs_role") {
    redirect(`/onboarding/role?next=${encodeURIComponent(nextPath)}`);
  }

  const profile = await getStudentProfileByUserId(user.id, "session");

  return (
    <FormShell
      eyebrow="学生资料"
      title="把你的基础信息和想加入的方向挂出来"
      description="先把学校、方向、经历和联系方式写清楚，别人更容易判断怎么和你合作。把介绍、技能、方向和联系方式补全后，更容易被排到前面。"
      asideTitle="这一页会影响什么"
      asideDescription="学生资料保存后，你的个人主页和首页人才池都会同步更新，别人也能更快看懂你会什么、想做什么。"
      tips={[
        "技能标签可以先少填，后面再慢慢补。",
        "比赛 / 项目经历尽量写具体一点。",
        "联系方式建议写清楚别人怎么联系你最方便。",
      ]}
    >
      <ProfileForm profile={profile} draftStorageKey={`linpai:profile-draft:student:${user.id}`} />
    </FormShell>
  );
}
