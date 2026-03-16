import { LoginForm } from "@/components/forms/login-form";
import { FormShell } from "@/components/ui/form-shell";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : "/dashboard";

  return (
    <FormShell
      eyebrow="邮箱验证码登录"
      title="登录后再发布招募、报名合作和管理你的资料"
      description="请先登录，登录后即可发布招募、报名合作和管理个人资料。"
      asideTitle="登录后你可以做什么"
      asideDescription="Linpai 的发布、报名、展示技能都走同一个账号体系，不需要反复切换页面。"
      tips={["先登录，再继续你刚才想做的动作。", "首次登录会先选择身份，再补资料。", "之后平台会尽量记住你的原始意图。"]}
    >
      <LoginForm nextPath={nextPath} />
    </FormShell>
  );
}
