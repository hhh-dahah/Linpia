import { AdminCaseForm } from "@/components/forms/admin-case-form";
import { AdminMentorForm } from "@/components/forms/admin-mentor-form";
import { PageHeading } from "@/components/ui/page-heading";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminEmail(user.email)) {
    return (
      <div className="surface-card rounded-[2rem] p-8 text-center">
        <PageHeading eyebrow="管理员后台" title="当前账号不在管理员白名单中。" description="请在 `.env.local` 中配置 `ADMIN_EMAILS`，并使用对应邮箱登录后再进入该页面。" className="mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeading eyebrow="管理员后台" title="录入导师与成功案例" description="首版采用轻后台方式，管理员通过白名单邮箱进入本页，录入展示数据而不做复杂 RBAC。" />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="surface-card rounded-[2rem] p-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">导师录入</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">填写导师方向、支持范围和开放状态。</p>
          <div className="mt-6">
            <AdminMentorForm />
          </div>
        </section>

        <section className="surface-card rounded-[2rem] p-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">案例录入</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">沉淀配队结果，为平台冷启动提供传播素材。</p>
          <div className="mt-6">
            <AdminCaseForm />
          </div>
        </section>
      </div>
    </div>
  );
}
