import Link from "next/link";

import { TalentCard } from "@/components/cards/talent-card";
import { PageHeading } from "@/components/ui/page-heading";
import { schools, skillOptions } from "@/constants";
import { listTalents } from "@/lib/data";

type SearchProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TalentPage({ searchParams }: SearchProps) {
  const params = (await searchParams) ?? {};
  const query = typeof params.query === "string" ? params.query : "";
  const school = typeof params.school === "string" ? params.school : "";
  const skill = typeof params.skill === "string" ? params.skill : "";
  const talents = await listTalents({ query, school, skill });

  return (
    <div className="space-y-8">
      <section className="surface-panel rounded-[2rem] px-6 py-10 text-center md:px-10">
        <PageHeading
          eyebrow="人才列表"
          title="先看看别人怎么展示自己，也可以马上补上你的技能卡"
          description="如果你还没有明确技能，也没关系，先把基础信息挂出来，后面再慢慢补充。"
          className="mx-auto"
        />
        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex min-w-[240px] items-center justify-center rounded-full bg-[var(--primary-strong)] px-10 py-5 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(17,71,184,0.24)] transition hover:-translate-y-0.5 hover:bg-[var(--primary)]"
          >
            我要展示技能
          </Link>
        </div>
      </section>

      <section className="surface-card rounded-[2rem] p-6">
        <form className="grid gap-4 lg:grid-cols-4">
          <input
            name="query"
            defaultValue={query}
            placeholder="搜索姓名、专业、方向"
            className="field-base lg:col-span-2"
          />
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
          <button
            type="submit"
            className="rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)]"
          >
            应用筛选
          </button>
        </form>
      </section>

      {talents.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {talents.map((item) => (
            <TalentCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="surface-panel rounded-[2rem] p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--foreground)]">暂时没有匹配的人才卡</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            你可以放宽筛选条件，或者先去创建自己的技能卡。
          </p>
        </div>
      )}
    </div>
  );
}
