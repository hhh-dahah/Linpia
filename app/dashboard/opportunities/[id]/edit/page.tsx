import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PublishForm } from "@/components/forms/publish-form";
import { FormShell } from "@/components/ui/form-shell";
import { getCurrentUser } from "@/lib/auth";
import { getManagedOpportunityForEdit } from "@/lib/data";

type EditOpportunityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditOpportunityPage({ params }: EditOpportunityPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/opportunities/${id}/edit`)}`);
  }

  const snapshot = await getManagedOpportunityForEdit(id, user.id);

  if (!snapshot) {
    notFound();
  }

  return (
    <FormShell
      eyebrow="编辑招募"
      title="修改这条招募"
      description="先把你要改的地方更新好，保存后公开详情和管理页都会同步变化。"
      asideTitle="改动会同步到哪里"
      asideDescription="你在这里改的标题、详细需求说明、联系方式和报名要求，都会直接同步到公开招募详情。"
      tips={[
        "如果只是想补充细节，可以先改详细需求说明。",
        "报名者需提交项改完后，后续新的报名会按新要求显示。",
        "保存后可以回到招募管理页继续看谁报名了。",
      ]}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/dashboard/opportunities/${snapshot.id}`} className="ui-button-secondary px-4 py-2 text-sm font-semibold">
            返回招募管理页
          </Link>
          <Link href={`/opportunities/${snapshot.id}`} className="ui-button-secondary px-4 py-2 text-sm font-semibold">
            查看公开详情
          </Link>
        </div>

        <PublishForm
          role={snapshot.role}
          mode="edit"
          opportunityId={snapshot.id}
          initialValues={snapshot}
        />
      </div>
    </FormShell>
  );
}
