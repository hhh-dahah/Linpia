import {
  mockCases,
  mockDashboardApplications,
  mockMentors,
  mockOpportunities,
  mockTalents,
} from "@/mock/seed";
import { unstable_cache } from "next/cache";
import type { DashboardApplication, ManagedOpportunityApplication } from "@/types/application";
import type { AccountRole } from "@/types/account";
import type { CaseCard } from "@/types/case";
import type { MentorCard } from "@/types/mentor";
import {
  applicationRequiredItems as applicationRequiredItemValues,
  type OpportunityDetail,
} from "@/types/opportunity";
import type { PersonalShowcase, TalentDetail } from "@/types/profile";
import { createPublicSupabaseClient } from "@/supabase/public";
import { createServerSupabaseClient } from "@/supabase/server";
import { skillOptions } from "@/constants";

import { hasSupabaseEnv } from "./env";
import { isBeforeToday } from "./utils";

type ListFilters = {
  query?: string;
  type?: string;
  school?: string;
  skill?: string;
};

type ListOptions = {
  limit?: number;
};

type TalentPoolOptions = {
  studentLimit?: number;
  mentorLimit?: number;
};

type ProfileRecord = Record<string, unknown>;
type StudentProfileRecord = Record<string, unknown>;
type MentorProfileRecord = Record<string, unknown>;
type LegacyMentorRecord = Record<string, unknown>;
type ReadMode = "public" | "session";
type ApplicationRecord = Record<string, unknown>;

const DEFAULT_OPPORTUNITY_LIMIT = 24;
const DEFAULT_TALENT_LIMIT = 12;
const DEFAULT_MENTOR_LIMIT = 12;
const DASHBOARD_OPPORTUNITY_LIMIT = 10;
const DASHBOARD_APPLICATION_LIMIT = 20;
const TALENT_SEARCH_FETCH_LIMIT = 200;
const presetSkillSet: Set<string> = new Set(skillOptions);

const OPPORTUNITY_SELECT =
  "id, type, title, summary, organization, school_scope, deadline, creator_id, creator_name, creator_role, creator_org_name, contact_info, cover_path, feishu_url, status, weekly_hours, progress, trial_task, skill_tags, preset_tags, custom_tags, deliverables, project_name, research_direction, target_audience, support_method, applicant_count, application_required_items, application_requirement_note, created_at";
const PROFILE_SELECT =
  "id, role, name, nickname, school, major, grade, bio, avatar_path, portfolio_cover_path, portfolio_external_url, time_commitment, skill_tags, interested_directions, achievements, experience, contact, contact_hint, updated_at";
const STUDENT_PROFILE_SELECT =
  "user_id, school, major, grade, skills, custom_skills, intro, portfolio, target_direction, contact";
const MENTOR_PROFILE_SELECT =
  "user_id, school, college, lab, research_direction, support_types, support_method, open_status, intro, contact, application_notes";
const DIRECTORY_PERSON_SELECT =
  "id, auth_user_id, source, role, name, school, major, grade, college, lab, bio, skills, custom_skills, interested_directions, research_direction, support_types, support_method, open_status, contact, avatar_path, portfolio_url, visibility_status, created_at, updated_at";

const demoStudentNames = new Set(["林知夏", "宋一凡"]);
const demoMentorNames = new Set(["王海峰", "刘静", "刘明远"]);
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

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))];
}

function splitTalentSkills(value: unknown, customValue?: unknown) {
  const allSkills = normalizeStringArray(value);
  const customSkills = normalizeStringArray(customValue);
  const combinedSkills = [...new Set([...allSkills, ...customSkills])];

  return {
    skills: combinedSkills.filter((item) => presetSkillSet.has(item)),
    customSkills: combinedSkills.filter((item) => !presetSkillSet.has(item)),
  };
}

function buildTalentSearchDocument(item: TalentDetail) {
  return [
    item.name,
    item.school,
    item.major,
    item.grade,
    item.bio,
    item.skills.join(" "),
    (item.customSkills ?? []).join(" "),
    item.interestedDirections.join(" "),
  ];
}

