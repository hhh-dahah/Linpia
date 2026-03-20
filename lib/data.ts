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

type ProfileRecord = Record<string, unknown>;
type StudentProfileRecord = Record<string, unknown>;
type MentorProfileRecord = Record<string, unknown>;
type LegacyMentorRecord = Record<string, unknown>;

const demoMentorNames = new Set(["王海峰", "刘明远"]);
const demoCaseTitles = new Set([
  "数学建模校队 7 天冲刺协作样例",
  "跨学科公益项目 Demo",
]);

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

function getMentorOrganization(parts: Array<string | null | undefined>, fallback?: string) {
  const value = parts.filter(Boolean).join(" / ");
  return value || fallback || "";
}

function normalizeLegacyTalent(record: ProfileRecord): TalentDetail {
  const achievements = Array.isArray(record.achievements) ? (record.achievements as string[]) : [];
  const skills = Array.isArray(record.skill_tags) ? (record.skill_tags as string[]) : [];
  const interestedDirections = Array.isArray(record.interested_directions)
    ? (record.interested_directions as string[])
    : [];

  return {
    id: String(record.id),
    name: String(record.name ?? record.nickname ?? ""),
    nickname: String(record.nickname ?? ""),
    school: String(record.school ?? ""),
    major: String(record.major ?? ""),
    grade: String(record.grade ?? ""),
    bio: String(record.bio ?? ""),
    skills,
    interestedDirections,
    timeCommitment: String(record.time_commitment ?? ""),
    avatarPath: (record.avatar_path as string | null) ?? null,
    portfolioCoverPath: (record.portfolio_cover_path as string | null) ?? null,
    portfolioExternalUrl: (record.portfolio_external_url as string | null) ?? null,
    experience: String(record.experience ?? achievements.join(" / ") ?? ""),
    achievements,
    contact: String(record.contact ?? ""),
    contactHint: String(record.contact_hint ?? "登录后可进一步联系。"),
    isDemo: Boolean(record.is_demo),
  };
}

