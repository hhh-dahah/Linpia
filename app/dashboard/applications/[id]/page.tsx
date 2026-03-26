import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteOwnApplicationAction } from "@/app/actions";
import { ApplicationForm } from "@/components/forms/application-form";
import { FormShell } from "@/components/ui/form-shell";
import { InlineDangerConfirmAction } from "@/components/ui/inline-danger-confirm-action";
import { getCurrentUser } from "@/lib/auth";
import { getOwnApplicationById } from "@/lib/data";

type OwnApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OwnApplicationDetailPage({ params }: OwnApplicationDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/applications/${id}`)}`);
  }

  const snapshot = await getOwnApplicationById(id, user.id);

  if (!snapshot) {
    notFound();
  }

  const initialValues = {
    contact: snapshot.application.contact,
    intro: snapshot.application.submissionPayload.intro ?? snapshot.application.introduction,
    portfolioLink: snapshot.application.submissionPayload.portfolioLink ?? snapshot.application.proofUrl,
    projectExperience: snapshot.application.projectExperience,
    proofMaterial: snapshot.application.proofMaterial,
    resumeLink: snapshot.application.resumeLink,
    githubPortfolio: snapshot.application.githubPortfolio,
    availability: snapshot.application.availability,
  };

  const statusHint =
    snapshot.application.status && snapshot.application.status !== "待查看"
      ? `当前进度：${snapshot.application.status}`
      : "你可以随时回来补充或修改已经提交的报名内容。";

  return (
    <FormShell
      eyebrow="我的报名"
      title={`修改你提交给「${snapshot.opportunity.title}」的报名信息`}
      description="这里展示的是你已经提交给招募方的内容。保存后，招募方看到的就是最新版本。"
      asideTitle="这里可以做什么"
      asideDescription={statusHint}
      tips={[
        "自我介绍建议围绕你会做什么、做过什么来写。",
        "联系方式会一直保留为必填，方便招募方尽快联系你。",
        "如果你决定不再参与，也可以在这里取消这次报名。",
      ]}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
            返回我的发布管理
          </Link>
          <Link
            href={`/opportunities/${snapshot.opportunity.id}`}
            className="ui-button-secondary px-4 py-2 text-sm font-semibold"
          >
            查看这条招募
          </Link>
        </div>

        <InlineDangerConfirmAction
          action={deleteOwnApplicationAction}
          hiddenFields={{
            applicationId: snapshot.application.id,
            opportunityId: snapshot.opportunity.id,
          }}
          triggerLabel="取消这次报名"
          confirmTitle="确认取消这次报名吗？"
          confirmDescription="取消后，这次报名会从你的记录中移除，招募方侧也不会再看到。"
          confirmLabel="确认取消报名"
        />

        <ApplicationForm
          mode="edit"
          applicationId={snapshot.application.id}
          opportunityId={snapshot.opportunity.id}
          requiredItems={snapshot.opportunity.applicationRequiredItems}
          requirementNote={snapshot.opportunity.applicationRequirementNote}
          initialValues={initialValues}
          submitLabel="保存报名信息"
        />
      </div>
    </FormShell>
  );
}
