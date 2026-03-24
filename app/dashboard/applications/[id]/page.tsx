import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApplicationForm } from "@/components/forms/application-form";
import { FormShell } from "@/components/ui/form-shell";
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
      : "你可以随时回来补充或修改自己的报名信息。";

  return (
    <FormShell
      eyebrow="我的报名"
      title={`修改你提交给「${snapshot.opportunity.title}」的报名信息`}
      description="这里展示的是你已经提交给招募方的内容。保存后，招募方看到的就是最新版。"
      asideTitle="这页可以做什么"
      asideDescription={statusHint}
      tips={[
        "自我介绍建议围绕你会做什么、做过什么来写。",
        "联系方式会一直保留为必填，方便招募方联系你。",
        "如果这条招募要求作品或项目经历，也可以在这里随时补充。",
      ]}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
            返回我的发布管理
          </Link>
          <Link href={`/opportunities/${snapshot.opportunity.id}`} className="ui-button-secondary px-4 py-2 text-sm font-semibold">
            查看这条招募
          </Link>
        </div>

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
