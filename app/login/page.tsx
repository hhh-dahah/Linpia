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
      title="登录后再发布、报名和管理你的资料"
      description="输入邮箱后获取验证码，直接在站内完成登录。游客也能浏览页面，但登录后才能创建个人资料、发布机会和提交报名。"
      asideTitle="登录后你可以做什么"
      asideDescription="把用户动作集中到同一个后台里，避免页面跳来跳去。"
      tips={["创建并维护自己的技能卡。", "发布机会，持续补充角色说明。", "在后台查看报名和投递记录。"]}
    >
      <LoginForm nextPath={nextPath} />
    </FormShell>
  );
}
