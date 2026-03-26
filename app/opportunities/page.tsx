import Link from "next/link";

import { OpportunityCard } from "@/components/cards/opportunity-card";
import { PageHeading } from "@/components/ui/page-heading";
import { opportunityTypes, recruitmentTagPresets } from "@/constants";
import { listPaginatedOpportunities } from "@/lib/data";

const PAGE_SIZE = 5;

type SearchProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSingleParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function OpportunitiesPage({ searchParams }: SearchProps) {
  const params = (await searchParams) ?? {};
  const query = readSingleParam(params.query);
  const type = readSingleParam(params.type);
  const school = readSingleParam(params.school);
  const skill = readSingleParam(params.skill);
  const rawPage = Number.parseInt(readSingleParam(params.page), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const { items: opportunities, hasMore } = await listPaginatedOpportunities(
    { query, type, school, skill },
    { page, pageSize: PAGE_SIZE },
  );

  const buildLoadMoreHref = () => {
    const nextParams = new URLSearchParams();

    if (query) nextParams.set("query", query);
    if (type) nextParams.set("type", type);
    if (school) nextParams.set("school", school);
    if (skill) nextParams.set("skill", skill);
    nextParams.set("page", String(page + 1));

    return `/opportunities?${nextParams.toString()}`;
  };

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="找队伍"
        title="在一个招募池里看完所有正在开放的队伍"
        description="导师带队、学生队长和项目发起人的招募都在这里展示哦"
      />

      <section className="surface-card rounded-[2rem] p-6">
        <form className="grid gap-4 lg:grid-cols-4">
          <input
            name="query"
            defaultValue={query}
            placeholder="搜索标题、发布方、项目名称或摘要"
            className="field-base lg:col-span-2"
          />
          <select name="type" defaultValue={type} className="field-base">
            <option value="">全部类型</option>
            {opportunityTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="skill" defaultValue={skill} className="field-base">
            <option value="">全部标签</option>
            {recruitmentTagPresets.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            name="school"
            defaultValue={school}
            placeholder="筛学校 / 团队 / 实验室"
            className="field-base"
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)]"
          >
            应用筛选
          </button>
        </form>
      </section>

      {opportunities.length ? (
        <div className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-2">
            {opportunities.map((item) => (
              <OpportunityCard key={item.id} item={item} />
            ))}
          </div>

          {hasMore ? (
            <div className="flex justify-center">
              <Link href={buildLoadMoreHref()} className="ui-button-secondary px-6 py-3 text-sm font-semibold">
                查看更多招募
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="surface-panel rounded-[2rem] p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--foreground)]">暂时没有匹配的招募</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">可以换一个筛选条件，或者先去发布你的招募。</p>
        </div>
      )}
    </div>
  );
}
