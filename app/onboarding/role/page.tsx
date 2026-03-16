import { redirect } from "next/navigation";

import { RoleSelectForm } from "@/components/forms/role-select-form";
import { FormShell } from "@/components/ui/form-shell";
import { getAccountRole, getCurrentUser } from "@/lib/auth";

type RolePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RoleSelectPage({ searchParams }: RolePageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : "/profile";
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const role = getAccountRole(user);
  if (role) {
    const target = role === "student" ? "/profile/student" : "/profile/mentor";
    redirect(`${target}?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <FormShell
      eyebrow="选择身份"
      title="先告诉邻派，你现在是学生还是导师"
      description="平台前台按动作组织，不按身份拆多个入口；但发布、展示和资料会根据身份自动分流。"
      asideTitle="为什么要先选身份"
      asideDescription="学生和导师都会进入同一个平台账号体系，只是资料和招募表单不同。"
      tips={["只做两种身份：学生、导师。", "选完身份后会进入对应资料完善页。", "之后发布招募和展示技能都会自动按身份走。"]}
    >
      <RoleSelectForm nextPath={nextPath} />
    </FormShell>
  );
}
