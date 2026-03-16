import {
  mockCases,
  mockDashboardApplications,
  mockMentors,
  mockOpportunities,
  mockTalents,
} from "@/mock/seed";
import type { DashboardApplication } from "@/types/application";
import type { AccountRole } from "@/types/account";
import type { CaseCard } from "@/types/case";
import type { MentorCard } from "@/types/mentor";
import type { OpportunityDetail } from "@/types/opportunity";
import type { PersonalShowcase, TalentDetail } from "@/types/profile";
import { createAdminSupabaseClient } from "@/supabase/admin";
import { createServerSupabaseClient } from "@/supabase/server";

import { hasServiceRoleEnv, hasSupabaseEnv } from "./env";
import { isBeforeToday } from "./utils";

type ListFilters = {
  query?: string;
  type?: string;
  school?: string;
  skill?: string;
};

type ProfileRecord = Record<string, unknown> | null;
type MentorRecord = Record<string, unknown> | null;

function matchKeyword(parts: Array<string | undefined>, keyword?: string) {
  if (!keyword) {
    return true;
  }

  const normalized = keyword.trim().toLowerCase();
  return parts
    .filter(Boolean)
    .some((part) => (part as string).toLowerCase().includes(normalized));
}

async function getReadClient() {
  if (hasServiceRoleEnv()) {
    return createAdminSupabaseClient();
  }

  return createServerSupabaseClient();
}

function parseMentorContactBundle(contactMode: string) {
  const lines = contactMode
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const school = lines.find((item) => item.startsWith("学校："))?.replace("学校：", "") ?? "";
  const college = lines.find((item) => item.startsWith("学院："))?.replace("学院：", "") ?? "";
  const lab = lines.find((item) => item.startsWith("实验室："))?.replace("实验室：", "") ?? "";
  const supportMethod = lines.find((item) => item.startsWith("支持方式："))?.replace("支持方式：", "") ?? "";
  const contact = lines.find((item) => item.startsWith("联系方式："))?.replace("联系方式：", "") ?? contactMode;
  const applicationNotes =
    lines.find((item) => item.startsWith("申请说明："))?.replace("申请说明：", "") ?? "";

  return { school, college, lab, supportMethod, contact, applicationNotes };
}

function normalizeTalent(record: Record<string, unknown>): TalentDetail {
  const achievements = Array.isArray(record.achievements) ? (record.achievements as string[]) : [];

  return {
    id: String(record.id),
    name: String(record.name ?? ""),
    nickname: String(record.nickname ?? ""),
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
    experience: achievements.join(" / "),
    achievements,
    contact: String(record.contact_hint ?? ""),
    contactHint: String(record.contact_hint ?? "登录后可进一步联系。"),
  };
}

function normalizeMentor(record: Record<string, unknown>): MentorCard {
  const bundle = parseMentorContactBundle(String(record.contact_mode ?? ""));
  return {
    id: String(record.id),
    name: String(record.name ?? ""),
    organization: String(record.organization ?? ""),
    direction: String(record.direction ?? ""),
    directionTags: Array.isArray(record.direction_tags) ? (record.direction_tags as string[]) : [],
    supportScope: Array.isArray(record.support_scope) ? (record.support_scope as string[]) : [],
    avatarPath: (record.avatar_path as string | null) ?? null,
    school: bundle.school,
    college: bundle.college,
    lab: bundle.lab,
    supportMethod: bundle.supportMethod,
    contactMode: bundle.contact,
    applicationNotes: bundle.applicationNotes,
    isOpen: Boolean(record.is_open),
  };
}

