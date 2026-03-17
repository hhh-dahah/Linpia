import Link from "next/link";

import { MentorCard } from "@/components/cards/mentor-card";
import { TalentCard } from "@/components/cards/talent-card";
import { PageHeading } from "@/components/ui/page-heading";
import { schools, skillOptions } from "@/constants";
import { listTalentPool } from "@/lib/data";

type SearchProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TalentPage({ searchParams }: SearchProps) {
  const params = (await searchParams) ?? {};
  const query = typeof params.query === "string" ? params.query : "";
  const school = typeof params.school === "string" ? params.school : "";
  const skill = typeof params.skill === "string" ? params.skill : "";
  const { students, mentors } = await listTalentPool({ query, school, skill });

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="surface-panel rounded-[2rem] px-6 py-10 md:px-10">
        <PageHeading
          eyebrow="人才池"
          title="浏览平台内正在开放协作的学生与导师"
          description="这里汇总平台内的学生能力卡和导师资料，先看人，再决定要不要进一步联系、报名合作或发起招募。"
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/profile" className="ui-button-primary px-5 py-3 text-sm font-semibold">
            去完善我的个人资料
          </Link>
          <Link href="/publish" className="ui-button-secondary px-5 py-3 text-sm font-semibold">
            去发布招募
          </Link>
        </div>
      </section>

      <section className="surface-card rounded-[2rem] p-6">
        <form className="grid gap-4 lg:grid-cols-4">
          <input
            name="query"
            defaultValue={query}
            placeholder="搜索姓名、学校、方向或关键词"
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
            <option value="">全部标签</option>
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

      <section id="student-section" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <PageHeading
            eyebrow="学生区"
            title="先看正在找队伍、找项目或想展示能力的学生"
            description="学生资料会优先展示学校、方向、技能标签和可投入时间，方便发起方快速判断是否适合合作。"
          />
          <span className="hidden rounded-full bg-[rgba(36,107,250,0.08)] px-3 py-1 text-sm font-semibold text-[var(--primary)] sm:inline-flex">
            共 {students.length} 人
          </span>
        </div>

        {students.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {students.map((item) => (
              <TalentCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="surface-panel rounded-[2rem] p-8 text-center">
            <h2 className="text-xl font-bold text-[var(--foreground)]">当前还没有匹配的学生资料</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">你可以放宽筛选条件，或先去完善自己的个人资料。</p>
          </div>
        )}
      </section>

      <section id="mentor-section" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <PageHeading
            eyebrow="导师区"
            title="再看愿意提供方向、资源或带队支持的导师"
            description="导师资料会集中展示研究方向、支持内容、支持方式与开放状态，方便学生和项目发起方快速判断是否适合连接。"
          />
          <span className="hidden rounded-full bg-[rgba(255,159,74,0.12)] px-3 py-1 text-sm font-semibold text-[#c26e25] sm:inline-flex">
            共 {mentors.length} 位
          </span>
        </div>

        {mentors.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {mentors.map((item) => (
              <MentorCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="surface-panel rounded-[2rem] p-8 text-center">
            <h2 className="text-xl font-bold text-[var(--foreground)]">当前还没有匹配的导师资料</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">后续导师入驻后会在这里持续补充，也欢迎你先去完善自己的资料。</p>
          </div>
        )}
      </section>
    </div>
  );
}
