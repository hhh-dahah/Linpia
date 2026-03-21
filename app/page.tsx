import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, PencilRuler, Search } from "lucide-react";

import { OpportunityCard } from "@/components/cards/opportunity-card";
import { HomeTalentPoolSection } from "@/components/home/home-talent-pool-section";
import { PageHeading } from "@/components/ui/page-heading";
import { listOpportunities, listTalentPool } from "@/lib/data";

const heroActions = [
  {
    title: "我要找队伍",
    description:
      "看比赛组队、项目招募、导师带队和短期合作，在一个招募池里更快找到适合自己的入口。",
    href: "/opportunities",
    cta: "去找队伍",
    icon: Search,
    tone:
      "bg-[linear-gradient(135deg,_rgba(51,112,255,0.12),_rgba(116,194,255,0.18))] text-[var(--primary-strong)]",
  },
  {
    title: "我要发招募",
    description:
      "学生队长、项目发起人和导师都从这里发招募，不再拆成多个入口，减少理解成本。",
    href: "/publish",
    cta: "去发布招募",
    icon: BriefcaseBusiness,
    tone:
      "bg-[linear-gradient(135deg,_rgba(255,159,74,0.14),_rgba(255,214,164,0.22))] text-[#b96522]",
  },
  {
    title: "我要展示技能",
    description:
      "先挂出你的基础信息、方向和能力卡，让别人更快知道你适合加入什么合作。",
    href: "/profile",
    cta: "去展示技能",
    icon: PencilRuler,
    tone:
      "bg-[linear-gradient(135deg,_rgba(24,163,111,0.12),_rgba(143,223,194,0.2))] text-[var(--success)]",
  },
] as const;

export default async function HomePage() {
  const [opportunities, homeTalentPool] = await Promise.all([
    listOpportunities(),
    listTalentPool(),
  ]);

  return (
    <div className="space-y-8 sm:space-y-16">
      <section className="surface-card rounded-[2rem] px-5 py-4 sm:px-8 sm:py-7 lg:px-10 lg:py-8">
        <div className="flex justify-end">
          <div className="chip">邻派 Linpai</div>
        </div>

        <div className="mt-3 max-w-4xl">
          <h1 className="font-display text-[2.4rem] font-bold leading-[1.02] tracking-[-0.05em] text-[var(--foreground)] sm:text-[3.4rem] lg:text-[4.4rem]">
            校园合作平台
            <br className="hidden sm:block" />
            让合作更快开始
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)] sm:text-[1.06rem]">
            无论你是想加入队伍，还是想发起招募，这里都能帮你更高效地连接。
          </p>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {heroActions.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group surface-panel rounded-[1.6rem] px-4 py-4 hover:-translate-y-1 sm:px-6 sm:py-6"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
                      {item.title}
                    </h2>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--primary)] transition duration-200 group-hover:translate-x-1" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                  <div className="mt-3 text-sm font-semibold text-[var(--primary)]">{item.cta}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <PageHeading eyebrow="找队伍" title="统一查看所有正在开放的招募" />
          <Link href="/opportunities" className="ui-link hidden text-sm font-semibold sm:block">
            查看全部招募
          </Link>
        </div>
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
          {opportunities.slice(0, 3).map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <HomeTalentPoolSection
        mentors={homeTalentPool.mentors}
        students={homeTalentPool.students}
      />
    </div>
  );
}