function searchTalentItems(items: TalentDetail[], filters: ListFilters) {
  return filterTalents(items, filters);
}

async function getReadClient() {
  return createServerSupabaseClient();
}

function getPublicReadClient() {
  return createPublicSupabaseClient();
}

function normalizeFilterValue(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "";
}

function buildSearchPattern(value?: string) {
  const normalized = normalizeFilterValue(value).replace(/[(),]/g, " ");
  return normalized ? `%${normalized}%` : "";
}

function buildArrayContainsFilter(value?: string) {
  const normalized = normalizeFilterValue(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return normalized ? `{"${normalized}"}` : "";
}

function serializeFilters(filters: ListFilters) {
  return {
    query: normalizeFilterValue(filters.query),
    type: normalizeFilterValue(filters.type),
    school: normalizeFilterValue(filters.school),
    skill: normalizeFilterValue(filters.skill),
  };
}

function getProfileClient(mode: ReadMode) {
  return mode === "session" ? getReadClient() : Promise.resolve(getPublicReadClient());
}

function stripDemoOpportunities(items: OpportunityDetail[]) {
  return items.filter((item) => !item.isDemo);
}

function stripDemoTalents(items: TalentDetail[]) {
  return items.filter((item) => !item.isDemo);
}

function stripDemoMentors(items: MentorCard[]) {
  return items.filter((item) => !item.isDemo);
}

function getMentorOrganization(parts: Array<string | null | undefined>, fallback?: string) {
  const value = parts.filter(Boolean).join(" / ");
  return value || fallback || "";
}

function normalizeLegacyTalent(record: ProfileRecord): TalentDetail {
  const achievements = Array.isArray(record.achievements) ? (record.achievements as string[]) : [];
  const { skills, customSkills } = splitTalentSkills(record.skill_tags);
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
    customSkills,
    interestedDirections,
    timeCommitment: String(record.time_commitment ?? ""),
    avatarPath: (record.avatar_path as string | null) ?? null,
    portfolioCoverPath: (record.portfolio_cover_path as string | null) ?? null,
    portfolioExternalUrl: (record.portfolio_external_url as string | null) ?? null,
    experience: String(record.experience ?? achievements.join(" / ") ?? ""),
    achievements,
    contact: String(record.contact ?? ""),
    contactHint: String(record.contact_hint ?? "登录后可进一步联系。"),
    isDemo:
      demoStudentNames.has(String(record.name ?? "")) ||
      demoStudentNames.has(String(record.nickname ?? "")),
  };
}

function normalizeStudentProfile(
  profile: ProfileRecord,
  studentProfile?: StudentProfileRecord | null,
): TalentDetail {
  const { skills, customSkills } = splitTalentSkills(
    studentProfile?.skills ?? profile.skill_tags,
    studentProfile?.custom_skills,
  );
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
    customSkills,
    interestedDirections,
    timeCommitment: String(profile.time_commitment ?? ""),
    avatarPath: (profile.avatar_path as string | null) ?? null,
    portfolioCoverPath: (profile.portfolio_cover_path as string | null) ?? null,
    portfolioExternalUrl: (studentProfile?.portfolio as string | null) ?? (profile.portfolio_external_url as string | null) ?? null,
    experience: String(profile.experience ?? ""),
    achievements: Array.isArray(profile.achievements) ? (profile.achievements as string[]) : [],
    contact: String(studentProfile?.contact ?? profile.contact ?? ""),
    contactHint: String(profile.contact_hint ?? "登录后可进一步联系。"),
    isDemo:
      demoStudentNames.has(String(profile.name ?? "")) ||
      demoStudentNames.has(String(profile.nickname ?? "")),
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
    isDemo:
      demoMentorNames.has(String(profile.name ?? "")) ||
      demoMentorNames.has(String(profile.nickname ?? "")) ||
      demoMentorNames.has(String(legacy?.name ?? "")),
  };
}

