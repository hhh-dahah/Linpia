import { redirect } from "next/navigation";

import { LoginForm } from "@/components/forms/login-form";
import { FormShell } from "@/components/ui/form-shell";
import { getUserFlowState, resolvePostAuthRedirect } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = typeof params.next === "string" ? params.next : "/";
  const resetSuccess = params.reset === "success";
  const flow = await getUserFlowState();

  if (flow.user) {
    redirect(await resolvePostAuthRedirect(nextPath));
  }

  return (
    <FormShell
      eyebrow="账号登录"
      title="登录后继续你刚才想做的事"
      description="现在主登录方式已经改成邮箱和密码。注册时会用邮箱验证码确认，登录后会自动保持登录状态。"
      asideTitle="登录后可以做什么"
      asideDescription="登录后就可以发布招募、报名合作、完善身份资料，也能继续进入你刚才停下来的那一步。"
      tips={[
        "如果你是第一次来，先注册，再输入邮箱验证码完成确认。",
        "如果只是忘了密码，直接点“忘记密码”就可以。",
        "没有指定下一步时，登录成功后会先回到首页。",
      ]}
    >
      <LoginForm
        nextPath={nextPath}
        initialState={
          resetSuccess
            ? { status: "success", message: "密码已重置，请重新登录。", fieldErrors: {} }
            : undefined
        }
      />
    </FormShell>
  );
}
