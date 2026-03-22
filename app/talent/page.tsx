import { HomeTalentPoolSection } from "@/components/home/home-talent-pool-section";
import { listTalentPool } from "@/lib/data";

const TALENT_PAGE_FETCH_LIMIT = 100;

export default async function TalentPage() {
  const talentPool = await listTalentPool({}, {
    mentorLimit: TALENT_PAGE_FETCH_LIMIT,
    studentLimit: TALENT_PAGE_FETCH_LIMIT,
  });

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">人才池</span>
        </div>
        <h1 className="mt-4 font-display text-[2.4rem] font-bold leading-[1.04] tracking-[-0.04em] text-[var(--foreground)] sm:text-[3.4rem]">
          在一个页面里看全平台的人才与导师
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
          这里会汇总平台里已经完善资料的学生和导师。你可以直接浏览、筛选，再决定联系谁或者加入哪个方向。
        </p>
      </section>

      <HomeTalentPoolSection
        mentors={talentPool.mentors}
        students={talentPool.students}
        mentorCount={talentPool.mentorCount}
        studentCount={talentPool.studentCount}
      />
    </div>
  );
}
