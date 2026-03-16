import { CaseCard } from "@/components/cards/case-card";
import { PageHeading } from "@/components/ui/page-heading";
import { listCases } from "@/lib/data";

export default async function CasesPage() {
  const cases = await listCases();

  return (
    <div className="space-y-8">
      <PageHeading eyebrow="成功案例" title="用真实配队结果证明平台有价值。" description="案例页既是冷启动素材，也是平台信任感的来源。首版支持管理员后台录入。" />
      <div className="grid gap-5 lg:grid-cols-2">
        {cases.map((item) => (
          <CaseCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