function normalizeDirectoryTalent(record: Record<string, unknown>): TalentDetail {
  const name = String(record.name ?? "");
  const { skills, customSkills } = splitTalentSkills(record.skills, record.custom_skills);
  return {
    id: String(record.id),
    name,
    nickname: name,
    school: String(record.school ?? ""),
    major: String(record.major ?? ""),
    grade: String(record.grade ?? ""),
    bio: String(record.bio ?? ""),
    skills,
    customSkills,
    interestedDirections: Array.isArray(record.interested_directions)
      ? (record.interested_directions as string[])
      : [],
    timeCommitment: String(record.time_commitment ?? ""),
    avatarPath: (record.avatar_path as string | null) ?? null,
    portfolioCoverPath: null,
    portfolioExternalUrl: (record.portfolio_url as string | null) ?? null,
    experience: String(record.bio ?? ""),
    achievements: [],
    contact: String(record.contact ?? ""),
    contactHint: String(record.contact ?? "登录后可进一步联系。"),
    isDemo: demoStudentNames.has(name),
  };
}

function normalizeDirectoryMentor(record: Record<string, unknown>): MentorCard {
  const name = String(record.name ?? "");
  const school = String(record.school ?? "");
  const college = String(record.college ?? "");
  const lab = String(record.lab ?? "");

  return {
    id: String(record.id),
    name,
    organization: getMentorOrganization([school, college, lab]),
    direction: String(record.research_direction ?? record.bio ?? ""),
    directionTags: Array.isArray(record.skills) ? (record.skills as string[]) : [],
    supportScope: Array.isArray(record.support_types) ? (record.support_types as string[]) : [],
    avatarPath: (record.avatar_path as string | null) ?? null,
    contactMode: String(record.contact ?? ""),
    isOpen: Boolean(record.open_status ?? false),
    school,
    college,
    lab,
    supportMethod: String(record.support_method ?? ""),
    applicationNotes: "",
    isDemo: demoMentorNames.has(name),
  };
}

async function attachStudentTimeCommitment(
  supabase: ReturnType<typeof getPublicReadClient>,
  rows: Array<Record<string, unknown>>,
) {
  const authUserIds = rows
    .map((row) => String(row.auth_user_id ?? ""))
    .filter(Boolean);

  if (authUserIds.length === 0) {
    return rows;
  }

  const uniqueAuthUserIds = [...new Set(authUserIds)];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, time_commitment")
    .in("id", uniqueAuthUserIds);

  if (error || !data) {
    return rows;
  }

  const timeCommitmentMap = new Map(
    data.map((item) => [String(item.id), String(item.time_commitment ?? "")]),
  );

  return rows.map((row) => ({
    ...row,
    time_commitment: timeCommitmentMap.get(String(row.auth_user_id ?? "")) ?? String(row.time_commitment ?? ""),
  }));
}

// Legacy mapper kept temporarily to avoid touching unrelated corrupted seed text in one sweep.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeOpportunityLegacy(record: Record<string, unknown>) {
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
    isDemo: Boolean(record.is_demo) || String(record.title ?? "").includes("Demo"),
    progress: String(record.progress ?? ""),
    trialTask: String(record.trial_task ?? ""),
    supplementaryItems:
      supplementaryItems.length > 0
        ? supplementaryItems
        : [
            record.project_name ? `项目 / 比赛名称：${String(record.project_name)}` : "",
            record.research_direction ? `研究 / 指导方向：${String(record.research_direction)}` : "",
            record.target_audience ? `面向对象：${String(record.target_audience)}` : "",
            record.support_method ? `支持方式：${String(record.support_method)}` : "",
            record.contact_info ? `联系说明：${String(record.contact_info)}` : "",
          ].filter(Boolean),
  };
}

