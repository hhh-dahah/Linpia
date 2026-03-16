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

  const profile = await getMentorProfileByUserId(user.id);

  return (
    <FormShell
      eyebrow="导师资料"
      title="把研究方向、支持方式和开放状态整理清楚"
      description="导师入驻不再只是展示页静态录入，而是可以通过统一身份体系完成资料完善、展示和发布招募。"
      asideTitle="这页会影响什么"
      asideDescription="导师资料完整后，可以展示个人方向，也能进入统一的发招募入口发布带队或支持需求。"
      tips={["学校 / 学院 / 实验室优先写最容易识别的组织信息。", "研究方向和支持方式比“大而空”的简介更重要。", "如果暂时不开放申请，也建议先把资料建起来。"]}
    >
      <MentorProfileForm profile={profile} />
    </FormShell>
  );
}
