"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { MentorCard } from "@/components/cards/mentor-card";
import { TalentCard } from "@/components/cards/talent-card";
import type { MentorCard as MentorCardType } from "@/types/mentor";
import type { TalentDetail } from "@/types/profile";

type HomeTalentPoolSectionProps = {
  mentors: MentorCardType[];
  students: TalentDetail[];
  mentorCount: number;
  studentCount: number;
  previewCount?: number;
};

const headingClassName =
  "font-display text-[2.5rem] font-bold leading-[1.12] tracking-[-0.03em] text-[var(--foreground)] sm:text-[3.35rem]";

function ToggleButton({
  expanded,
  hiddenCount,
  subject,
  onClick,
}: {
  expanded: boolean;
  hiddenCount: number;
  subject: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ui-button-secondary px-4 py-2 text-sm font-semibold"
      aria-expanded={expanded}
    >
      {expanded ? `收起${subject}` : `查看更多${subject}${hiddenCount > 0 ? `（还有 ${hiddenCount} 位）` : ""}`}
    </button>
  );
}

export function HomeTalentPoolSection({
  mentors,
  students,
  mentorCount,
  studentCount,
  previewCount,
}: HomeTalentPoolSectionProps) {
  const [mentorsExpanded, setMentorsExpanded] = useState(false);
  const [studentsExpanded, setStudentsExpanded] = useState(false);

  const visibleMentors = useMemo(() => {
    if (!previewCount || mentorsExpanded) {
      return mentors;
    }

    return mentors.slice(0, previewCount);
  }, [mentors, mentorsExpanded, previewCount]);

  const visibleStudents = useMemo(() => {
    if (!previewCount || studentsExpanded) {
      return students;
    }

    return students.slice(0, previewCount);
  }, [students, studentsExpanded, previewCount]);

  const hiddenMentorCount = Math.max(mentorCount - visibleMentors.length, 0);
  const hiddenStudentCount = Math.max(studentCount - visibleStudents.length, 0);
  const shouldShowMentorToggle = Boolean(previewCount && mentors.length > previewCount);
  const shouldShowStudentToggle = Boolean(previewCount && students.length > previewCount);

  return (
    <section id="talent-pool" className="space-y-5 scroll-mt-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            人才池
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {previewCount ? (
            <Link href="/talent" className="ui-link text-[0.88rem] font-semibold">
              进入完整人才池
            </Link>
          ) : null}
          <Link href="/profile" className="ui-link text-[0.88rem] font-semibold">
            去完善资料并展示技能
          </Link>
        </div>
      </div>

      <div id="mentor-section" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center rounded-full bg-[rgba(255,159,74,0.08)] px-3 py-1.5 text-[0.88rem] font-semibold text-[#c26e25]">
              导师
            </div>
            <p className={headingClassName}>愿意提供方向、资源或带队支持的导师</p>
          </div>

          <span className="rounded-full bg-[rgba(255,159,74,0.12)] px-3 py-1 text-[0.84rem] font-semibold text-[#c26e25]">
            共 {mentorCount} 位
          </span>
        </div>

        {mentors.length ? (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              {visibleMentors.map((item) => (
                <MentorCard key={item.id} item={item} />
              ))}
            </div>

            {shouldShowMentorToggle ? (
              <div className="flex justify-center">
                <ToggleButton
                  expanded={mentorsExpanded}
                  hiddenCount={hiddenMentorCount}
                  subject="导师"
                  onClick={() => setMentorsExpanded((value) => !value)}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className="surface-panel rounded-[2rem] p-8 text-center">
            <h2 className="text-[1.75rem] font-bold text-[var(--foreground)]">当前还没有可展示的导师资料</h2>
            <p className="mt-2 text-[0.95rem] text-[var(--muted)]">导师入驻后会出现在这里。</p>
          </div>
        )}
      </div>

      <div id="student-section" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center rounded-full bg-[rgba(36,107,250,0.08)] px-3 py-1.5 text-[0.88rem] font-semibold text-[var(--primary)]">
              学生
            </div>
            <p className={headingClassName}>正在展示技能、找方向或准备加入队伍的学生</p>
          </div>

          <span className="rounded-full bg-[rgba(36,107,250,0.08)] px-3 py-1 text-[0.84rem] font-semibold text-[var(--primary)]">
            共 {studentCount} 人
          </span>
        </div>

        {students.length ? (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              {visibleStudents.map((item) => (
                <TalentCard key={item.id} item={item} />
              ))}
            </div>

            {shouldShowStudentToggle ? (
              <div className="flex justify-center">
                <ToggleButton
                  expanded={studentsExpanded}
                  hiddenCount={hiddenStudentCount}
                  subject="学生"
                  onClick={() => setStudentsExpanded((value) => !value)}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className="surface-panel rounded-[2rem] p-8 text-center">
            <h2 className="text-[1.75rem] font-bold text-[var(--foreground)]">当前还没有可展示的学生资料</h2>
            <p className="mt-2 text-[0.95rem] text-[var(--muted)]">
              先完善个人资料后，你的技能展示也会出现在这里。
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
