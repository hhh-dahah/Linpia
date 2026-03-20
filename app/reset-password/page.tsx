import Link from "next/link";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { FormShell } from "@/components/ui/form-shell";

export default function ResetPasswordPage() {
  return (
    <FormShell
      eyebrow="重置密码"
      title="设置一个新的登录密码"
      description="新密码保存成功后，请重新登录。后面就可以继续用邮箱和密码进入邻派。"
      asideTitle="小提醒"
      asideDescription="密码尽量简单好记，但也别太短。改完之后，系统会让你重新登录一次。"
      tips={[
        "新密码至少 6 位。",
        "两次输入要保持一致。",
        "保存后会跳回登录页。",
      ]}
    >
      <div className="space-y-6">
        <ResetPasswordForm />
        <Link href="/login" className="inline-flex text-sm font-medium text-[var(--primary)]">
          返回登录
        </Link>
      </div>
    </FormShell>
  );
}
