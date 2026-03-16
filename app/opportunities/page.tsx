import { OpportunityCard } from "@/components/cards/opportunity-card";
import { PageHeading } from "@/components/ui/page-heading";
import { opportunityTypes, schools, skillOptions } from "@/constants";
import { listOpportunities } from "@/lib/data";

type SearchProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OpportunitiesPage({ searchParams }: SearchProps) {
  const params = (await searchParams) ?? {};
  const query = typeof params.query === "string" ? params.query : "";
  const type = typeof params.type === "string" ? params.type : "";
  const school = typeof params.school === "string" ? params.school : "";
  const skill = typeof params.skill === "string" ? params.skill : "";
  const opportunities = await listOpportunities({ query, type, school, skill });

  return (
    <div className="space-y-8">
      <PageHeading eyebrow="机会列表" title="统一查看比赛组队、项目招募、导师机会和短期协作。" description="首版支持按关键词、类型、学校、技能快速筛选；公共访客可浏览，登录后再报名。" />
      <section className="surface-card rounded-[2rem] p-6">
        <form className="grid gap-4 lg:grid-cols-4">
          <input name="query" defaultValue={query} placeholder="搜索标题、技能或摘要" className="field-base lg:col-span-2" />
          <select name="type" defaultValue={type} className="field-base">
            <option value="">全部类型</option>
            {opportunityTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="school" defaultValue={school} className="field-base">
            <option value="">全部学校</option>
            {schools.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="skill" defaultValue={skill} className="field-base">
            <option value="">全部技能</option>
            {skillOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)]">
            应用筛选
          </button>
        </form>
      </section>
      {opportunities.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {opportunities.map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="surface-panel rounded-[2rem] p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--foreground)]">暂时没有匹配的机会</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">可以换一个筛选条件，或者先去发布你的招募需求。</p>
        </div>
      )}
    </div>
  );
}
