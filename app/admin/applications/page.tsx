import { updateAdminApplicationStatusAction } from "@/app/actions";
import { AdminFlash } from "@/components/admin/admin-flash";
import { listAdminApplications } from "@/lib/admin-data";
import { adminApplicationStatuses } from "@/types/admin";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const query = typeof params.query === "string" ? params.query : "";
  const message = typeof params.message === "string" ? params.message : "";
  const error = typeof params.error === "string" ? params.error : "";

  const items = await listAdminApplications({ status, query });

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[2rem] p-6 sm:p-8">
        <p className="chip w-fit">报名管理</p>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          统一处理报名申请
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          后台会统一看到所有招募收到的申请，你可以快速切换状态，判断哪些要继续沟通、哪些已经通过。
        </p>
      </section>

      <AdminFlash message={message === "application-updated" ? "报名状态已更新。" : ""} error={error} />

      <section className="surface-panel rounded-[1.8rem] p-5">
        <form className="grid gap-3 rounded-[1.4rem] border border-line bg-white/75 p-4 md:grid-cols-3">
          <input
            name="query"
            defaultValue={query}
            className="field-base md:col-span-2"
            placeholder="搜申请人、招募标题、联系方式"
          />
          <select name="status" defaultValue={status} className="field-base">
            <option value="">全部状态</option>
            {adminApplicationStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <div className="md:col-span-3">
            <button type="submit" className="ui-button-primary px-5 py-3 text-sm font-semibold">
              应用筛选
            </button>
          </div>
        </form>

        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-[1.5rem] border border-line bg-white/85 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--muted)]">申请人</p>
                    <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">{item.applicantName}</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.applicantRole === "mentor" ? "导师" : item.applicantRole === "student" ? "学生" : "未识别身份"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--muted)]">报名目标</p>
                    <p className="mt-1 text-sm leading-7 text-[var(--foreground)]">{item.opportunityTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--muted)]">自我介绍</p>
                    <p className="mt-1 text-sm leading-7 text-[var(--foreground)]">{item.introduction || "未填写"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--muted)]">联系方式</p>
                    <p className="mt-1 text-sm leading-7 text-[var(--foreground)]">{item.contact || "未填写"}</p>
                  </div>
                  {item.proofUrl ? (
                    <div>
                      <p className="text-sm font-medium text-[var(--muted)]">作品证明链接</p>
                      <a href={item.proofUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-sm font-semibold text-[var(--primary)]">
                        {item.proofUrl}
                      </a>
                    </div>
                  ) : null}
                </div>

                <form action={updateAdminApplicationStatusAction} className="w-full rounded-[1.4rem] border border-line bg-surface-muted p-4 xl:w-72">
                  <input type="hidden" name="applicationId" value={item.id} />
                  <p className="text-sm font-medium text-[var(--muted)]">更新状态</p>
                  <select name="status" defaultValue={item.status} className="field-base mt-3">
                    {adminApplicationStatuses.map((statusItem) => (
                      <option key={statusItem} value={statusItem}>
                        {statusItem}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="ui-button-primary mt-3 w-full px-4 py-3 text-sm font-semibold">
                    保存状态
                  </button>
                </form>
              </div>
            </article>
          ))}

          {!items.length ? (
            <div className="rounded-[1.5rem] border border-line border-dashed px-4 py-12 text-center text-sm text-[var(--muted)]">
              当前筛选下还没有报名记录。
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
