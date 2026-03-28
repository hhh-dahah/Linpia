import Link from "next/link";

import { OpportunityCard } from "@/components/cards/opportunity-card";
import { PageHeading } from "@/components/ui/page-heading";
import { opportunityTypes, recruitmentTagPresets } from "@/constants";
import { listPaginatedOpportunities } from "@/lib/data";
import { opportunityStatuses } from "@/types/opportunity";

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
  const creatorRole = readSingleParam(params.creatorRole);
  const school = readSingleParam(params.school);
  const skill = readSingleParam(params.skill);
  const status = readSingleParam(params.status);
  const rawPage = Number.parseInt(readSingleParam(params.page), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const { items: opportunities, hasMore } = await listPaginatedOpportunities(
    { query, type, creatorRole, school, skill, status },
    { page, pageSize: PAGE_SIZE },
  );

  const buildLoadMoreHref = () => {
    const nextParams = new URLSearchParams();

    if (query) nextParams.set("query", query);
    if (type) nextParams.set("type", type);
    if (creatorRole) nextParams.set("creatorRole", creatorRole);
    if (school) nextParams.set("school", school);
    if (skill) nextParams.set("skill", skill);
    if (status) nextParams.set("status", status);
    nextParams.set("page", String(page + 1));

    return `/opportunities?${nextParams.toString()}`;
  };

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="找机会"
        title="在一个机会池里统一查看所有开放中的招募"
        description="学生队长、项目发起人和导师都从这里发布需求，先看机会，再决定要不要报名。"
      />

      <section className="surface-card rounded-[2rem] p-6">
        <form className="grid gap-4 lg:grid-cols-5">
          <input
            name="query"
            defaultValue={query}
            placeholder="搜索标题、发布方、项目名或摘要"
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

          <select name="creatorRole" defaultValue={creatorRole} className="field-base">
            <option value="">全部发布身份</option>
            <option value="student">学生</option>
            <option value="mentor">导师</option>
          </select>

          <select name="skill" defaultValue={skill} className="field-base">
            <option value="">全部技能标签</option>
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

          <select name="status" defaultValue={status} className="field-base">
            <option value="">全部开放状态</option>
            {opportunityStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)] lg:col-span-2"
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
          <h2 className="text-xl font-bold text-[var(--foreground)]">当前筛选下还没有匹配的招募</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">可以换一个筛选条件，或者先去发布你的招募。</p>
        </div>
      )}
    </div>
  );
}
