import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/ui/page-heading";
import { getTalentById } from "@/lib/data";

type TalentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TalentDetailPage({ params }: TalentDetailPageProps) {
  const { id } = await params;
  const talent = await getTalentById(id);

  if (!talent) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeading eyebrow="人才详情" title={talent.name} description={`${talent.school} · ${talent.major} · ${talent.grade}`} />
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="surface-card rounded-[2rem] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">完整人才卡</h2>
            <p className="mt-4 text-sm leading-8 text-[var(--muted)]">{talent.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {talent.skills.map((skill) => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-[var(--muted)]">可投入时间</p>
                <p className="mt-2 font-semibold">{talent.timeCommitment}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm text-[var(--muted)]">想参与方向</p>
                <p className="mt-2 font-semibold">{talent.interestedDirections.join(" / ")}</p>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">作品与证明</h2>
            <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
              {talent.achievements.map((item) => (
                <li key={item} className="rounded-2xl bg-[rgba(17,40,79,0.04)] px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
            {talent.portfolioExternalUrl ? (
              <div className="mt-5">
                <Link href={talent.portfolioExternalUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-strong)]">
                  查看外链证明
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="surface-panel rounded-[2rem] p-6">
          <h2 className="text-xl font-bold text-[var(--foreground)]">协作建议</h2>
          <p className="mt-4 text-sm leading-8 text-[var(--muted)]">{talent.contactHint}</p>
          <p className="mt-4 text-sm leading-8 text-[var(--muted)]">
            首版不做站内聊天，建议项目方查看完整机会详情后，再通过报名与试合作流程建立联系。
          </p>
          <div className="mt-6">
            <Link href="/opportunities" className="inline-flex rounded-full border border-[rgba(17,40,79,0.12)] px-5 py-3 font-semibold text-[var(--foreground)] transition hover:border-[rgba(36,107,250,0.28)] hover:text-[var(--primary)]">
              去匹配相关机会
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
