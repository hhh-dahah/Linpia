import { redirect } from "next/navigation";

import { RoleSelectForm } from "@/components/forms/role-select-form";
import { FormShell } from "@/components/ui/form-shell";
import { getCurrentAccountRole, getCurrentUser, getProfilePath } from "@/lib/auth";

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

  const role = await getCurrentAccountRole(user);
  if (role) {
    redirect(`${getProfilePath(role)}?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <FormShell
      eyebrow="选择身份"
      title="先告诉邻派，你现在是学生还是导师"
      description="前台入口按动作组织，但发布、资料和展示内容会根据你的身份自动匹配，所以第一次登录需要先选一下。"
      asideTitle="选完之后会发生什么"
      asideDescription="学生和导师都走同一个账号体系。选完身份后，系统会带你去对应的资料页，补完资料再继续刚才的操作。"
      tips={[
        "目前只需要选择学生或导师两种身份。",
        "后面发招募、展示资料都会自动按身份分流。",
        "身份选完后就会进入对应的资料完善页。",
      ]}
    >
      <RoleSelectForm nextPath={nextPath} />
    </FormShell>
  );
}