function normalizeOpportunity(
  record: Record<string, unknown>,
  profileRecord: ProfileRecord,
  mentorRecord: MentorRecord,
  roleGaps: OpportunityDetail["roleGaps"],
): OpportunityDetail {
  const creatorName =
    mentorRecord?.name ??
    profileRecord?.name ??
    record.creator_name ??
    (mentorRecord ? "导师" : "学生发起人");
  const creatorRole = mentorRecord ? "mentor" : "student";
  const creatorOrganization =
    String(mentorRecord?.organization ?? profileRecord?.school ?? record.school_scope ?? "");
  const supplementaryItems = Array.isArray(record.deliverables)
    ? (record.deliverables as string[])
    : [];

  return {
    id: String(record.id),
    type: record.type as OpportunityDetail["type"],
    title: String(record.title ?? ""),
    summary: String(record.summary ?? ""),
    organization: String(record.school_scope ?? creatorOrganization ?? ""),
    deadline: String(record.deadline ?? new Date().toISOString()),
    tags: Array.isArray(record.skill_tags) ? (record.skill_tags as string[]) : [],
    status:
      isBeforeToday(String(record.deadline ?? ""))
        ? "已截止"
        : ((record.status as OpportunityDetail["status"]) ?? "开放申请"),
    weeklyHours: String(record.weekly_hours ?? "每周 6-10 小时"),
    applicantCount: Number(record.applicant_count ?? 0),
    creatorId: String(record.creator_id ?? ""),
    creatorName: String(creatorName),
    creatorRole,
    creatorRoleLabel: creatorRole === "mentor" ? "导师" : "学生队长",
    creatorOrganization,
    coverPath: (record.cover_path as string | null) ?? null,
    feishuUrl: (record.feishu_url as string | null) ?? null,
    createdAt: String(record.created_at ?? ""),
    progress: String(record.progress ?? ""),
    trialTask: String(record.trial_task ?? ""),
    supplementaryItems,
    roleSummary: roleGaps.map((item) => item.roleName),
    roleGaps,
  };
}

