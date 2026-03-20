import Link from "next/link";

import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { FormShell } from "@/components/ui/form-shell";

export default function ForgotPasswordPage() {
  return (
    <FormShell
      eyebrow="找回密码"
      title="把重置密码的邮件发到你的邮箱"
      description="输入注册邮箱后，我们会把重置密码的链接发给你。完成后再回来登录就可以。"
      asideTitle="会发生什么"
      asideDescription="邮件发出后，打开邮件里的链接，设置新密码，再回到邻派登录。"
      tips={[
        "如果几分钟内没收到邮件，先看看垃圾箱。",
        "连续点很多次可能会被限流，稍等一会再试。",
        "改完密码后，旧密码就不能再用了。",
      ]}
    >
      <div className="space-y-6">
        <ForgotPasswordForm />
        <Link href="/login" className="inline-flex text-sm font-medium text-[var(--primary)]">
          返回登录
        </Link>
      </div>
    </FormShell>
  );
}
