import Link from "next/link";

import {
  saveAdminOpportunityAction,
  updateAdminOpportunityVisibilityAction,
} from "@/app/actions";
import { AdminFlash } from "@/components/admin/admin-flash";
import { listAdminOpportunities, getAdminOpportunityById } from "@/lib/admin-data";
import { opportunityTypes } from "@/types/opportunity";

const opportunityStatusOptions = ["开放申请", "进行中", "已截止"] as const;

export default async function AdminOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const query = typeof params.query === "string" ? params.query : "";
  const visibilityStatus = typeof params.visibility === "string" ? params.visibility : "";
  const creatorRole = typeof params.creatorRole === "string" ? params.creatorRole : "";
  const editId = typeof params.edit === "string" ? params.edit : "";
  const message = typeof params.message === "string" ? params.message : "";
  const error = typeof params.error === "string" ? params.error : "";

  const [items, editing] = await Promise.all([
    listAdminOpportunities({ status, query, visibilityStatus, creatorRole }),
    editId ? getAdminOpportunityById(editId) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[2rem] p-6 sm:p-8">
        <p className="chip w-fit">招募管理</p>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          统一处理前台所有招募
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          学生队长、项目发起人和导师发布的招募都在这里统一管理。你可以直接调整可见状态，也可以编辑标题、招募状态和组织信息。
        </p>
      </section>

      <AdminFlash
        message={
          message === "opportunity-saved"
            ? "招募信息已保存。"
            : message === "opportunity-updated"
              ? "招募可见状态已更新。"
              : ""
        }
        error={error}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="surface-panel rounded-[1.8rem] p-5">
        <form className="grid gap-3 rounded-[1.4rem] border border-line bg-white/75 p-4 md:grid-cols-4">
            <input name="query" defaultValue={query} className="field-base md:col-span-2" placeholder="搜标题、组织、发布者" />
            <select name="status" defaultValue={status} className="field-base">
              <option value="">全部业务状态</option>
              {opportunityStatusOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select name="creatorRole" defaultValue={creatorRole} className="field-base">
              <option value="">全部发起身份</option>
              <option value="student">学生</option>
              <option value="mentor">导师</option>
            </select>
            <select name="visibility" defaultValue={visibilityStatus} className="field-base">
              <option value="">全部展示状态</option>
              <option value="active">展示中</option>
              <option value="hidden">已隐藏</option>
              <option value="archived">已归档</option>
            </select>
            <div className="md:col-span-4">
              <button type="submit" className="ui-button-primary px-5 py-3 text-sm font-semibold">
                应用筛选
              </button>
            </div>
          </form>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-line">
            <div className="hidden grid-cols-[1.8fr_1fr_1fr_0.8fr_150px] gap-4 bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)] lg:grid">
              <span>招募</span>
              <span>发起方</span>
              <span>业务状态</span>
              <span>展示状态</span>
              <span>操作</span>
            </div>
            <div className="divide-y divide-line">
              {items.map((item) => (
                <div key={item.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[1.8fr_1fr_1fr_0.8fr_150px] lg:items-center">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{item.organization}</p>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {item.creatorRole === "mentor" ? "导师" : "学生"} / {item.creatorName}
                  </p>
                  <p className="text-sm text-[var(--muted)]">{item.status}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {item.visibilityStatus === "active" ? "展示中" : item.visibilityStatus === "hidden" ? "已隐藏" : "已归档"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/opportunities?edit=${item.id}`} className="ui-button-secondary px-3 py-2 text-xs font-semibold">
                      编辑
                    </Link>
                    {["active", "hidden", "archived"].map((nextStatus) => (
                      <form key={nextStatus} action={updateAdminOpportunityVisibilityAction}>
                        <input type="hidden" name="opportunityId" value={item.id} />
                        <input type="hidden" name="visibilityStatus" value={nextStatus} />
                        <button
                          type="submit"
                        className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover-border-brand-soft hover:text-[var(--foreground)]"
                        >
                          {nextStatus === "active" ? "展示" : nextStatus === "hidden" ? "隐藏" : "归档"}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="surface-panel rounded-[1.8rem] p-5">
          <h2 className="text-xl font-bold text-[var(--foreground)]">编辑招募</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">先从左侧选择一条招募，再在这里调整前台展示和业务状态。</p>

          {editing ? (
            <form action={saveAdminOpportunityAction} className="mt-5 space-y-4">
              <input type="hidden" name="opportunityId" value={editing.id} />
              <label className="block space-y-2">
                <span className="field-label">招募标题</span>
                <input name="title" defaultValue={editing.title} className="field-base" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="field-label">招募类型</span>
                  <select name="type" defaultValue={editing.type} className="field-base">
                    {opportunityTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="field-label">发起身份</span>
                        <input value={editing.creatorRole === "mentor" ? "导师" : "学生"} readOnly className="field-base bg-surface-muted" />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="field-label">组织信息</span>
                <input name="organization" defaultValue={editing.organization} className="field-base" />
              </label>
              <label className="block space-y-2">
                <span className="field-label">摘要</span>
                <textarea name="summary" defaultValue={editing.summary} rows={4} className="field-base" />
              </label>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-2">
                  <span className="field-label">业务状态</span>
                  <select name="status" defaultValue={editing.status} className="field-base">
                    {opportunityStatusOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="field-label">展示状态</span>
                  <select name="visibilityStatus" defaultValue={editing.visibilityStatus} className="field-base">
                    <option value="active">展示中</option>
                    <option value="hidden">已隐藏</option>
                    <option value="archived">已归档</option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="field-label">截止日期</span>
                  <input name="deadline" defaultValue={editing.deadline} className="field-base" />
                </label>
              </div>
              <button type="submit" className="ui-button-primary w-full px-5 py-3 text-sm font-semibold">
                保存招募修改
              </button>
            </form>
          ) : (
          <div className="mt-5 rounded-[1.5rem] border border-line border-dashed px-4 py-10 text-sm text-[var(--muted)]">
              先在左侧点“编辑”，右侧才会出现对应招募的可编辑表单。
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
