import { redirect } from "next/navigation";

import { MentorProfileForm } from "@/components/forms/mentor-profile-form";
import { FormShell } from "@/components/ui/form-shell";
import { getCurrentUser, getUserFlowState } from "@/lib/auth";
import { getMentorProfileByUserId } from "@/lib/data";

type MentorProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MentorProfilePage({ searchParams }: MentorProfilePageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : "/profile";
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const flow = await getUserFlowState();
  if (flow.role === "student") {
    redirect(`/profile/student?next=${encodeURIComponent(nextPath)}`);
  }
  if (flow.status === "needs_role") {
    redirect(`/onboarding/role?next=${encodeURIComponent(nextPath)}`);
  }

  const profile = await getMentorProfileByUserId(user.id, "session");

  return (
    <FormShell
      eyebrow="导师资料"
      title="把你的研究方向和支持方式整理清楚"
      description="导师入驻不只是展示姓名，而是把你愿意开放的支持方式、研究方向和申请方式说明白，方便学生快速判断是否适合联系你。把方向、支持内容、联系方式和申请说明补全后，更容易被排到前面。"
      asideTitle="这一页会影响什么"
      asideDescription="导师资料保存后，你的个人主页和首页人才池都会同步更新，也能继续通过统一入口发布带队或合作招募。"
      tips={[
        "学校 / 学院 / 实验室优先写最容易识别的信息。",
        "研究方向和支持方式比泛泛介绍更重要。",
        "就算暂时不开放申请，也建议先把资料建立起来。",
      ]}
    >
      <MentorProfileForm profile={profile} draftStorageKey={`linpai:profile-draft:mentor:${user.id}`} />
    </FormShell>
  );
}
