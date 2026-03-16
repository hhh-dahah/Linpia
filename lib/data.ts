import { mockCases, mockDashboardApplications, mockMentors, mockOpportunities, mockTalents } from "@/mock/seed";
import type { DashboardApplication } from "@/types/application";
import type { CaseCard } from "@/types/case";
import type { MentorCard } from "@/types/mentor";
import type { OpportunityDetail } from "@/types/opportunity";
import type { TalentDetail } from "@/types/profile";
import { createServerSupabaseClient } from "@/supabase/server";

import { hasSupabaseEnv } from "./env";
import { isBeforeToday } from "./utils";

type ListFilters = {
  query?: string;
  type?: string;
  school?: string;
  skill?: string;
};

function matchKeyword(parts: Array<string | undefined>, keyword?: string) {
  if (!keyword) {
    return true;
  }

  const normalized = keyword.trim().toLowerCase();
  return parts
    .filter(Boolean)
    .some((part) => (part as string).toLowerCase().includes(normalized));
}

function filterOpportunities(items: OpportunityDetail[], filters: ListFilters) {
  return items.filter((item) => {
    const typeMatch = filters.type ? item.type === filters.type : true;
    const schoolMatch = filters.school ? item.schoolScope === filters.school : true;
    const skillMatch = filters.skill ? item.skills.includes(filters.skill) : true;
    const queryMatch = matchKeyword(
      [item.title, item.summary, item.creatorName, item.skills.join(" ")],
      filters.query,
    );

    return typeMatch && schoolMatch && skillMatch && queryMatch;
  });
}

function filterTalents(items: TalentDetail[], filters: ListFilters) {
  return items.filter((item) => {
    const schoolMatch = filters.school ? item.school === filters.school : true;
    const skillMatch = filters.skill ? item.skills.includes(filters.skill) : true;
    const queryMatch = matchKeyword(
      [item.name, item.major, item.bio, item.skills.join(" ")],
      filters.query,
    );

    return schoolMatch && skillMatch && queryMatch;
  });
}

function normalizeOpportunity(record: Record<string, unknown>): OpportunityDetail {
  return {
    id: String(record.id),
    type: record.type as OpportunityDetail["type"],
    title: String(record.title ?? ""),
    summary: String(record.summary ?? ""),
    schoolScope: String(record.school_scope ?? ""),
    deadline: String(record.deadline ?? new Date().toISOString()),
    skills: Array.isArray(record.skill_tags) ? (record.skill_tags as string[]) : [],
    status:
      isBeforeToday(String(record.deadline ?? ""))
        ? "已截止"
        : ((record.status as OpportunityDetail["status"]) ?? "开放报名"),
    weeklyHours: String(record.weekly_hours ?? "每周 6-10 小时"),
    applicantCount: Number(record.applicant_count ?? 0),
    creatorName: String(record.creator_name ?? "项目发起人"),
    coverPath: (record.cover_path as string | null) ?? null,
    feishuUrl: (record.feishu_url as string | null) ?? null,
    createdAt: String(record.created_at ?? ""),
    progress: String(record.progress ?? "待补充"),
    trialTask: String(record.trial_task ?? "待补充"),
    deliverables: Array.isArray(record.deliverables) ? (record.deliverables as string[]) : [],
    roleGaps: [],
  };
}

function normalizeTalent(record: Record<string, unknown>): TalentDetail {
  return {
    id: String(record.id),
    name: String(record.name ?? ""),
    school: String(record.school ?? ""),
    major: String(record.major ?? ""),
    grade: String(record.grade ?? ""),
    bio: String(record.bio ?? ""),
    skills: Array.isArray(record.skill_tags) ? (record.skill_tags as string[]) : [],
    interestedDirections: Array.isArray(record.interested_directions)
      ? (record.interested_directions as string[])
      : [],
    timeCommitment: String(record.time_commitment ?? ""),
    avatarPath: (record.avatar_path as string | null) ?? null,
    portfolioCoverPath: (record.portfolio_cover_path as string | null) ?? null,
    portfolioExternalUrl: (record.portfolio_external_url as string | null) ?? null,
    achievements: Array.isArray(record.achievements) ? (record.achievements as string[]) : [],
    contactHint: String(record.contact_hint ?? "登录后可发起联系。"),
  };
}

