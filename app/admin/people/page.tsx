import Link from "next/link";

import { AdminFlash } from "@/components/admin/admin-flash";
import { saveAdminPersonAction, updateAdminPersonVisibilityAction } from "@/app/actions";
import {
  mentorSupportMethods,
  mentorSupportScopes,
  skillOptions,
  studentDirectionOptions,
} from "@/constants";
import { getDirectoryPersonAdminById, listDirectoryPeopleAdmin } from "@/lib/admin-data";

export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const role = typeof params.role === "string" ? params.role : "";
  const query = typeof params.query === "string" ? params.query : "";
  const visibilityStatus = typeof params.visibility === "string" ? params.visibility : "";
  const editId = typeof params.edit === "string" ? params.edit : "";
  const message = typeof params.message === "string" ? params.message : "";
  const error = typeof params.error === "string" ? params.error : "";

  const [people, editingPerson] = await Promise.all([
    listDirectoryPeopleAdmin({ role, query, visibilityStatus }),
    editId ? getDirectoryPersonAdminById(editId) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="chip w-fit">人员管理</p>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              统一维护学生与导师目录
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              这里既能管理用户自己完善的资料镜像，也能直接新建未注册的展示型档案。隐藏和归档后，前台人才池会自动同步。
            </p>
          </div>
          <Link href="/admin/people" className="ui-button-secondary px-5 py-3 text-sm font-semibold">
            新建人员
          </Link>
        </div>
      </section>

      <AdminFlash
        message={
          message === "person-saved"
            ? "人员资料已保存。"
            : message === "person-updated"
              ? "人员状态已更新。"
              : ""
        }
        error={error}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="surface-panel rounded-[1.8rem] p-5">
        <form className="grid gap-3 rounded-[1.4rem] border border-line bg-white/75 p-4 md:grid-cols-4">
            <input type="hidden" name="page" value="people" />
            <input name="query" defaultValue={query} className="field-base md:col-span-2" placeholder="搜姓名、学校、专业、方向" />
            <select name="role" defaultValue={role} className="field-base">
              <option value="">全部身份</option>
              <option value="student">学生</option>
              <option value="mentor">导师</option>
            </select>
            <select name="visibility" defaultValue={visibilityStatus} className="field-base">
              <option value="">全部状态</option>
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
            <div className="hidden grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.9fr_160px] gap-4 bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)] lg:grid">
              <span>人员</span>
              <span>资料来源</span>
              <span>身份</span>
              <span>状态</span>
              <span>最近更新</span>
              <span>操作</span>
            </div>
            <div className="divide-y divide-line">
              {people.map((item) => (
                <div key={item.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.9fr_160px] lg:items-center">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{item.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {[item.school, item.major || item.college, item.grade || item.lab].filter(Boolean).join(" / ") || "资料待补充"}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{item.source === "registered" ? "注册镜像" : "后台录入"}</p>
                  <p className="text-sm text-[var(--muted)]">{item.role === "mentor" ? "导师" : "学生"}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {item.visibilityStatus === "active" ? "展示中" : item.visibilityStatus === "hidden" ? "已隐藏" : "已归档"}
                  </p>
                  <p className="text-sm text-[var(--muted)]">{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/people?edit=${item.id}`} className="ui-button-secondary px-3 py-2 text-xs font-semibold">
                      编辑
                    </Link>
                    {["active", "hidden", "archived"].map((nextStatus) => (
                      <form key={nextStatus} action={updateAdminPersonVisibilityAction}>
                        <input type="hidden" name="personId" value={item.id} />
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
              {!people.length ? (
                <div className="px-4 py-12 text-center text-sm text-[var(--muted)]">当前筛选下还没有可管理的人员。</div>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="surface-panel rounded-[1.8rem] p-5">
          <h2 className="text-xl font-bold text-[var(--foreground)]">{editingPerson ? "编辑人员" : "新增人员"}</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            {editingPerson ? "修改后会直接同步到前台展示。" : "适合录入还没注册、但你希望先展示出来的导师或学生。"}
          </p>

          <form action={saveAdminPersonAction} className="mt-5 space-y-4">
            <input type="hidden" name="personId" value={editingPerson?.id ?? ""} />
            <input type="hidden" name="authUserId" value={editingPerson?.authUserId ?? ""} />
            <input type="hidden" name="source" value={editingPerson?.source ?? "managed"} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="field-label">身份</span>
                <select name="role" defaultValue={editingPerson?.role ?? (role === "mentor" ? "mentor" : "student")} className="field-base">
                  <option value="student">学生</option>
                  <option value="mentor">导师</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="field-label">展示状态</span>
                <select name="visibilityStatus" defaultValue={editingPerson?.visibilityStatus ?? "active"} className="field-base">
                  <option value="active">展示中</option>
                  <option value="hidden">已隐藏</option>
                  <option value="archived">已归档</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="field-label">姓名</span>
              <input name="name" defaultValue={editingPerson?.name ?? ""} className="field-base" placeholder="显示给前台看的名字" />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="field-label">学校</span>
                <input name="school" defaultValue={editingPerson?.school ?? ""} className="field-base" />
              </label>
              <label className="block space-y-2">
                <span className="field-label">联系方式</span>
                <input name="contact" defaultValue={editingPerson?.contact ?? ""} className="field-base" />
              </label>
            </div>

            <div className="space-y-4 rounded-[1.5rem] border border-line bg-white/70 p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">学生字段</p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="field-label">专业</span>
                  <input name="major" defaultValue={editingPerson?.major ?? ""} className="field-base" />
                </label>
                <label className="block space-y-2">
                  <span className="field-label">年级</span>
                  <input name="grade" defaultValue={editingPerson?.grade ?? ""} className="field-base" />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="field-label">技能标签</span>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((item) => (
                    <label key={item} className="chip cursor-pointer">
                      <input type="checkbox" name="skills" value={item} defaultChecked={editingPerson?.skills.includes(item)} />
                      {item}
                    </label>
                  ))}
                </div>
              </label>
              <label className="block space-y-2">
                <span className="field-label">想加入的方向</span>
                <div className="flex flex-wrap gap-2">
                  {studentDirectionOptions.map((item) => (
                    <label key={item} className="chip cursor-pointer">
                      <input
                        type="checkbox"
                        name="interestedDirections"
                        value={item}
                        defaultChecked={editingPerson?.interestedDirections.includes(item)}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </label>
              <label className="block space-y-2">
                <span className="field-label">作品链接</span>
                <input name="portfolioUrl" defaultValue={editingPerson?.portfolioUrl ?? ""} className="field-base" />
              </label>
            </div>

            <div className="space-y-4 rounded-[1.5rem] border border-line bg-white/70 p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">导师字段</p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="field-label">学院</span>
                  <input name="college" defaultValue={editingPerson?.college ?? ""} className="field-base" />
                </label>
                <label className="block space-y-2">
                  <span className="field-label">实验室</span>
                  <input name="lab" defaultValue={editingPerson?.lab ?? ""} className="field-base" />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="field-label">研究方向</span>
                <input name="researchDirection" defaultValue={editingPerson?.researchDirection ?? ""} className="field-base" />
              </label>
              <label className="block space-y-2">
                <span className="field-label">可支持内容</span>
                <div className="flex flex-wrap gap-2">
                  {mentorSupportScopes.map((item) => (
                    <label key={item} className="chip cursor-pointer">
                      <input
                        type="checkbox"
                        name="supportTypes"
                        value={item}
                        defaultChecked={editingPerson?.supportTypes.includes(item)}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </label>
              <label className="block space-y-2">
                <span className="field-label">支持方式</span>
                <select name="supportMethod" defaultValue={editingPerson?.supportMethod ?? ""} className="field-base">
                  <option value="">请选择</option>
                  {mentorSupportMethods.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline-flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
                <input type="checkbox" name="openStatus" defaultChecked={editingPerson?.openStatus ?? true} />
                接受申请
              </label>
            </div>

            <label className="block space-y-2">
              <span className="field-label">简介</span>
              <textarea name="bio" defaultValue={editingPerson?.bio ?? ""} rows={5} className="field-base" />
            </label>

            <button type="submit" className="ui-button-primary w-full px-5 py-3 text-sm font-semibold">
              {editingPerson ? "保存修改" : "创建人员"}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}
