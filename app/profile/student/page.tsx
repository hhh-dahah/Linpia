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

  const profile = await getStudentProfileByUserId(user.id);

  return (
    <FormShell
      eyebrow="学生资料"
      title="把你的基础信息和想加入的方向挂出来"
      description="不用等到自己非常完整再来填。先把学校、方向、经历和联系方式写清楚，别人就更容易判断怎么和你合作。"
      asideTitle="这页会影响什么"
      asideDescription="学生资料保存后，你的个人资料页和技能展示都会更新，也能更顺畅地报名合作或继续发招募。"
      tips={[
        "技能标签可以先少填，后面再慢慢补。",
        "比赛 / 项目经历尽量写具体一点。",
        "联系方式建议写清楚别人怎样联系你最方便。",
      ]}
    >
      <ProfileForm profile={profile} />
    </FormShell>
  );
}
