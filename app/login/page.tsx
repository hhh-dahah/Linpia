import { LoginForm } from "@/components/forms/login-form";
import { FormShell } from "@/components/ui/form-shell";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : "/";

  return (
    <FormShell
      eyebrow="邮箱验证码登录"
      title="登录后再发布招募、报名合作和管理个人资料"
      description="请先登录，登录后即可发布招募、报名合作和管理个人资料。"
      asideTitle="登录后你可以做什么"
      asideDescription="Linpai 的发招募、报名合作、个人资料和人才展示都共用同一个账号体系，不需要反复切换入口。"
      tips={[
        "先登录，再继续你刚才想做的动作。",
        "首次登录会先选择身份，再补对应资料。",
        "没有指定下一步时，登录成功后会先回到首页。",
      ]}
    >
      <LoginForm nextPath={nextPath} />
    </FormShell>
  );
}