export async function listOpportunities(filters: ListFilters = {}) {
  if (!hasSupabaseEnv()) {
    return filterOpportunities(mockOpportunities, filters);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("opportunities").select("*").order("created_at", {
      ascending: false,
    });

    if (error || !data) {
      return filterOpportunities(mockOpportunities, filters);
    }

    const { data: roles } = await supabase.from("opportunity_roles").select("*");
    const roleMap = new Map<string, OpportunityDetail["roleGaps"]>();

    roles?.forEach((role) => {
      const current = roleMap.get(String(role.opportunity_id)) ?? [];
      current.push({
        id: String(role.id),
        roleName: String(role.role_name),
        responsibility: String(role.responsibility),
        requirements: String(role.requirements),
        headcount: Number(role.headcount),
        weeklyHours: String(role.weekly_hours),
      });
      roleMap.set(String(role.opportunity_id), current);
    });

    const normalized = data.map((item) => ({
      ...normalizeOpportunity(item as Record<string, unknown>),
      roleGaps: roleMap.get(String(item.id)) ?? [],
    }));

    return filterOpportunities(normalized, filters);
  } catch {
    return filterOpportunities(mockOpportunities, filters);
  }
}

export async function getOpportunityById(id: string) {
  const opportunities = await listOpportunities();
  return opportunities.find((item) => item.id === id) ?? null;
}

export async function listTalents(filters: ListFilters = {}) {
  if (!hasSupabaseEnv()) {
    return filterTalents(mockTalents, filters);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("profiles").select("*").order("updated_at", {
      ascending: false,
    });

    if (error || !data) {
      return filterTalents(mockTalents, filters);
    }

    const normalized = data.map((item) => normalizeTalent(item as Record<string, unknown>));
    return filterTalents(normalized, filters);
  } catch {
    return filterTalents(mockTalents, filters);
  }
}

export async function getTalentById(id: string) {
  const talents = await listTalents();
  return talents.find((item) => item.id === id) ?? null;
}

export async function listMentors() {
  if (!hasSupabaseEnv()) {
    return mockMentors;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("mentors").select("*").order("created_at", {
      ascending: false,
    });

    if (error || !data) {
      return mockMentors;
    }

    return data.map((item) => ({
      id: String(item.id),
      name: String(item.name),
      organization: String(item.organization),
      direction: String(item.direction),
      directionTags: Array.isArray(item.direction_tags) ? (item.direction_tags as string[]) : [],
      supportScope: Array.isArray(item.support_scope) ? (item.support_scope as string[]) : [],
      avatarPath: (item.avatar_path as string | null) ?? null,
      contactMode: String(item.contact_mode),
      isOpen: Boolean(item.is_open),
    })) satisfies MentorCard[];
  } catch {
    return mockMentors;
  }
}

export async function listCases() {
  if (!hasSupabaseEnv()) {
    return mockCases;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("cases").select("*").order("created_at", {
      ascending: false,
    });

    if (error || !data) {
      return mockCases;
    }

    return data.map((item) => ({
      id: String(item.id),
      title: String(item.title),
      summary: String(item.summary),
      resultTags: Array.isArray(item.result_tags) ? (item.result_tags as string[]) : [],
      coverPath: (item.cover_path as string | null) ?? null,
      relatedOpportunityId: (item.related_opportunity_id as string | null) ?? null,
    })) satisfies CaseCard[];
  } catch {
    return mockCases;
  }
}

export async function getDashboardSnapshot(userId?: string | null) {
  if (!userId || !hasSupabaseEnv()) {
    return {
      profile: mockTalents[0],
      applications: mockDashboardApplications,
      opportunities: mockOpportunities.slice(0, 2),
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    const { data: applications } = await supabase
      .from("applications")
      .select("id, status, created_at, opportunity_title")
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false });
    const { data: opportunities } = await supabase
      .from("opportunities")
      .select("*")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });

    return {
      profile: profile ? normalizeTalent(profile as Record<string, unknown>) : null,
      applications:
        applications?.map((item) => ({
          id: String(item.id),
          opportunityTitle: String(item.opportunity_title ?? "未命名机会"),
          status: item.status as DashboardApplication["status"],
          submittedAt: String(item.created_at ?? ""),
        })) ?? [],
      opportunities:
        opportunities?.map((item) => normalizeOpportunity(item as Record<string, unknown>)) ?? [],
    };
  } catch {
    return {
      profile: mockTalents[0],
      applications: mockDashboardApplications,
      opportunities: mockOpportunities.slice(0, 2),
    };
  }
}
