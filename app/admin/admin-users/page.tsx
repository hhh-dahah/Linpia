import { saveAdminUserAction, toggleAdminUserActiveAction } from "@/app/actions";
import { AdminFlash } from "@/components/admin/admin-flash";
import { canManageAdmins, requireAdminAccess } from "@/lib/admin";
import { listAdminUsers } from "@/lib/admin-data";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : "";
  const error = typeof params.error === "string" ? params.error : "";
  const { adminUser } = await requireAdminAccess("/admin/admin-users");

  if (!adminUser || !canManageAdmins(adminUser.role)) {
    return (
      <div className="surface-card rounded-[2rem] p-8 text-center">
        <p className="chip mx-auto w-fit">管理员管理</p>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
          只有超级管理员可以进入这里
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          你当前仍然可以使用人员、招募和报名管理，但不能增减后台账号。
        </p>
      </div>
    );
  }

  const adminUsers = await listAdminUsers();

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[2rem] p-6 sm:p-8">
        <p className="chip w-fit">管理员管理</p>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          维护后台账号权限
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          首批超级管理员仍然可以来自白名单邮箱，但后续后台账号建议都在这里统一维护，避免权限依赖环境变量长期扩散。
        </p>
      </section>

      <AdminFlash
        message={
          message === "admin-user-saved"
            ? "管理员账号已保存。"
            : message === "admin-user-updated"
              ? "管理员状态已更新。"
              : ""
        }
        error={error}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="surface-panel rounded-[1.8rem] p-5">
        <div className="overflow-hidden rounded-[1.5rem] border border-line">
          <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_150px] gap-4 bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)] lg:grid">
              <span>邮箱</span>
              <span>角色</span>
              <span>状态</span>
              <span>操作</span>
            </div>
            <div className="divide-y divide-line">
              {adminUsers.map((item) => (
                <div key={item.userId} className="grid gap-4 px-4 py-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_150px] lg:items-center">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{item.email || "未读取到邮箱"}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">创建于 {new Date(item.createdAt).toLocaleDateString("zh-CN")}</p>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{item.role === "super_admin" ? "超级管理员" : "运营管理员"}</p>
                  <p className="text-sm text-[var(--muted)]">{item.isActive ? "启用中" : "已停用"}</p>
                  <form action={toggleAdminUserActiveAction}>
                    <input type="hidden" name="userId" value={item.userId} />
                    <input type="hidden" name="isActive" value={item.isActive ? "false" : "true"} />
                    <button type="submit" className="ui-button-secondary px-3 py-2 text-xs font-semibold">
                      {item.isActive ? "停用" : "启用"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="surface-panel rounded-[1.8rem] p-5">
          <h2 className="text-xl font-bold text-[var(--foreground)]">新增或更新管理员</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">输入一个已经注册过平台的邮箱，即可把它加入后台账号列表。</p>
          <form action={saveAdminUserAction} className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="field-label">邮箱</span>
              <input name="email" type="email" className="field-base" placeholder="已经注册过平台的邮箱" />
            </label>
            <label className="block space-y-2">
              <span className="field-label">角色</span>
              <select name="role" defaultValue="operator" className="field-base">
                <option value="operator">运营管理员</option>
                <option value="super_admin">超级管理员</option>
              </select>
            </label>
            <button type="submit" className="ui-button-primary w-full px-5 py-3 text-sm font-semibold">
              保存管理员账号
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}
