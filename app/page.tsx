import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, PencilRuler, Search } from "lucide-react";

import { CaseCard } from "@/components/cards/case-card";
import { MentorCard } from "@/components/cards/mentor-card";
import { OpportunityCard } from "@/components/cards/opportunity-card";
import { TalentCard } from "@/components/cards/talent-card";
import { PageHeading } from "@/components/ui/page-heading";
import { listCases, listMentors, listOpportunities, listTalents } from "@/lib/data";

const heroActions = [
  {
    title: "我要找机会",
    description: "看比赛组队、项目招募、导师合作和短期协作，快速找到适合自己的入口。",
    href: "/opportunities",
    cta: "去找机会",
    icon: Search,
    tone:
      "bg-[linear-gradient(135deg,_rgba(51,112,255,0.12),_rgba(116,194,255,0.18))] text-[var(--primary-strong)]",
  },
  {
    title: "我要发布机会",
    description: "给队长、项目发起人、导师使用，把你要找的人和项目需求清楚发出来。",
    href: "/publish",
    cta: "去发布",
    icon: BriefcaseBusiness,
    tone:
      "bg-[linear-gradient(135deg,_rgba(255,159,74,0.14),_rgba(255,214,164,0.22))] text-[#b96522]",
  },
  {
    title: "我要展示技能",
    description: "先把你的基础信息、方向和作品挂出来，让别人更快知道你能做什么。",
    href: "/talent",
    cta: "去展示",
    icon: PencilRuler,
    tone:
      "bg-[linear-gradient(135deg,_rgba(24,163,111,0.12),_rgba(143,223,194,0.2))] text-[var(--success)]",
  },
] as const;

export default async function HomePage() {
  const [opportunities, talents, mentors, cases] = await Promise.all([
    listOpportunities(),
    listTalents(),
    listMentors(),
    listCases(),
  ]);

  return (
    <div className="space-y-14 sm:space-y-16">
      <section className="surface-card rounded-[2rem] px-5 py-5 sm:px-8 sm:py-7 lg:px-10 lg:py-8">
        <div className="flex justify-end">
          <div className="chip">校园协作平台</div>
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

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {heroActions.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group surface-panel rounded-[1.6rem] px-5 py-5 hover:-translate-y-1 sm:px-6 sm:py-6"
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
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
                  <div className="mt-4 text-sm font-semibold text-[var(--primary)]">{item.cta}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <PageHeading
            eyebrow="最近机会"
            title="看看现在有什么机会在开放"
            description="如果你想参与项目、比赛或者找一个能快速开始的合作入口，可以先从这里筛。"
          />
          <Link href="/opportunities" className="ui-link hidden text-sm font-semibold sm:block">
            查看全部机会
          </Link>
        </div>
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
          {opportunities.slice(0, 3).map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <PageHeading
          eyebrow="技能展示"
          title="先看看别人怎么把自己介绍清楚"
          description="项目方通常会从方向、作品和投入时间判断要不要进一步联系。"
        />
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
          {talents.slice(0, 3).map((item) => (
            <TalentCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <PageHeading
            eyebrow="导师"
            title="看看有哪些老师愿意开放支持"
            description="可以先看导师方向、支持方式，以及当前是否开放申请。"
          />
          {mentors.map((item) => (
            <MentorCard key={item.id} item={item} />
          ))}
        </div>

        <div className="space-y-5">
          <PageHeading
            eyebrow="案例"
            title="看看平台里的真实协作结果"
            description="通过案例快速判断这个平台适不适合你，也能知道别人是怎么配队和落地的。"
          />
          {cases.map((item) => (
            <CaseCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
