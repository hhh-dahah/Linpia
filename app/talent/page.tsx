import Link from "next/link";

import { HomeTalentPoolSection } from "@/components/home/home-talent-pool-section";
import { schools, skillOptions } from "@/constants";
import { listTalentPool } from "@/lib/data";

const TALENT_PAGE_FETCH_LIMIT = 100;

type SearchProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TalentPage({ searchParams }: SearchProps) {
  const params = (await searchParams) ?? {};
  const query = typeof params.query === "string" ? params.query : "";
  const school = typeof params.school === "string" ? params.school : "";
  const skill = typeof params.skill === "string" ? params.skill : "";

  const talentPool = await listTalentPool(
    { query, school, skill },
    {
      mentorLimit: TALENT_PAGE_FETCH_LIMIT,
      studentLimit: TALENT_PAGE_FETCH_LIMIT,
    },
  );

  const hasFilters = Boolean(query || school || skill);
  const studentCount = hasFilters ? talentPool.students.length : talentPool.studentCount;
  const mentorCount = hasFilters ? talentPool.mentors.length : talentPool.mentorCount;

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">人才池</span>
        </div>
        <h1 className="mt-4 font-display text-[2.4rem] font-bold leading-[1.04] tracking-[-0.04em] text-[var(--foreground)] sm:text-[3.4rem]">
          在一个页面里筛选平台里的学生和导师
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
          你可以按关键词、技能和学校查找合适的人。关键词会同时匹配姓名、学校、专业、自我介绍、技能和想加入方向。
        </p>
      </section>

      <section className="surface-card rounded-[2rem] p-6">
        <form className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr_0.9fr_auto]">
          <input
            name="query"
            defaultValue={query}
            placeholder="搜索姓名、学校、专业、自我介绍或方向"
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

          <div className="space-y-2">
            <input
              name="skill"
              list="talent-skill-options"
              defaultValue={skill}
              placeholder="筛技能或方向"
              className="field-base"
            />
            <datalist id="talent-skill-options">
              {skillOptions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-4">
            <button
              type="submit"
              className="rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)]"
            >
              应用筛选
            </button>
            <Link href="/talent" className="ui-button-secondary px-5 py-3 text-sm font-semibold">
              清空筛选
            </Link>
            <Link href="/profile" className="ui-link text-sm font-semibold">
              去完善我的个人资料
            </Link>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {skillOptions.map((item) => {
            const nextParams = new URLSearchParams();
            if (query) {
              nextParams.set("query", query);
            }
            if (school) {
              nextParams.set("school", school);
            }
            nextParams.set("skill", item);
            const href = `/talent?${nextParams.toString()}`;

            return (
              <Link
                key={item}
                href={href}
                className={`rounded-full px-3 py-2 text-sm transition ${
                  skill === item
                    ? "bg-[rgba(36,107,250,0.12)] font-semibold text-[var(--primary-strong)]"
                    : "bg-[rgba(17,40,79,0.05)] text-[var(--muted)] hover:bg-[rgba(36,107,250,0.08)] hover:text-[var(--primary-strong)]"
                }`}
              >
                {item}
              </Link>
            );
          })}
        </div>
      </section>

      {hasFilters && studentCount === 0 && mentorCount === 0 ? (
        <section className="surface-panel rounded-[2rem] p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--foreground)]">暂时没有匹配的人才</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">可以换一个关键词、技能标签，或者先清空筛选再看完整人才池。</p>
        </section>
      ) : null}

      <HomeTalentPoolSection
        mentors={talentPool.mentors}
        students={talentPool.students}
        mentorCount={mentorCount}
        studentCount={studentCount}
      />
    </div>
  );
}