function normalizeOpportunity(record: Record<string, unknown>) {
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
  const applicationRequiredItems = Array.isArray(record.application_required_items)
    ? (record.application_required_items as string[]).filter(
        (item): item is NonNullable<OpportunityDetail["applicationRequiredItems"]>[number] =>
          (applicationRequiredItemValues as readonly string[]).includes(item),
      )
    : [];

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
    weeklyHours: String(record.weekly_hours ?? "待沟通"),
    applicantCount: Number(record.applicant_count ?? 0),
    creatorId: String(record.creator_id ?? ""),
    creatorName: String(record.creator_name ?? "邻派用户"),
    creatorRole,
    creatorRoleLabel: creatorRole === "mentor" ? "导师" : "学生队长",
    creatorOrganization: String(record.creator_org_name ?? record.organization ?? ""),
    coverPath: (record.cover_path as string | null) ?? null,
    feishuUrl: (record.feishu_url as string | null) ?? null,
    createdAt: String(record.created_at ?? ""),
    isDemo: Boolean(record.is_demo) || String(record.title ?? "").includes("Demo"),
    progress: String(record.progress ?? ""),
    trialTask: String(record.trial_task ?? ""),
    applicationRequiredItems,
    applicationRequirementNote:
      String(record.application_requirement_note ?? "") || undefined,
    supplementaryItems:
      supplementaryItems.length > 0
        ? supplementaryItems
        : [
            record.project_name ? `项目 / 比赛名称：${String(record.project_name)}` : "",
            record.research_direction ? `研究 / 指导方向：${String(record.research_direction)}` : "",
            record.target_audience ? `面向对象：${String(record.target_audience)}` : "",
            record.support_method ? `支持方式：${String(record.support_method)}` : "",
            record.contact_info ? `联系方式：${String(record.contact_info)}` : "",
          ].filter(Boolean),
  };
}

function normalizeManagedOpportunityApplication(
  row: ApplicationRecord,
  applicant?: ProfileRecord | null,
): ManagedOpportunityApplication {
  return {
    id: String(row.id ?? ""),
    opportunityId: String(row.opportunity_id ?? ""),
    applicantId: String(row.applicant_id ?? ""),
    applicantName: String(applicant?.nickname ?? applicant?.name ?? "未命名用户"),
    applicantRole: (applicant?.role as AccountRole | null) ?? null,
    introduction: String(row.note ?? ""),
    contact: String(row.contact ?? ""),
    proofUrl: String(row.proof_url ?? row.trial_task_url ?? ""),
    status: (row.status as ManagedOpportunityApplication["status"]) ?? "待查看",
    submittedAt: String(row.created_at ?? ""),
  };
}