function filterOpportunities(items: OpportunityDetail[], filters: ListFilters) {
  return items.filter((item) => {
    const typeMatch = filters.type ? item.type === filters.type : true;
    const schoolMatch = filters.school ? item.organization.includes(filters.school) : true;
    const skillMatch = filters.skill ? item.tags.includes(filters.skill) : true;
    const queryMatch = matchKeyword(
      [item.title, item.summary, item.creatorName, item.organization, item.tags.join(" ")],
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

export async function listOpportunities(filters: ListFilters = {}) {
  if (!hasSupabaseEnv()) {
    return filterOpportunities(mockOpportunities, filters);
  }

  try {
    const supabase = await getReadClient();
    const { data, error } = await supabase.from("opportunities").select("*").order("created_at", {
      ascending: false,
    });

    if (error || !data) {
      return filterOpportunities(mockOpportunities, filters);
    }

    const opportunityIds = data.map((item) => String(item.id));
    const creatorIds = Array.from(new Set(data.map((item) => String(item.creator_id ?? "")).filter(Boolean)));

    const [{ data: roles }, { data: profiles }, { data: mentors }] = await Promise.all([
      supabase.from("opportunity_roles").select("*").in("opportunity_id", opportunityIds),
      creatorIds.length
        ? supabase.from("profiles").select("id, name, school").in("id", creatorIds)
        : Promise.resolve({ data: [] }),
      creatorIds.length
        ? supabase.from("mentors").select("id, name, organization").in("id", creatorIds)
        : Promise.resolve({ data: [] }),
    ]);

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

    const profileMap = new Map((profiles ?? []).map((item) => [String(item.id), item]));
    const mentorMap = new Map((mentors ?? []).map((item) => [String(item.id), item]));

    const normalized = data.map((item) =>
      normalizeOpportunity(
        item as Record<string, unknown>,
        (profileMap.get(String(item.creator_id)) as ProfileRecord) ?? null,
        (mentorMap.get(String(item.creator_id)) as MentorRecord) ?? null,
        roleMap.get(String(item.id)) ?? [],
      ),
    );

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
    const supabase = await getReadClient();
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
    const supabase = await getReadClient();
    const { data, error } = await supabase.from("mentors").select("*").order("created_at", {
      ascending: false,
    });

    if (error || !data) {
      return mockMentors;
    }

    return data.map((item) => normalizeMentor(item as Record<string, unknown>)) satisfies MentorCard[];
  } catch {
    return mockMentors;
  }
}

export async function listCases() {
  if (!hasSupabaseEnv()) {
    return mockCases;
  }

  try {
    const supabase = await getReadClient();
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

export async function getStudentProfileByUserId(userId: string) {
  if (!hasSupabaseEnv()) {
    return mockTalents[0];
  }

  try {
    const supabase = await getReadClient();
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    return data ? normalizeTalent(data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function getMentorProfileByUserId(userId: string) {
  if (!hasSupabaseEnv()) {
    return mockMentors[0];
  }

  try {
    const supabase = await getReadClient();
    const { data } = await supabase.from("mentors").select("*").eq("id", userId).maybeSingle();
    return data ? normalizeMentor(data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function getPersonalShowcase(userId: string, role: AccountRole): Promise<PersonalShowcase | null> {
  if (role === "student") {
    const profile = await getStudentProfileByUserId(userId);
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      role,
      title: profile.name,
      subtitle: [profile.school, profile.major, profile.grade].filter(Boolean).join(" · "),
      summary: profile.bio || "先把基础资料挂出来，后续再继续补充项目和作品。",
      tags: profile.skills,
      ctaLabel: "编辑学生资料",
      editPath: "/profile/student",
      sections: [
        { label: "想加入的方向", value: profile.interestedDirections.join("、") || "暂未填写" },
        { label: "比赛 / 项目经历", value: profile.experience || "暂未填写" },
        { label: "可投入时间", value: profile.timeCommitment || "暂未填写" },
        { label: "作品链接", value: profile.portfolioExternalUrl || "暂未填写" },
        { label: "联系方式", value: profile.contact || "暂未填写" },
      ],
    };
  }

  const mentor = await getMentorProfileByUserId(userId);
  if (!mentor) {
    return null;
  }

  return {
    id: mentor.id,
    role,
    title: mentor.name,
    subtitle: [mentor.school, mentor.college, mentor.lab].filter(Boolean).join(" · ") || mentor.organization,
    summary: mentor.direction || "先把研究方向和支持方式挂出来，后续再继续补充。",
    tags: mentor.directionTags,
    ctaLabel: "编辑导师资料",
    editPath: "/profile/mentor",
    sections: [
      { label: "学校 / 学院 / 实验室", value: mentor.organization || "暂未填写" },
      { label: "可支持内容", value: mentor.supportScope.join("、") || "暂未填写" },
      { label: "支持方式", value: mentor.supportMethod || "暂未填写" },
      { label: "申请说明", value: mentor.applicationNotes || "暂未填写" },
      { label: "联系方式", value: mentor.contactMode || "暂未填写" },
    ],
  };
}

export async function getDashboardSnapshot(userId?: string | null, role?: AccountRole | null) {
  if (!userId || !hasSupabaseEnv()) {
    return {
      profile: role === "mentor" ? mockMentors[0] : mockTalents[0],
      applications: mockDashboardApplications,
      opportunities: mockOpportunities.slice(0, 2),
    };
  }

  try {
    const supabase = await getReadClient();
    const [profile, applications, opportunities] = await Promise.all([
      role === "mentor"
        ? supabase.from("mentors").select("*").eq("id", userId).maybeSingle()
        : supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("applications")
        .select("id, status, created_at, opportunity_title")
        .eq("applicant_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("opportunities")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const detailedOpportunities = await listOpportunities();
    const ownOpportunityMap = new Map(detailedOpportunities.map((item) => [item.id, item]));

    return {
      profile:
        role === "mentor"
          ? profile.data
            ? normalizeMentor(profile.data as Record<string, unknown>)
            : null
          : profile.data
            ? normalizeTalent(profile.data as Record<string, unknown>)
            : null,
      applications:
        applications.data?.map((item) => ({
          id: String(item.id),
          opportunityTitle: String(item.opportunity_title ?? "未命名招募"),
          status: item.status as DashboardApplication["status"],
          submittedAt: String(item.created_at ?? ""),
        })) ?? [],
      opportunities:
        opportunities.data
          ?.map((item) => ownOpportunityMap.get(String(item.id)))
          .filter((item): item is OpportunityDetail => Boolean(item)) ?? [],
    };
  } catch {
    return {
      profile: role === "mentor" ? mockMentors[0] : mockTalents[0],
      applications: mockDashboardApplications,
      opportunities: mockOpportunities.slice(0, 2),
    };
  }
}
