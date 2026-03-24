import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateOwnApplicationStatusAction } from "@/app/actions";
import { FormFeedback } from "@/components/ui/form-feedback";
import { getCurrentUser } from "@/lib/auth";
import { getManagedOpportunityApplications } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { applicationStatuses } from "@/types/application";

type ManagedOpportunityDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessageState(params?: Record<string, string | string[] | undefined>) {
  const error = typeof params?.error === "string" ? params.error : "";
  const message = typeof params?.message === "string" ? params.message : "";

  if (error) {
    return { status: "error" as const, message: error };
  }

  if (message) {
    return { status: "success" as const, message };
  }

  return null;
}

function renderTextBlock(label: string, value: string, emptyText: string) {
  return (
    <div className="rounded-2xl bg-surface-muted px-4 py-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{value || emptyText}</p>
    </div>
  );
}

function renderLinkBlock(label: string, value: string, emptyText: string) {
  return (
    <div className="rounded-2xl bg-surface-muted px-4 py-4">
      <p className="text-sm text-muted">{label}</p>
      {value ? (
        <Link href={value} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-primary">
          打开链接
        </Link>
      ) : (
        <p className="mt-2 text-sm leading-7 text-foreground">{emptyText}</p>
      )}
    </div>
  );
}

export default async function ManagedOpportunityDetailPage({
  params,
  searchParams,
}: ManagedOpportunityDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/opportunities/${id}`)}`);
  }

  const snapshot = await getManagedOpportunityApplications(id, user.id);

  if (!snapshot) {
    notFound();
  }

  const feedback = getMessageState(query);

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-[2rem] px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link href="/dashboard" className="text-sm font-semibold text-primary">
              返回我的报名和发布管理
            </Link>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {snapshot.opportunity.title}
            </h1>
            <p className="text-sm leading-7 text-muted">
              {snapshot.opportunity.type} · {snapshot.opportunity.status} · 当前共有 {snapshot.applications.length} 人报名
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/opportunities/${snapshot.opportunity.id}/edit`}
              className="ui-button-primary px-4 py-2 text-sm font-semibold"
            >
              编辑这条招募
            </Link>
            <Link href={`/opportunities/${snapshot.opportunity.id}`} className="ui-button-secondary px-4 py-2 text-sm font-semibold">
              查看公开详情
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-surface-muted px-4 py-4">
            <p className="text-sm text-muted">详细需求说明</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{snapshot.opportunity.summary}</p>
          </div>
          <div className="rounded-2xl bg-surface-muted px-4 py-4">
            <p className="text-sm text-muted">联系与补充信息</p>
            <ul className="mt-2 space-y-2 text-sm leading-7 text-foreground">
              {snapshot.opportunity.supplementaryItems.length ? (
                snapshot.opportunity.supplementaryItems.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>暂无补充其他说明</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {feedback ? <FormFeedback state={feedback} /> : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">报名详情</h2>
            <p className="mt-1 text-sm text-muted">在这里查看是谁报名了、对方提交了什么信息，并手动更新处理状态。</p>
          </div>
        </div>

        {snapshot.applications.length ? (
          <div className="space-y-4">
            {snapshot.applications.map((item) => (
              <article key={item.id} className="surface-panel rounded-[1.6rem] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{item.applicantName}</h3>
                      {item.applicantRole ? (
                        <span className="chip">{item.applicantRole === "mentor" ? "导师身份" : "学生身份"}</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted">提交于 {formatDate(item.submittedAt)}</p>
                  </div>

                  <form action={updateOwnApplicationStatusAction} className="flex flex-wrap items-center gap-3">
                    <input type="hidden" name="applicationId" value={item.id} />
                    <input type="hidden" name="opportunityId" value={snapshot.opportunity.id} />
                    <label className="text-sm font-medium text-foreground">
                      报名状态
                      <select name="status" defaultValue={item.status} className="field-base mt-2 min-w-[11rem]">
                        {applicationStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" className="ui-button-primary px-4 py-2 text-sm font-semibold">
                      更新状态
                    </button>
                  </form>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {renderTextBlock("自我介绍", item.introduction, "对方还没有填写自我介绍。")}
                  {renderTextBlock("联系方式", item.contact, "对方还没有填写联系方式。")}
                  {renderLinkBlock("作品证明链接", item.proofUrl, "对方没有补充作品链接。")}
                  {renderTextBlock("项目经历", item.projectExperience, "对方没有补充项目经历。")}
                  {renderTextBlock("证明材料", item.proofMaterial, "对方没有补充证明材料。")}
                  {renderLinkBlock("简历链接", item.resumeLink, "对方没有补充简历链接。")}
                  {renderLinkBlock("GitHub / 作品集", item.githubPortfolio, "对方没有补充 GitHub / 作品集。")}
                  {renderTextBlock("可投入时间", item.availability, "对方没有补充可投入时间。")}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-panel rounded-[1.6rem] p-6 text-center">
            <h3 className="text-xl font-bold text-foreground">还没有人报名这条招募</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              你可以先继续完善招募说明，或者回到公开详情页看看展示是否清楚。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