function normalizeStudentProfile(
  profile: ProfileRecord,
  studentProfile?: StudentProfileRecord | null,
): TalentDetail {
  const skills = Array.isArray(studentProfile?.skills)
    ? (studentProfile?.skills as string[])
    : Array.isArray(profile.skill_tags)
      ? (profile.skill_tags as string[])
      : [];
  const interestedDirections = studentProfile?.target_direction
    ? String(studentProfile.target_direction)
        .split(/[、,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : Array.isArray(profile.interested_directions)
      ? (profile.interested_directions as string[])
      : [];

  return {
    id: String(profile.id),
    name: String(profile.nickname ?? profile.name ?? ""),
    nickname: String(profile.nickname ?? ""),
    school: String(studentProfile?.school ?? profile.school ?? ""),
    major: String(studentProfile?.major ?? profile.major ?? ""),
    grade: String(studentProfile?.grade ?? profile.grade ?? ""),
    bio: String(studentProfile?.intro ?? profile.bio ?? ""),
    skills,
    interestedDirections,
    timeCommitment: String(profile.time_commitment ?? ""),
    avatarPath: (profile.avatar_path as string | null) ?? null,
    portfolioCoverPath: (profile.portfolio_cover_path as string | null) ?? null,
    portfolioExternalUrl: (studentProfile?.portfolio as string | null) ?? (profile.portfolio_external_url as string | null) ?? null,
    experience: String(profile.experience ?? ""),
    achievements: Array.isArray(profile.achievements) ? (profile.achievements as string[]) : [],
    contact: String(studentProfile?.contact ?? profile.contact ?? ""),
    contactHint: String(profile.contact_hint ?? "登录后可进一步联系。"),
    isDemo: Boolean(profile.is_demo),
  };
}

function parseLegacyMentorContact(contactMode?: string | null) {
  const raw = contactMode || "";
  const lines = raw
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    contact: lines.find((item) => item.startsWith("联系方式："))?.replace("联系方式：", "") || raw,
    applicationNotes:
      lines.find((item) => item.startsWith("申请说明："))?.replace("申请说明：", "") || "",
  };
}

function normalizeLegacyMentor(record: LegacyMentorRecord): MentorCard {
  const bundle = parseLegacyMentorContact(String(record.contact_mode ?? ""));
  return {
    id: String(record.user_id ?? record.id),
    name: String(record.name ?? ""),
    organization: String(record.organization ?? ""),
    direction: String(record.direction ?? ""),
    directionTags: Array.isArray(record.direction_tags) ? (record.direction_tags as string[]) : [],
    supportScope: Array.isArray(record.support_scope) ? (record.support_scope as string[]) : [],
    avatarPath: (record.avatar_path as string | null) ?? null,
    contactMode: bundle.contact,
    isOpen: Boolean(record.is_open),
    school: String(record.school ?? ""),
    college: String(record.college ?? ""),
    lab: String(record.lab ?? ""),
    supportMethod: String(record.support_method ?? ""),
    applicationNotes: bundle.applicationNotes || String(record.application_notes ?? ""),
    isDemo: Boolean(record.is_demo) || demoMentorNames.has(String(record.name ?? "")),
  };
}

function normalizeMentorProfile(
  profile: ProfileRecord,
  mentorProfile?: MentorProfileRecord | null,
  legacyMentor?: LegacyMentorRecord | null,
): MentorCard {
  const legacy = legacyMentor ? normalizeLegacyMentor(legacyMentor) : null;
  const school = String(mentorProfile?.school ?? legacy?.school ?? "");
  const college = String(mentorProfile?.college ?? legacy?.college ?? "");
  const lab = String(mentorProfile?.lab ?? legacy?.lab ?? "");

  return {
    id: String(profile.id),
    name: String(profile.nickname ?? legacy?.name ?? ""),
    organization: getMentorOrganization([school, college, lab], legacy?.organization),
    direction: String(mentorProfile?.research_direction ?? legacy?.direction ?? mentorProfile?.intro ?? ""),
    directionTags: legacy?.directionTags ?? [],
    supportScope: Array.isArray(mentorProfile?.support_types)
      ? (mentorProfile?.support_types as string[])
      : (legacy?.supportScope ?? []),
    avatarPath: (profile.avatar_path as string | null) ?? legacy?.avatarPath ?? null,
    contactMode: String(mentorProfile?.contact ?? legacy?.contactMode ?? ""),
    isOpen: Boolean(mentorProfile?.open_status ?? legacy?.isOpen ?? true),
    school,
    college,
    lab,
    supportMethod: String(mentorProfile?.support_method ?? legacy?.supportMethod ?? ""),
    applicationNotes: String(mentorProfile?.application_notes ?? legacy?.applicationNotes ?? ""),
    isDemo: Boolean(profile.is_demo) || demoMentorNames.has(String(profile.nickname ?? legacy?.name ?? "")),
  };
}

function normalizeOpportunity(record: Record<string, unknown>, roleGaps: OpportunityDetail["roleGaps"]) {
  const tags = [
    ...(Array.isArray(record.preset_tags) ? (record.preset_tags as string[]) : []),
    ...(Array.isArray(record.custom_tags) ? (record.custom_tags as string[]) : []),
  ];
  const displayTags =
    tags.length > 0
      ? tags
      : Array.isArray(record.skill_tags)
        ? (record.skill_tags as string[])
        : [];

  const supplementaryItems = Array.isArray(record.deliverables)
    ? (record.deliverables as string[])
    : [];

  const creatorRole = (record.creator_role === "mentor" ? "mentor" : "student") as AccountRole;

  return {
    id: String(record.id),
    type: record.type as OpportunityDetail["type"],
    title: String(record.title ?? ""),
    summary: String(record.summary ?? ""),
    organization: String(record.organization ?? record.school_scope ?? record.creator_org_name ?? ""),
    deadline: String(record.deadline ?? new Date().toISOString()),
    tags: displayTags,
    status:
      isBeforeToday(String(record.deadline ?? ""))
        ? "已截止"
        : ((record.status as OpportunityDetail["status"]) ?? "开放申请"),
    weeklyHours: String(record.weekly_hours ?? "每周 6-10 小时"),
    applicantCount: Number(record.applicant_count ?? 0),
    creatorId: String(record.creator_id ?? ""),
    creatorName: String(record.creator_name ?? "邻派用户"),
    creatorRole,
    creatorRoleLabel: creatorRole === "mentor" ? "导师" : "学生队长",
    creatorOrganization: String(record.creator_org_name ?? record.organization ?? ""),
    coverPath: (record.cover_path as string | null) ?? null,
    feishuUrl: (record.feishu_url as string | null) ?? null,
    createdAt: String(record.created_at ?? ""),
    roleSummary: roleGaps.map((item) => item.roleName),
    isDemo: Boolean(record.is_demo) || String(record.title ?? "").includes("Demo"),
    progress: String(record.progress ?? ""),
    trialTask: String(record.trial_task ?? ""),
    supplementaryItems:
      supplementaryItems.length > 0
        ? supplementaryItems
        : [
            record.project_name ? `项目 / 比赛名称：${String(record.project_name)}` : "",
            record.people_needed ? `需要什么人：${String(record.people_needed)}` : "",
            record.research_direction ? `研究 / 指导方向：${String(record.research_direction)}` : "",
            record.target_audience ? `面向对象：${String(record.target_audience)}` : "",
            record.support_method ? `支持方式：${String(record.support_method)}` : "",
            record.contact_info ? `联系说明：${String(record.contact_info)}` : "",
          ].filter(Boolean),
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

function filterMentors(items: MentorCard[], filters: ListFilters) {
  return items.filter((item) => {
    const schoolMatch = filters.school ? item.school === filters.school : true;
    const skillMatch = filters.skill
      ? item.directionTags.includes(filters.skill) || item.supportScope.includes(filters.skill)
      : true;
    const queryMatch = matchKeyword(
      [
        item.name,
        item.organization,
        item.direction,
        item.school,
        item.college,
        item.lab,
        item.directionTags.join(" "),
        item.supportScope.join(" "),
      ],
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
    const { data: roles } = await supabase.from("opportunity_roles").select("*").in("opportunity_id", opportunityIds);

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

    const normalized = data.map((item) =>
      normalizeOpportunity(item as Record<string, unknown>, roleMap.get(String(item.id)) ?? []),
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
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("updated_at", { ascending: false });

    if (error || !profiles) {
      throw error;
    }

    const userIds = profiles.map((item) => String(item.id));
    const { data: studentProfiles } = userIds.length
      ? await supabase.from("student_profiles").select("*").in("user_id", userIds)
      : { data: [] };

    const profileMap = new Map(
      (studentProfiles ?? []).map((item) => [String((item as StudentProfileRecord).user_id), item as StudentProfileRecord]),
    );

    const normalized = profiles.map((item) =>
      normalizeStudentProfile(item as ProfileRecord, profileMap.get(String(item.id)) ?? null),
    );

    return filterTalents(normalized, filters);
  } catch {
    try {
      const supabase = await getReadClient();
      const { data, error } = await supabase.from("profiles").select("*").order("updated_at", {
        ascending: false,
      });

      if (error || !data) {
        return filterTalents(mockTalents, filters);
      }

      const normalized = data.map((item) => normalizeLegacyTalent(item as ProfileRecord));
      return filterTalents(normalized, filters);
    } catch {
      return filterTalents(mockTalents, filters);
    }
  }
}

export async function getTalentById(id: string) {
  const talents = await listTalents();
  return talents.find((item) => item.id === id) ?? null;
}

export async function listMentors(filters: ListFilters = {}) {
  if (!hasSupabaseEnv()) {
    return filterMentors(mockMentors, filters);
  }

  try {
    const supabase = await getReadClient();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "mentor")
      .order("updated_at", { ascending: false });

    if (error || !profiles) {
      throw error;
    }

    const userIds = profiles.map((item) => String(item.id));
    const [{ data: mentorProfiles }, { data: legacyMentors }] = await Promise.all([
      userIds.length ? supabase.from("mentor_profiles").select("*").in("user_id", userIds) : Promise.resolve({ data: [] }),
      userIds.length ? supabase.from("mentors").select("*") : Promise.resolve({ data: [] }),
    ]);

    const mentorProfileMap = new Map(
      (mentorProfiles ?? []).map((item) => [String((item as MentorProfileRecord).user_id), item as MentorProfileRecord]),
    );
    const legacyMentorMap = new Map(
      (legacyMentors ?? []).map((item) => [
        String((item as LegacyMentorRecord).user_id ?? (item as LegacyMentorRecord).id),
        item as LegacyMentorRecord,
      ]),
    );

    const normalized = profiles.map((item) =>
      normalizeMentorProfile(
        item as ProfileRecord,
        mentorProfileMap.get(String(item.id)) ?? null,
        legacyMentorMap.get(String(item.id)) ?? null,
      ),
    );

    return filterMentors(normalized, filters);
  } catch {
    try {
      const supabase = await getReadClient();
      const { data, error } = await supabase.from("mentors").select("*").order("created_at", {
        ascending: false,
      });

      if (error || !data) {
        return filterMentors(mockMentors, filters);
      }

      const normalized = data.map((item) => normalizeLegacyMentor(item as LegacyMentorRecord));
      return filterMentors(normalized, filters);
    } catch {
      return filterMentors(mockMentors, filters);
    }
  }
}

export async function getMentorById(id: string) {
  const mentors = await listMentors();
  return mentors.find((item) => item.id === id) ?? null;
}

export async function listTalentPool(filters: ListFilters = {}) {
  const [students, mentors] = await Promise.all([listTalents(filters), listMentors(filters)]);

  return { students, mentors };
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
      isDemo: Boolean(item.is_demo) || demoCaseTitles.has(String(item.title ?? "")),
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
    const [{ data: profile }, { data: studentProfile }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (!profile) {
      return null;
    }

    return normalizeStudentProfile(profile as ProfileRecord, (studentProfile as StudentProfileRecord | null) ?? null);
  } catch {
    try {
      const supabase = await getReadClient();
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      return data ? normalizeLegacyTalent(data as ProfileRecord) : null;
    } catch {
      return null;
    }
  }
}

export async function getMentorProfileByUserId(userId: string) {
  if (!hasSupabaseEnv()) {
    return mockMentors[0];
  }

  try {
    const supabase = await getReadClient();
    const [{ data: profile }, { data: mentorProfile }, { data: legacyMentor }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("mentor_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("mentors").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (!profile) {
      return null;
    }

    return normalizeMentorProfile(
      profile as ProfileRecord,
      (mentorProfile as MentorProfileRecord | null) ?? null,
      (legacyMentor as LegacyMentorRecord | null) ?? null,
    );
  } catch {
    try {
      const supabase = await getReadClient();
      let result = await supabase.from("mentors").select("*").eq("user_id", userId).maybeSingle();

      if (result.error) {
        result = await supabase.from("mentors").select("*").eq("id", userId).maybeSingle();
      }

      return result.data ? normalizeLegacyMentor(result.data as LegacyMentorRecord) : null;
    } catch {
      return null;
    }
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
      summary: profile.bio || "先把基础资料挂出来，后面再慢慢补作品和项目经历。",
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
    summary: mentor.direction || "先把研究方向和支持方式挂出来，后面再继续补充。",
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
    const [applications, opportunities, profile] = await Promise.all([
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
      role === "mentor" ? getMentorProfileByUserId(userId) : getStudentProfileByUserId(userId),
    ]);

    const detailedOpportunities = await listOpportunities();
    const ownOpportunityMap = new Map(detailedOpportunities.map((item) => [item.id, item]));

    return {
      profile,
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