async function loadApplicationsForOpportunities(
  supabase: Awaited<ReturnType<typeof getReadClient>>,
  opportunityIds: string[],
) {
  if (opportunityIds.length === 0) {
    return [] as ApplicationRecord[];
  }

  const nextIds = [...new Set(opportunityIds)];
  let result: { data: ApplicationRecord[] | null; error: { message: string } | null } = await supabase
    .from("applications")
    .select("id, opportunity_id, applicant_id, note, contact, proof_url, status, created_at")
    .in("opportunity_id", nextIds)
    .order("created_at", { ascending: false });

  if (result.error && /column .*contact.* does not exist|column .*proof_url.* does not exist/i.test(result.error.message)) {
    const fallback = await supabase
      .from("applications")
      .select("id, opportunity_id, applicant_id, note, trial_task_url, status, created_at")
      .in("opportunity_id", nextIds)
      .order("created_at", { ascending: false });

    result = {
      data: (fallback.data as ApplicationRecord[] | null) ?? null,
      error: fallback.error ? { message: fallback.error.message } : null,
    };
  }

  if (result.error || !result.data) {
    return [] as ApplicationRecord[];
  }

  return result.data as ApplicationRecord[];
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
    const skillMatch = filters.skill
      ? [...item.skills, ...(item.customSkills ?? []), ...item.interestedDirections].includes(filters.skill)
      : true;
    const queryMatch = matchKeyword(buildTalentSearchDocument(item), filters.query);

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

const getCachedOpportunities = unstable_cache(
  async (query: string, type: string, school: string, skill: string, limit: number) => {
    const supabase = getPublicReadClient();
    let request = supabase
      .from("opportunities")
      .select(OPPORTUNITY_SELECT)
      .eq("visibility_status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (type) {
      request = request.eq("type", type);
    }

    if (query) {
      const pattern = buildSearchPattern(query);
      request = request.or(
        `title.ilike.${pattern},summary.ilike.${pattern},creator_name.ilike.${pattern},organization.ilike.${pattern},creator_org_name.ilike.${pattern}`,
      );
    }

    if (school) {
      const pattern = buildSearchPattern(school);
      request = request.or(
        `organization.ilike.${pattern},creator_org_name.ilike.${pattern},school_scope.ilike.${pattern}`,
      );
    }

    if (skill) {
      const arrayContains = buildArrayContainsFilter(skill);
      request = request.or(
        `preset_tags.cs.${arrayContains},custom_tags.cs.${arrayContains},skill_tags.cs.${arrayContains}`,
      );
    }

    const { data, error } = await request;
    if (error || !data) {
      throw error ?? new Error("Failed to load opportunities");
    }

    return data.map((item) => normalizeOpportunity(item as Record<string, unknown>));
  },
  ["public-opportunities"],
  { revalidate: 30, tags: ["opportunities"] },
);

const getCachedTalents = unstable_cache(
  async (query: string, school: string, skill: string, limit: number) => {
    const supabase = getPublicReadClient();
    let request = supabase
      .from("directory_people")
      .select(DIRECTORY_PERSON_SELECT)
      .eq("role", "student")
      .eq("visibility_status", "active")
      .order("updated_at", { ascending: false })
      .limit(Math.max(limit, TALENT_SEARCH_FETCH_LIMIT));

    if (school) {
      request = request.ilike("school", buildSearchPattern(school));
    }

    const { data, error } = await request;
    if (error || !data) {
      throw error ?? new Error("Failed to load directory people");
    }

    const enrichedData = await attachStudentTimeCommitment(
      supabase,
      data as Array<Record<string, unknown>>,
    );

    const normalized = stripDemoTalents(
      enrichedData.map((item) => normalizeDirectoryTalent(item as Record<string, unknown>)),
    );

    return searchTalentItems(normalized, { query, school, skill }).slice(0, limit);
  },
  ["public-talents"],
  { revalidate: 60, tags: ["talents"] },
);

const getCachedMentors = unstable_cache(
  async (query: string, school: string, skill: string, limit: number) => {
    const supabase = getPublicReadClient();
    let request = supabase
      .from("directory_people")
      .select(DIRECTORY_PERSON_SELECT)
      .eq("role", "mentor")
      .eq("visibility_status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query) {
      const pattern = buildSearchPattern(query);
      request = request.or(
        `name.ilike.${pattern},school.ilike.${pattern},college.ilike.${pattern},lab.ilike.${pattern},research_direction.ilike.${pattern},bio.ilike.${pattern}`,
      );
    }

    if (school) {
      request = request.ilike("school", buildSearchPattern(school));
    }

    if (skill) {
      const arrayContains = buildArrayContainsFilter(skill);
      request = request.or(`skills.cs.${arrayContains},support_types.cs.${arrayContains}`);
    }

    const { data, error } = await request;
    if (error || !data) {
      throw error ?? new Error("Failed to load directory mentors");
    }

    return stripDemoMentors(
      data.map((item) => normalizeDirectoryMentor(item as Record<string, unknown>)),
    );
  },
  ["public-mentors"],
  { revalidate: 60, tags: ["mentors"] },
);

const getCachedTalentPoolCounts = unstable_cache(
  async () => {
    const supabase = getPublicReadClient();
    const [{ data: studentRows, error: studentError }, { data: mentorRows, error: mentorError }] = await Promise.all([
      supabase
        .from("directory_people")
        .select("name")
        .eq("role", "student")
        .eq("visibility_status", "active"),
      supabase
        .from("directory_people")
        .select("name")
        .eq("role", "mentor")
        .eq("visibility_status", "active"),
    ]);

    if (studentError || mentorError) {
      throw studentError ?? mentorError ?? new Error("Failed to load talent pool counts");
    }

    return {
      studentCount: (studentRows ?? []).filter((item) => !demoStudentNames.has(String(item.name ?? ""))).length,
      mentorCount: (mentorRows ?? []).filter((item) => !demoMentorNames.has(String(item.name ?? ""))).length,
    };
  },
  ["public-talent-pool-counts"],
  { revalidate: 60, tags: ["talents", "mentors"] },
);

const getCachedCases = unstable_cache(
  async () => {
    const supabase = getPublicReadClient();
    const { data, error } = await supabase.from("cases").select("*").order("created_at", {
      ascending: false,
    });

    if (error || !data) {
      throw error ?? new Error("Failed to load cases");
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
  },
  ["public-cases"],
  { revalidate: 60, tags: ["cases"] },
);

export async function listOpportunities(filters: ListFilters = {}, options: ListOptions = {}) {
  const normalizedFilters = serializeFilters(filters);
  const limit = options.limit ?? DEFAULT_OPPORTUNITY_LIMIT;

  if (!hasSupabaseEnv()) {
    return filterOpportunities(mockOpportunities, normalizedFilters).slice(0, limit);
  }

  try {
    return stripDemoOpportunities(
      await getCachedOpportunities(
      normalizedFilters.query,
      normalizedFilters.type,
      normalizedFilters.school,
      normalizedFilters.skill,
      limit,
      ),
    );
  } catch {
    return [];
  }
}

export async function getOpportunityById(id: string) {
  if (!hasSupabaseEnv()) {
    return mockOpportunities.find((item) => item.id === id) ?? null;
  }

  try {
    const supabase = getPublicReadClient();
    const { data: opportunity, error } = await supabase
      .from("opportunities")
      .select(OPPORTUNITY_SELECT)
      .eq("id", id)
      .eq("visibility_status", "active")
      .maybeSingle();

    if (error || !opportunity) {
      return null;
    }

    const normalized = normalizeOpportunity(opportunity as Record<string, unknown>);
    return normalized.isDemo ? null : normalized;
  } catch {
    return null;
  }
}

export async function listTalents(filters: ListFilters = {}, options: ListOptions = {}) {
  const normalizedFilters = serializeFilters(filters);
  const limit = options.limit ?? DEFAULT_TALENT_LIMIT;

  if (!hasSupabaseEnv()) {
    return filterTalents(mockTalents, normalizedFilters).slice(0, limit);
  }

  try {
    return await getCachedTalents(
      normalizedFilters.query,
      normalizedFilters.school,
      normalizedFilters.skill,
      limit,
    );
  } catch {
    try {
      const supabase = getPublicReadClient();
      const fetchLimit = limit + 6;
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("role", "student")
        .order("updated_at", { ascending: false })
        .limit(fetchLimit);

      if (error || !data) {
        return [];
      }

      const normalized = stripDemoTalents(data.map((item) => normalizeLegacyTalent(item as ProfileRecord)));
      return filterTalents(normalized, normalizedFilters).slice(0, limit);
    } catch {
      return [];
    }
  }
}

export async function getTalentById(id: string) {
  if (!hasSupabaseEnv()) {
    return mockTalents.find((item) => item.id === id) ?? null;
  }

  try {
    const supabase = getPublicReadClient();
    const { data, error } = await supabase
      .from("directory_people")
      .select(DIRECTORY_PERSON_SELECT)
      .eq("id", id)
      .eq("role", "student")
      .eq("visibility_status", "active")
      .maybeSingle();

      if (error || !data) {
        return null;
      }

      const [enrichedRecord] = await attachStudentTimeCommitment(
        supabase,
        [data as Record<string, unknown>],
      );
      const normalized = normalizeDirectoryTalent(enrichedRecord);
      return normalized.isDemo ? null : normalized;
    } catch {
    try {
      const supabase = getPublicReadClient();
      const [{ data: profile, error }, { data: studentProfile, error: studentError }] = await Promise.all([
        supabase.from("profiles").select(PROFILE_SELECT).eq("id", id).maybeSingle(),
        supabase.from("student_profiles").select(STUDENT_PROFILE_SELECT).eq("user_id", id).maybeSingle(),
      ]);

      if (error || !profile || studentError) {
        return null;
      }

      const normalized = normalizeStudentProfile(
        profile as ProfileRecord,
        (studentProfile as StudentProfileRecord | null) ?? null,
      );
      return normalized.isDemo ? null : normalized;
    } catch {
      return null;
    }
  }
}

export async function listMentors(filters: ListFilters = {}, options: ListOptions = {}) {
  const normalizedFilters = serializeFilters(filters);
  const limit = options.limit ?? DEFAULT_MENTOR_LIMIT;

  if (!hasSupabaseEnv()) {
    return filterMentors(mockMentors, normalizedFilters).slice(0, limit);
  }

  try {
    return await getCachedMentors(
      normalizedFilters.query,
      normalizedFilters.school,
      normalizedFilters.skill,
      limit,
    );
  } catch {
    return [];
  }
}

export async function getMentorById(id: string) {
  if (!hasSupabaseEnv()) {
    return mockMentors.find((item) => item.id === id) ?? null;
  }

  try {
    const supabase = getPublicReadClient();
    const { data, error } = await supabase
      .from("directory_people")
      .select(DIRECTORY_PERSON_SELECT)
      .eq("id", id)
      .eq("role", "mentor")
      .eq("visibility_status", "active")
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const normalized = normalizeDirectoryMentor(data as Record<string, unknown>);
    return normalized.isDemo ? null : normalized;
  } catch {
    try {
      const supabase = getPublicReadClient();
      let result = await supabase.from("mentors").select("*").eq("user_id", id).maybeSingle();

      if (result.error || !result.data) {
        result = await supabase.from("mentors").select("*").eq("id", id).maybeSingle();
      }

      if (!result.data) {
        return null;
      }

      const normalized = normalizeLegacyMentor(result.data as LegacyMentorRecord);
      return normalized.isDemo ? null : normalized;
    } catch {
      return null;
    }
  }
}

export async function listTalentPool(filters: ListFilters = {}, options: TalentPoolOptions = {}) {
  const [students, mentors, counts] = await Promise.all([
    listTalents(filters, { limit: options.studentLimit ?? DEFAULT_TALENT_LIMIT }),
    listMentors(filters, { limit: options.mentorLimit ?? DEFAULT_MENTOR_LIMIT }),
    hasSupabaseEnv()
      ? getCachedTalentPoolCounts().catch(() => ({ studentCount: 0, mentorCount: 0 }))
      : Promise.resolve({
          studentCount: stripDemoTalents(mockTalents).length,
          mentorCount: stripDemoMentors(mockMentors).length,
        }),
  ]);

  return { students, mentors, studentCount: counts.studentCount, mentorCount: counts.mentorCount };
}

export async function listCases() {
  if (!hasSupabaseEnv()) {
    return mockCases;
  }

  try {
    return (await getCachedCases()).filter((item) => !item.isDemo);
  } catch {
    return [];
  }
}

export async function getStudentProfileByUserId(userId: string, mode: ReadMode = "session") {
  if (!hasSupabaseEnv()) {
    return mockTalents[0];
  }

  try {
    const supabase = await getProfileClient(mode);
    const [{ data: profile }, { data: studentProfile }] = await Promise.all([
      supabase.from("profiles").select(PROFILE_SELECT).eq("id", userId).maybeSingle(),
      supabase.from("student_profiles").select(STUDENT_PROFILE_SELECT).eq("user_id", userId).maybeSingle(),
    ]);

    if (!profile) {
      return null;
    }

    return normalizeStudentProfile(profile as ProfileRecord, (studentProfile as StudentProfileRecord | null) ?? null);
  } catch {
    try {
      const supabase = await getProfileClient(mode);
      const { data } = await supabase.from("profiles").select(PROFILE_SELECT).eq("id", userId).maybeSingle();
      return data ? normalizeLegacyTalent(data as ProfileRecord) : null;
    } catch {
      return null;
    }
  }
}

export async function getMentorProfileByUserId(userId: string, mode: ReadMode = "session") {
  if (!hasSupabaseEnv()) {
    return mockMentors[0];
  }

  try {
    const supabase = await getProfileClient(mode);
    const [{ data: profile }, { data: mentorProfile }, { data: legacyMentor }] = await Promise.all([
      supabase.from("profiles").select(PROFILE_SELECT).eq("id", userId).maybeSingle(),
      supabase.from("mentor_profiles").select(MENTOR_PROFILE_SELECT).eq("user_id", userId).maybeSingle(),
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
      const supabase = await getProfileClient(mode);
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

export async function getPersonalShowcase(
  userId: string,
  role: AccountRole,
  mode: ReadMode = "session",
): Promise<PersonalShowcase | null> {
  if (role === "student") {
    const profile = await getStudentProfileByUserId(userId, mode);
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      role,
      title: profile.name,
      subtitle: [profile.school, profile.major, profile.grade].filter(Boolean).join(" · "),
      summary: profile.bio || "先把基础资料挂出来，后面再慢慢补作品和项目经历。",
      tags: [...profile.skills, ...(profile.customSkills ?? [])],
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

  const mentor = await getMentorProfileByUserId(userId, mode);
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
        .order("created_at", { ascending: false })
        .limit(DASHBOARD_APPLICATION_LIMIT),
      supabase
        .from("opportunities")
        .select(OPPORTUNITY_SELECT)
        .eq("creator_id", userId)
        .order("created_at", { ascending: false })
        .limit(DASHBOARD_OPPORTUNITY_LIMIT),
      role === "mentor" ? getMentorProfileByUserId(userId) : getStudentProfileByUserId(userId),
    ]);

    const opportunityRows = (opportunities.data ?? []) as Array<Record<string, unknown>>;
    const opportunityIds = opportunityRows.map((item) => String(item.id));
    const opportunityApplications = await loadApplicationsForOpportunities(supabase, opportunityIds);
    const applicantCountMap = new Map<string, number>();

    opportunityApplications.forEach((item) => {
      const opportunityId = String(item.opportunity_id ?? "");
      applicantCountMap.set(opportunityId, (applicantCountMap.get(opportunityId) ?? 0) + 1);
    });

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
        opportunityRows.map((item) =>
          normalizeOpportunity({
            ...item,
            applicant_count: applicantCountMap.get(String(item.id)) ?? Number(item.applicant_count ?? 0),
          }),
        ) ?? [],
    };
  } catch {
    return {
      profile: role === "mentor" ? mockMentors[0] : mockTalents[0],
      applications: mockDashboardApplications,
      opportunities: mockOpportunities.slice(0, 2),
    };
  }
}

export async function getManagedOpportunityApplications(opportunityId: string, userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await getReadClient();
    const { data: opportunity, error } = await supabase
      .from("opportunities")
      .select(OPPORTUNITY_SELECT)
      .eq("id", opportunityId)
      .eq("creator_id", userId)
      .maybeSingle();

    if (error || !opportunity) {
      return null;
    }

    const applicationRows = await loadApplicationsForOpportunities(supabase, [opportunityId]);
    const applicantIds = applicationRows.map((item) => String(item.applicant_id ?? "")).filter(Boolean);
    const uniqueApplicantIds = [...new Set(applicantIds)];
    const { data: applicants } = uniqueApplicantIds.length
      ? await supabase.from("profiles").select("id, name, nickname, role").in("id", uniqueApplicantIds)
      : { data: [] as ProfileRecord[] };

    const applicantMap = new Map(
      (applicants ?? []).map((item) => [String(item.id), item as ProfileRecord]),
    );

    return {
      opportunity: normalizeOpportunity({
        ...(opportunity as Record<string, unknown>),
        applicant_count: applicationRows.length,
      }),
      applications: applicationRows.map((item) =>
        normalizeManagedOpportunityApplication(
          item,
          applicantMap.get(String(item.applicant_id ?? "")) ?? null,
        ),
      ),
    };
  } catch {
    return null;
  }
}
