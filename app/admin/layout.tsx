import Link from "next/link";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { canManageAdmins, requireAdminAccess } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, adminUser } = await requireAdminAccess("/admin");

  if (!adminUser) {
    return (
      <div className="surface-card mx-auto max-w-3xl rounded-[2rem] p-8 text-center">
        <p className="chip mx-auto w-fit">后台管理</p>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          当前账号没有后台权限
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          后台登录继续复用邻派的账号密码体系，但只有管理员账号才能进入。你可以联系超级管理员给当前邮箱开通后台权限。
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="ui-button-secondary px-5 py-3 text-sm font-semibold">
            返回首页
          </Link>
          <Link href="/profile" className="ui-button-primary px-5 py-3 text-sm font-semibold">
            去个人资料
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="surface-card h-fit rounded-[2rem] p-5">
        <div className="rounded-[1.6rem] border border-line bg-surface-muted px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Linpai Admin</p>
          <h2 className="mt-3 text-xl font-bold text-[var(--foreground)]">{user.email}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            当前身份：{adminUser.role === "super_admin" ? "超级管理员" : "运营管理员"}
          </p>
        </div>
        <div className="mt-4">
          <AdminSidebar canManageAdmins={canManageAdmins(adminUser.role)} />
        </div>
      </aside>
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
