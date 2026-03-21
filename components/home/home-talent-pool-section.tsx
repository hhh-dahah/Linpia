import Link from "next/link";

import { MentorCard } from "@/components/cards/mentor-card";
import { TalentCard } from "@/components/cards/talent-card";
import { PageHeading } from "@/components/ui/page-heading";
import type { MentorCard as MentorCardType } from "@/types/mentor";
import type { TalentDetail } from "@/types/profile";

type HomeTalentPoolSectionProps = {
  mentors: MentorCardType[];
  students: TalentDetail[];
};

export function HomeTalentPoolSection({
  mentors,
  students,
}: HomeTalentPoolSectionProps) {
  return (
    <section id="talent-pool" className="space-y-8 scroll-mt-28">
      <div className="flex items-end justify-between gap-4">
        <PageHeading
          eyebrow="找人才"
          title="先看导师，再看正在展示技能的学生"
          description="首页就能直接浏览平台里的导师资料和学生能力卡，先看人，再决定要不要进一步联系或合作。"
        />
        <Link href="/profile" className="ui-link hidden text-sm font-semibold sm:block">
          去完善资料并展示技能
        </Link>
      </div>

      <div id="mentor-section" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <PageHeading
            eyebrow="导师"
            title="愿意提供方向、资源或带队支持的导师"
            description="优先展示导师的研究方向、可支持内容和开放状态，方便你快速判断是否适合联系。"
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
            <h2 className="text-xl font-bold text-[var(--foreground)]">当前还没有可展示的导师资料</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              导师入驻后会出现在这里，也可以先完善自己的资料，方便后续展示技能。
            </p>
          </div>
        )}
      </div>

      <div id="student-section" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <PageHeading
            eyebrow="学生"
            title="正在展示技能、找方向或准备加入队伍的学生"
            description="学生能力卡会突出学校、技能标签、想加入的方向和可投入时间，方便发起方快速判断。"
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
            <h2 className="text-xl font-bold text-[var(--foreground)]">当前还没有可展示的学生资料</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              先完善个人资料后，你的技能展示也会出现在这里。
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
