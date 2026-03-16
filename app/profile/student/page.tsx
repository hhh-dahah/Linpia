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
      title="先把你的基础信息和想加入的方向挂出来"
      description="展示技能不是只给“很强的人”用。就算你现在标签不多，也可以先把学校、方向和经历补上。"
      asideTitle="这页会影响什么"
      asideDescription="学生资料完整后，你就能展示能力卡、报名合作，也能以学生队长身份继续发布招募。"
      tips={["技能标签可以后补。", "比赛 / 项目经历尽量写具体一点。", "联系方式建议写清楚别人怎么联系你最合适。"]}
    >
      <ProfileForm profile={profile} />
    </FormShell>
  );
}
