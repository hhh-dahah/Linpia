"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  getCurrentAccountRole,
  getCurrentUser,
  isAdminEmail,
} from "@/lib/auth";
import { canManageAdmins, getCurrentAdminUser } from "@/lib/admin";
import { findAuthUserByEmail } from "@/lib/admin-data";
import { hasServiceRoleEnv, hasSupabaseEnv } from "@/lib/env";
import { uploadImage } from "@/lib/storage";
import { createAdminSupabaseClient } from "@/supabase/admin";
import { createServerSupabaseClient } from "@/supabase/server";
import type { ActionState } from "@/types/action";
import type { AdminApplicationStatus, AdminRole, VisibilityStatus } from "@/types/admin";
import { applicationStatuses, type ApplicationStatus } from "@/types/application";
import {
  applicationRequiredItemLabels,
  applicationRequiredItems as applicationRequiredItemValues,
  type ApplicationRequiredItem,
} from "@/types/opportunity";
import { createApplicationSchema } from "@/validators/application";
import { caseSchema } from "@/validators/case";
import { mentorSchema } from "@/validators/mentor";
import { opportunitySchema } from "@/validators/opportunity";
import { profileSchema } from "@/validators/profile";

function toFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}

function offlineState(message: string): ActionState {
  return {
    status: "error",
    message,
  };
}

async function requireConfiguredSupabase() {
  if (!hasSupabaseEnv()) {
    throw new Error("当前还没有配置 Supabase，请先补齐 .env.local。");
  }

  return createServerSupabaseClient();
}

async function getWriteClient() {
  if (hasServiceRoleEnv()) {
    return createAdminSupabaseClient();
  }

  return createServerSupabaseClient();
}

async function syncOpportunityApplicantCount(
  client: Awaited<ReturnType<typeof getWriteClient>>,
  opportunityId: string,
) {
  const { count } = await client
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", opportunityId);

  await client
    .from("opportunities")
    .update({
      applicant_count: count ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunityId);
}

function getDefaultDeadline() {
  const target = new Date();
  target.setDate(target.getDate() + 30);
  return target.toISOString().slice(0, 10);
}

function normalizeRequiredItems(values: string[]) {
  return values.filter(
    (value): value is ApplicationRequiredItem =>
      (applicationRequiredItemValues as readonly string[]).includes(value),
  );
}

function buildApplicationSubmissionPayload(payload: {
  intro?: string;
  portfolioLink?: string;
  projectExperience?: string;
  proofMaterial?: string;
  resumeLink?: string;
  githubPortfolio?: string;
  availability?: string;
}) {
  return Object.fromEntries(
    Object.entries({
      intro: payload.intro ?? "",
      portfolioLink: payload.portfolioLink ?? "",
      projectExperience: payload.projectExperience ?? "",
      proofMaterial: payload.proofMaterial ?? "",
      resumeLink: payload.resumeLink ?? "",
      githubPortfolio: payload.githubPortfolio ?? "",
      availability: payload.availability ?? "",
    }).filter(([, value]) => Boolean(String(value).trim())),
  );
}

function buildApplicationSummary(
  payload: {
    intro?: string;
    portfolioLink?: string;
    projectExperience?: string;
    proofMaterial?: string;
    resumeLink?: string;
    githubPortfolio?: string;
    availability?: string;
  },
  requiredItems: ApplicationRequiredItem[],
) {
  if ((payload.intro ?? "").trim()) {
    return (payload.intro ?? "").trim();
  }

  const fieldMap: Record<ApplicationRequiredItem, string> = {
    intro: payload.intro ?? "",
    portfolio_link: payload.portfolioLink ?? "",
    project_experience: payload.projectExperience ?? "",
    proof_material: payload.proofMaterial ?? "",
    resume_link: payload.resumeLink ?? "",
    github_portfolio: payload.githubPortfolio ?? "",
    availability: payload.availability ?? "",
  };

  const lines = requiredItems
    .map((item) => {
      const value = fieldMap[item]?.trim();
      if (!value) {
        return "";
      }
      return `${applicationRequiredItemLabels[item]}：${value}`;
    })
    .filter(Boolean);

  return lines.join("\n") || "报名者已提交联系方式。";
}

function getPrimaryProofUrl(payload: {
  portfolioLink?: string;
  resumeLink?: string;
  githubPortfolio?: string;
}) {
  return (
    payload.portfolioLink?.trim() ||
    payload.githubPortfolio?.trim() ||
    payload.resumeLink?.trim() ||
    null
  );
}

async function syncLegacyUserRole(userId: string, role: "student" | "mentor") {
  if (!hasServiceRoleEnv()) {
    return;
  }

  const admin = createAdminSupabaseClient();
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      role,
    },
  });
}

function buildMentorOrganization(payload: {
  organization: string;
  school?: string;
  college?: string;
  lab?: string;
}) {
  return (
    payload.organization ||
    [payload.school, payload.college, payload.lab].filter(Boolean).join(" / ")
  );
}

function buildMentorContactBundle(payload: {
  school?: string;
  college?: string;
  lab?: string;
  supportMethod: string;
  contactMode: string;
  applicationNotes?: string;
}) {
  return [
    payload.school ? `学校：${payload.school}` : "",
    payload.college ? `学院：${payload.college}` : "",
    payload.lab ? `实验室：${payload.lab}` : "",
    payload.supportMethod ? `支持方式：${payload.supportMethod}` : "",
    payload.contactMode ? `联系方式：${payload.contactMode}` : "",
    payload.applicationNotes ? `申请说明：${payload.applicationNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function syncDirectoryPersonRecord(
  client: Awaited<ReturnType<typeof getWriteClient>>,
  payload: {
    id: string;
    role: "student" | "mentor";
    source?: "registered" | "managed";
    name: string;
    authUserId?: string | null;
    school?: string;
    major?: string;
    grade?: string;
    college?: string;
    lab?: string;
    bio?: string;
    skills?: string[];
    customSkills?: string[];
    interestedDirections?: string[];
    researchDirection?: string;
    supportTypes?: string[];
    supportMethod?: string;
    openStatus?: boolean;
    contact?: string;
    avatarPath?: string | null;
    portfolioUrl?: string | null;
    visibilityStatus?: VisibilityStatus;
    createdByAdminId?: string | null;
    updatedByAdminId?: string | null;
    archivedAt?: string | null;
  },
) {
  const baseRecord = {
    id: payload.id,
    auth_user_id: payload.authUserId ?? null,
    source: payload.source ?? "registered",
    role: payload.role,
    name: payload.name,
    school: payload.school || null,
    major: payload.major || null,
    grade: payload.grade || null,
    college: payload.college || null,
    lab: payload.lab || null,
    bio: payload.bio || null,
    skills: payload.skills ?? [],
    interested_directions: payload.interestedDirections ?? [],
    research_direction: payload.researchDirection || null,
    support_types: payload.supportTypes ?? [],
    support_method: payload.supportMethod || null,
    open_status: payload.openStatus ?? false,
    contact: payload.contact || null,
    avatar_path: payload.avatarPath ?? null,
    portfolio_url: payload.portfolioUrl ?? null,
    visibility_status: payload.visibilityStatus ?? "active",
    created_by_admin_id: payload.createdByAdminId ?? null,
    updated_by_admin_id: payload.updatedByAdminId ?? null,
    archived_at: payload.archivedAt ?? null,
    updated_at: new Date().toISOString(),
  };

  let { error } = await client.from("directory_people").upsert(
    {
      ...baseRecord,
      custom_skills: payload.customSkills ?? [],
    },
    { onConflict: "id" },
  );

  if (error && /custom_skills/i.test(error.message)) {
    ({ error } = await client.from("directory_people").upsert(baseRecord, { onConflict: "id" }));
  }

  if (error && !/relation .*directory_people.* does not exist/i.test(error.message)) {
    throw error;
  }
}

async function requireAdminAction(role: AdminRole | "any" = "any") {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("请先登录后再进入后台。");
  }

  const adminUser = await getCurrentAdminUser();
  if (!adminUser) {
    throw new Error("当前账号没有后台权限。");
  }

  if (role !== "any" && adminUser.role !== role) {
    throw new Error("当前账号没有执行该操作的权限。");
  }

  const client = await getWriteClient();
  return { currentUser, adminUser, client };
}

function revalidateAdminPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/people");
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/admin-users");
}

function getRoleCompletion(payload: {
  nickname?: string;
  school?: string;
  major?: string;
  grade?: string;
  bio?: string;
  experience?: string;
  contact?: string;
  direction?: string;
  supportScope?: string[];
  supportMethod?: string;
  organization?: string;
}) {
  const hasNickname = Boolean(payload.nickname?.trim());
  const hasContact = Boolean(payload.contact?.trim());
  const isMentorFlow = Boolean(
    payload.direction?.trim() ||
      payload.supportMethod?.trim() ||
      payload.organization?.trim() ||
      (payload.supportScope?.length ?? 0) > 0,
  );

  if (isMentorFlow) {
    return Boolean(
      hasNickname &&
        hasContact &&
        payload.direction?.trim() &&
        payload.supportMethod?.trim() &&
        payload.organization?.trim() &&
        (payload.supportScope?.length ?? 0) > 0,
    );
  }

  return Boolean(hasNickname && hasContact);
}

export async function logoutAction() {
  if (hasSupabaseEnv()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}

export async function loginAction() {
  redirect("/login");
}

export async function saveRoleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const role = String(formData.get("role") ?? "");

  if (role !== "student" && role !== "mentor") {
    return {
      status: "error",
      message: "请先选择你的身份。",
      fieldErrors: {
        role: ["请选择学生或导师。"],
      },
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      status: "error",
      message: "请先登录，登录后即可发布招募、报名合作和管理个人资料。",
    };
  }

  if (!hasSupabaseEnv()) {
    return offlineState("当前还没有配置 Supabase，请先完成环境配置。");
  }

  try {
    const client = await getWriteClient();
    const fallbackName =
      user.user_metadata?.nickname ||
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "邻派用户";

    const { data: existingProfile } = await client
      .from("profiles")
      .select("name, nickname")
      .eq("id", user.id)
      .maybeSingle();

    const displayName =
      existingProfile?.name ||
      existingProfile?.nickname ||
      (typeof fallbackName === "string" ? fallbackName : "邻派用户");

    const { error } = await client.from("profiles").upsert({
      id: user.id,
      role,
      name: displayName,
      nickname: existingProfile?.nickname || displayName,
      profile_completed: false,
      updated_at: new Date().toISOString(),
    });

    if (error && !/column .*role|column .*profile_completed/i.test(error.message)) {
      return { status: "error", message: "身份保存失败，请稍后再试。" };
    }

    await syncLegacyUserRole(user.id, role);

    revalidatePath("/onboarding/role");
    revalidatePath("/profile");
    revalidatePath("/publish");

    return {
      status: "success",
      message: role === "student" ? "已切换为学生身份。" : "已切换为导师身份。",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "身份保存失败，请稍后再试。",
    };
  }
}

export async function saveProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const payload = {
    name: String(formData.get("name") ?? ""),
    school: String(formData.get("school") ?? ""),
    major: String(formData.get("major") ?? ""),
    grade: String(formData.get("grade") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    skillTags: formData.getAll("skillTags").map(String),
    customSkills: formData.getAll("customSkills").map(String),
    interestedDirections: formData.getAll("interestedDirections").map(String),
    timeCommitment: String(formData.get("timeCommitment") ?? ""),
    portfolioExternalUrl: String(formData.get("portfolioExternalUrl") ?? ""),
    experience: String(formData.get("experience") ?? ""),
    contact: String(formData.get("contact") ?? ""),
    avatar: formData.get("avatar"),
    portfolioCover: formData.get("portfolioCover"),
  };

  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: "学生资料还有几项没填好，请按提示修改。",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (!hasSupabaseEnv()) {
    return offlineState("资料校验已经通过，配置 Supabase 后就可以正式保存。");
  }

  try {
    const supabase = await requireConfiguredSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return offlineState("请先登录后再保存个人资料。");
    }

    const avatarPath = await uploadImage({
      supabase,
      bucket: "avatars",
      folder: "avatars",
      file: parsed.data.avatar,
      ownerId: user.id,
    });

    const portfolioCoverPath = await uploadImage({
      supabase,
      bucket: "portfolio-covers",
      folder: "portfolio-covers",
      file: parsed.data.portfolioCover,
      ownerId: user.id,
    });

    const client = await getWriteClient();
    const mergedSkills = [...new Set([...parsed.data.skillTags, ...parsed.data.customSkills])];
    const profileCompleted = getRoleCompletion({
      nickname: parsed.data.name,
      school: parsed.data.school,
      major: parsed.data.major,
      grade: parsed.data.grade,
      bio: parsed.data.bio,
      experience: parsed.data.experience,
      contact: parsed.data.contact,
    });

    let profileResult = await client.from("profiles").upsert({
      id: user.id,
      role: "student",
      nickname: parsed.data.name,
      profile_completed: profileCompleted,
      name: parsed.data.name,
      school: parsed.data.school || null,
      major: parsed.data.major || null,
      grade: parsed.data.grade || null,
      bio: parsed.data.bio || null,
      avatar_path: avatarPath,
      portfolio_cover_path: portfolioCoverPath,
      portfolio_external_url: parsed.data.portfolioExternalUrl || null,
      time_commitment: parsed.data.timeCommitment || null,
      skill_tags: mergedSkills,
      interested_directions: parsed.data.interestedDirections,
      achievements: parsed.data.experience ? [parsed.data.experience] : [],
      experience: parsed.data.experience || null,
      contact: parsed.data.contact || null,
      contact_hint: parsed.data.contact || "登录后可进一步联系。",
      updated_at: new Date().toISOString(),
    });

    if (profileResult.error && /column .*role|column .*profile_completed/i.test(profileResult.error.message)) {
      profileResult = await client.from("profiles").upsert({
        id: user.id,
        nickname: parsed.data.name,
        name: parsed.data.name,
        school: parsed.data.school || null,
        major: parsed.data.major || null,
        grade: parsed.data.grade || null,
        bio: parsed.data.bio || null,
        avatar_path: avatarPath,
        portfolio_cover_path: portfolioCoverPath,
        portfolio_external_url: parsed.data.portfolioExternalUrl || null,
        time_commitment: parsed.data.timeCommitment || null,
        skill_tags: mergedSkills,
        interested_directions: parsed.data.interestedDirections,
        achievements: parsed.data.experience ? [parsed.data.experience] : [],
        experience: parsed.data.experience || null,
        contact: parsed.data.contact || null,
        contact_hint: parsed.data.contact || "登录后可进一步联系。",
        updated_at: new Date().toISOString(),
      });
    }

    if (profileResult.error) {
      return { status: "error", message: "学生主资料保存失败，请稍后再试。" };
    }

    let studentProfileResult = await client.from("student_profiles").upsert({
      user_id: user.id,
      school: parsed.data.school || null,
      major: parsed.data.major || null,
      grade: parsed.data.grade || null,
      skills: mergedSkills,
      custom_skills: parsed.data.customSkills,
      intro: parsed.data.bio || null,
      portfolio: parsed.data.portfolioExternalUrl || null,
      target_direction: parsed.data.interestedDirections.join("、") || null,
      contact: parsed.data.contact || null,
    });

    if (studentProfileResult.error && /custom_skills/i.test(studentProfileResult.error.message)) {
      studentProfileResult = await client.from("student_profiles").upsert({
        user_id: user.id,
        school: parsed.data.school || null,
        major: parsed.data.major || null,
        grade: parsed.data.grade || null,
        skills: mergedSkills,
        intro: parsed.data.bio || null,
        portfolio: parsed.data.portfolioExternalUrl || null,
        target_direction: parsed.data.interestedDirections.join("、") || null,
        contact: parsed.data.contact || null,
      });
    }

    if (
      studentProfileResult.error &&
      !/relation .*student_profiles.* does not exist/i.test(studentProfileResult.error.message)
    ) {
      return { status: "error", message: "学生资料保存失败，请稍后再试。" };
    }

    await syncDirectoryPersonRecord(client, {
      id: user.id,
      authUserId: user.id,
      source: "registered",
      role: "student",
      name: parsed.data.name,
      school: parsed.data.school,
      major: parsed.data.major,
      grade: parsed.data.grade,
      bio: parsed.data.bio,
      skills: mergedSkills,
      customSkills: parsed.data.customSkills,
      interestedDirections: parsed.data.interestedDirections,
      contact: parsed.data.contact,
      avatarPath,
      portfolioUrl: parsed.data.portfolioExternalUrl || null,
      visibilityStatus: "active",
    });

    await syncLegacyUserRole(user.id, "student");

    revalidatePath("/profile");
    revalidatePath("/profile/student");
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/talent");
    revalidatePath("/admin/people");
    revalidateTag("talents", "max");

    return { status: "success", message: "学生资料已保存。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "学生资料保存失败，请稍后再试。",
    };
  }
}

export async function saveMentorProfileAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    name: String(formData.get("name") ?? ""),
    school: String(formData.get("school") ?? ""),
    college: String(formData.get("college") ?? ""),
    lab: String(formData.get("lab") ?? ""),
    organization: String(formData.get("organization") ?? ""),
    direction: String(formData.get("direction") ?? ""),
    directionTags: formData.getAll("directionTags").map(String).filter(Boolean),
    supportScope: formData.getAll("supportScope").map(String).filter(Boolean),
    supportMethod: String(formData.get("supportMethod") ?? ""),
    contactMode: String(formData.get("contactMode") ?? ""),
    applicationNotes: String(formData.get("applicationNotes") ?? ""),
    isOpen: formData.get("isOpen") === "on",
  };

  const parsed = mentorSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: "导师资料还有几项没填好，请按提示修改。",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return offlineState("请先登录后再保存导师资料。");
  }

  if (!hasSupabaseEnv()) {
    return offlineState("资料校验已经通过，配置 Supabase 后就可以正式保存。");
  }

  try {
    const client = await getWriteClient();
    const organization = buildMentorOrganization(parsed.data);
    const profileCompleted = getRoleCompletion({
      nickname: parsed.data.name,
      direction: parsed.data.direction,
      supportScope: parsed.data.supportScope,
      supportMethod: parsed.data.supportMethod,
      organization,
    });

    let profileResult = await client.from("profiles").upsert({
      id: user.id,
      role: "mentor",
      name: parsed.data.name,
      nickname: parsed.data.name,
      profile_completed: profileCompleted,
      updated_at: new Date().toISOString(),
    });

    if (profileResult.error && /column .*role|column .*profile_completed/i.test(profileResult.error.message)) {
      profileResult = await client.from("profiles").upsert({
        id: user.id,
        name: parsed.data.name,
        nickname: parsed.data.name,
        updated_at: new Date().toISOString(),
      });
    }

    if (profileResult.error) {
      return { status: "error", message: "导师主资料保存失败，请稍后再试。" };
    }

    const mentorProfileResult = await client.from("mentor_profiles").upsert({
      user_id: user.id,
      school: parsed.data.school || null,
      college: parsed.data.college || null,
      lab: parsed.data.lab || null,
      research_direction: parsed.data.direction,
      support_types: parsed.data.supportScope,
      support_method: parsed.data.supportMethod,
      open_status: parsed.data.isOpen,
      intro: parsed.data.direction,
      contact: parsed.data.contactMode,
      application_notes: parsed.data.applicationNotes || null,
    });

    if (
      mentorProfileResult.error &&
      !/relation .*mentor_profiles.* does not exist/i.test(mentorProfileResult.error.message)
    ) {
      return { status: "error", message: "导师资料保存失败，请稍后再试。" };
    }

    const legacyResult = await client.from("mentors").upsert(
      {
        user_id: user.id,
        name: parsed.data.name,
        school: parsed.data.school || null,
        college: parsed.data.college || null,
        lab: parsed.data.lab || null,
        organization,
        direction: parsed.data.direction,
        direction_tags: parsed.data.directionTags,
        support_scope: parsed.data.supportScope,
        support_method: parsed.data.supportMethod,
        application_notes: parsed.data.applicationNotes || null,
        contact_mode: buildMentorContactBundle(parsed.data),
        avatar_path: null,
        is_open: parsed.data.isOpen,
      },
      { onConflict: "user_id" },
    );

    if (
      legacyResult.error &&
      !/constraint/i.test(legacyResult.error.message) &&
      !/column/i.test(legacyResult.error.message)
    ) {
      return { status: "error", message: "导师资料保存失败，请稍后再试。" };
    }

    await syncDirectoryPersonRecord(client, {
      id: user.id,
      authUserId: user.id,
      source: "registered",
      role: "mentor",
      name: parsed.data.name,
      school: parsed.data.school,
      college: parsed.data.college,
      lab: parsed.data.lab,
      bio: parsed.data.direction,
      skills: parsed.data.directionTags,
      researchDirection: parsed.data.direction,
      supportTypes: parsed.data.supportScope,
      supportMethod: parsed.data.supportMethod,
      openStatus: parsed.data.isOpen,
      contact: parsed.data.contactMode,
      visibilityStatus: "active",
    });

    await syncLegacyUserRole(user.id, "mentor");

    revalidatePath("/profile");
    revalidatePath("/profile/mentor");
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/talent");
    revalidatePath("/mentors");
    revalidatePath("/admin/people");
    revalidateTag("mentors", "max");

    return { status: "success", message: "导师资料已保存。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "导师资料保存失败，请稍后再试。",
    };
  }
}

export async function publishOpportunityAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const role = String(formData.get("role") ?? "");
  const payload = {
    role: role === "mentor" ? ("mentor" as const) : ("student" as const),
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? ""),
    projectName: String(formData.get("projectName") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    contactInfo: String(formData.get("contactInfo") ?? ""),
    organization: String(formData.get("organization") ?? ""),
    deadline: String(formData.get("deadline") ?? ""),
    weeklyHours: String(formData.get("weeklyHours") ?? ""),
    feishuUrl: String(formData.get("feishuUrl") ?? ""),
    presetTags: formData.getAll("presetTags").map(String),
    customTags: formData.getAll("customTags").map(String),
    applicationRequiredItems: formData.getAll("applicationRequiredItems").map(String),
    applicationRequirementNote: String(formData.get("applicationRequirementNote") ?? ""),
    cover: formData.get("cover"),
  };

  const parsed = opportunitySchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: "招募表单还有几项没填好，请按提示修改。",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (!hasSupabaseEnv()) {
    return offlineState("表单校验已经通过，配置 Supabase 后就可以正式发布。");
  }

  try {
    const supabase = await requireConfiguredSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return offlineState("请先登录后再发布招募。");
    }

    const currentRole = await getCurrentAccountRole(user);
    if (!currentRole) {
      return {
        status: "error",
        message: "请先选择身份，再继续发布招募。",
      };
    }

    if (currentRole !== parsed.data.role) {
      return {
        status: "error",
        message: "当前身份和表单不匹配，请刷新页面后再试。",
      };
    }

    const opportunityId = crypto.randomUUID();
    const coverPath = await uploadImage({
      supabase,
      bucket: "opportunity-covers",
      folder: "opportunity-covers",
      file: parsed.data.cover,
      ownerId: opportunityId,
    });

    const client = await getWriteClient();
    const tags = [...parsed.data.presetTags, ...parsed.data.customTags];
    const organization = (parsed.data.organization ?? "").trim() || "待补充";
    const deadline = parsed.data.deadline || getDefaultDeadline();
    const weeklyHours = (parsed.data.weeklyHours ?? "").trim() || "待沟通";
    const applicationRequiredItems = normalizeRequiredItems(parsed.data.applicationRequiredItems);
    const applicationRequirementNote = (parsed.data.applicationRequirementNote ?? "").trim();
    const progress = `项目 / 比赛名称：${parsed.data.projectName}`;
    const supplementaryItems = [
      organization ? `学校 / 团队：${organization}` : "",
      parsed.data.contactInfo ? `联系方式：${parsed.data.contactInfo}` : "",
    ].filter(Boolean);

    const creatorName = user.email?.split("@")[0] || "邻派用户";
    const baseInsert = {
      id: opportunityId,
      type: parsed.data.type,
      title: parsed.data.title,
      summary: parsed.data.summary,
      organization,
      school_scope: organization,
      deadline,
      creator_id: user.id,
      creator_name: creatorName,
      creator_role: parsed.data.role,
      creator_org_name: organization,
      contact_info: parsed.data.contactInfo,
      cover_path: coverPath,
      feishu_url: parsed.data.feishuUrl || null,
      status: "开放申请",
      weekly_hours: weeklyHours,
      progress,
      trial_task: applicationRequirementNote || null,
      skill_tags: tags,
      preset_tags: parsed.data.presetTags,
      custom_tags: parsed.data.customTags,
      deliverables: supplementaryItems,
      project_name: parsed.data.projectName,
      research_direction: null,
      target_audience: null,
      support_method: null,
      applicant_count: 0,
    };

    let insertResult = await client.from("opportunities").insert({
      ...baseInsert,
      application_required_items: applicationRequiredItems,
      application_requirement_note: applicationRequirementNote || null,
    });

    if (
      insertResult.error &&
      /application_required_items|application_requirement_note/i.test(insertResult.error.message)
    ) {
      insertResult = await client.from("opportunities").insert(baseInsert);
    }

    if (insertResult.error) {
      return { status: "error", message: "招募发布失败，请稍后再试。" };
    }

    revalidatePath("/opportunities");
    revalidatePath("/publish");
    revalidatePath("/dashboard");
    revalidateTag("opportunities", "max");

    return { status: "success", message: "招募已发布。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "招募发布失败，请稍后再试。",
    };
  }
}

export async function applyOpportunityAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const payload = {
    opportunityId: String(formData.get("opportunityId") ?? ""),
    contact: String(formData.get("contact") ?? ""),
    intro: String(formData.get("intro") ?? ""),
    portfolioLink: String(formData.get("portfolioLink") ?? ""),
    projectExperience: String(formData.get("projectExperience") ?? ""),
    proofMaterial: String(formData.get("proofMaterial") ?? ""),
    resumeLink: String(formData.get("resumeLink") ?? ""),
    githubPortfolio: String(formData.get("githubPortfolio") ?? ""),
    availability: String(formData.get("availability") ?? ""),
  };

  if (!hasSupabaseEnv()) {
    return offlineState("报名信息校验已经通过，配置 Supabase 后就可以写入真实记录。");
  }

  try {
    const supabase = await requireConfiguredSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return offlineState("请先登录，登录后即可发布招募、报名合作和管理个人资料。");
    }

    const client = await getWriteClient();
    const { data: opportunity } = await client
      .from("opportunities")
      .select("title, application_required_items, application_requirement_note")
      .eq("id", payload.opportunityId)
      .maybeSingle();

    const requiredItems = normalizeRequiredItems(
      Array.isArray(opportunity?.application_required_items)
        ? opportunity.application_required_items.map(String)
        : [],
    );

    const parsed = createApplicationSchema({ requiredItems }).safeParse(payload);
    if (!parsed.success) {
      return {
        status: "error",
        message: "报名信息还有几项没填好，请按提示补充。",
        fieldErrors: toFieldErrors(parsed.error),
      };
    }

    const submissionPayload = buildApplicationSubmissionPayload(parsed.data);
    const note = buildApplicationSummary(parsed.data, requiredItems);
    const proofUrl = getPrimaryProofUrl(parsed.data);

    let result = await client.from("applications").upsert({
      opportunity_id: parsed.data.opportunityId,
      applicant_id: user.id,
      note,
      contact: parsed.data.contact,
      proof_url: proofUrl,
      submission_payload: submissionPayload,
      status: "待查看",
      opportunity_title: opportunity?.title ?? "未命名招募",
    });

    if (result.error) {
      if (
        /submission_payload|column .*contact.* does not exist|column .*proof_url.* does not exist/i.test(
          result.error.message,
        )
      ) {
        result = await client.from("applications").upsert({
          opportunity_id: parsed.data.opportunityId,
          applicant_id: user.id,
          note,
          trial_task_url: proofUrl,
          status: "待查看",
          opportunity_title: opportunity?.title ?? "未命名招募",
        });
      }

      if (result.error) {
        return { status: "error", message: "报名提交失败，请稍后再试。" };
      }
    }

    await syncOpportunityApplicantCount(client, parsed.data.opportunityId);
    revalidatePath("/dashboard");
    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${parsed.data.opportunityId}`);
    revalidatePath(`/dashboard/opportunities/${parsed.data.opportunityId}`);
    revalidateTag("opportunities", "max");

    return { status: "success", message: "报名已提交，发起方看到后会尽快联系你。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "报名提交失败，请稍后再试。",
    };
  }
}

export async function saveMentorAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const payload = {
    name: String(formData.get("name") ?? ""),
    school: "",
    college: "",
    lab: "",
    organization: String(formData.get("organization") ?? ""),
    direction: String(formData.get("direction") ?? ""),
    directionTags: formData.getAll("directionTags").map(String).filter(Boolean),
    supportScope: formData.getAll("supportScope").map(String).filter(Boolean),
    supportMethod: "管理员录入",
    contactMode: String(formData.get("contactMode") ?? ""),
    applicationNotes: "",
    isOpen: formData.get("isOpen") === "on",
  };

  const parsed = mentorSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: "导师表单还有几项没填好。",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || !isAdminEmail(currentUser.email)) {
    return offlineState("只有管理员白名单邮箱可以录入导师资料。");
  }

  if (!hasServiceRoleEnv()) {
    return offlineState("请先配置 SUPABASE_SERVICE_ROLE_KEY 再进行后台录入。");
  }

  try {
    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("mentors").insert({
      name: parsed.data.name,
      organization: parsed.data.organization,
      direction: parsed.data.direction,
      direction_tags: parsed.data.directionTags,
      support_scope: parsed.data.supportScope,
      support_method: parsed.data.supportMethod,
      application_notes: null,
      contact_mode: buildMentorContactBundle(parsed.data),
      avatar_path: null,
      is_open: parsed.data.isOpen,
    });

    if (error) {
      return { status: "error", message: "导师录入失败，请稍后再试。" };
    }

    revalidatePath("/mentors");
    revalidatePath("/dashboard/admin");
    revalidateTag("mentors", "max");
    return { status: "success", message: "导师资料已录入。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "导师录入失败，请稍后再试。",
    };
  }
}

export async function saveCaseAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const payload = {
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    resultTags: formData.getAll("resultTags").map(String).filter(Boolean),
    relatedOpportunityId: String(formData.get("relatedOpportunityId") ?? ""),
    coverPath: String(formData.get("coverPath") ?? ""),
  };

  const parsed = caseSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: "案例表单还有几项没填好。",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || !isAdminEmail(currentUser.email)) {
    return offlineState("只有管理员白名单邮箱可以录入案例。");
  }

  if (!hasServiceRoleEnv()) {
    return offlineState("请先配置 SUPABASE_SERVICE_ROLE_KEY 再进行后台录入。");
  }

  try {
    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("cases").insert({
      title: parsed.data.title,
      summary: parsed.data.summary,
      result_tags: parsed.data.resultTags,
      related_opportunity_id: parsed.data.relatedOpportunityId || null,
      cover_path: parsed.data.coverPath || null,
    });

    if (error) {
      return { status: "error", message: "案例录入失败，请稍后再试。" };
    }

    revalidatePath("/cases");
    revalidatePath("/dashboard/admin");
    revalidateTag("cases", "max");
    return { status: "success", message: "案例已录入。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "案例录入失败，请稍后再试。",
    };
  }
}

export async function saveAdminPersonAction(formData: FormData) {
  try {
    const { adminUser, client } = await requireAdminAction();
    const personId = String(formData.get("personId") ?? "").trim() || crypto.randomUUID();
    const role = String(formData.get("role") ?? "");
    const visibilityStatus = String(formData.get("visibilityStatus") ?? "active") as VisibilityStatus;

    if (role !== "student" && role !== "mentor") {
      throw new Error("请选择人员身份。");
    }

    await syncDirectoryPersonRecord(client, {
      id: personId,
      authUserId: String(formData.get("authUserId") ?? "").trim() || null,
      source: (String(formData.get("source") ?? "managed") === "registered" ? "registered" : "managed"),
      role,
      name: String(formData.get("name") ?? "").trim() || "未命名成员",
      school: String(formData.get("school") ?? "").trim(),
      major: String(formData.get("major") ?? "").trim(),
      grade: String(formData.get("grade") ?? "").trim(),
      college: String(formData.get("college") ?? "").trim(),
      lab: String(formData.get("lab") ?? "").trim(),
      bio: String(formData.get("bio") ?? "").trim(),
      skills: formData.getAll("skills").map(String).filter(Boolean),
      interestedDirections: formData.getAll("interestedDirections").map(String).filter(Boolean),
      researchDirection: String(formData.get("researchDirection") ?? "").trim(),
      supportTypes: formData.getAll("supportTypes").map(String).filter(Boolean),
      supportMethod: String(formData.get("supportMethod") ?? "").trim(),
      openStatus: formData.get("openStatus") === "on",
      contact: String(formData.get("contact") ?? "").trim(),
      avatarPath: String(formData.get("avatarPath") ?? "").trim() || null,
      portfolioUrl: String(formData.get("portfolioUrl") ?? "").trim() || null,
      visibilityStatus,
      updatedByAdminId: adminUser.id,
      createdByAdminId: adminUser.id,
      archivedAt: visibilityStatus === "archived" ? new Date().toISOString() : null,
    });

    revalidateAdminPages();
    revalidatePath("/");
    revalidatePath("/talent");
    revalidatePath("/mentors");
    revalidateTag("talents", "max");
    revalidateTag("mentors", "max");
    return;
  } catch (error) {
    redirect(`/admin/people?error=${encodeURIComponent(error instanceof Error ? error.message : "保存失败")}`);
  }
}

export async function updateAdminPersonVisibilityAction(formData: FormData) {
  try {
    const { adminUser, client } = await requireAdminAction();
    const personId = String(formData.get("personId") ?? "");
    const visibilityStatus = String(formData.get("visibilityStatus") ?? "active") as VisibilityStatus;

    const { error } = await client
      .from("directory_people")
      .update({
        visibility_status: visibilityStatus,
        archived_at: visibilityStatus === "archived" ? new Date().toISOString() : null,
        updated_by_admin_id: adminUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", personId);

    if (error) {
      throw error;
    }

    revalidateAdminPages();
    revalidatePath("/");
    revalidatePath("/talent");
    revalidatePath("/mentors");
    revalidateTag("talents", "max");
    revalidateTag("mentors", "max");
    return;
  } catch (error) {
    redirect(`/admin/people?error=${encodeURIComponent(error instanceof Error ? error.message : "更新失败")}`);
  }
}

export async function saveAdminOpportunityAction(formData: FormData) {
  try {
    await requireAdminAction();
    const opportunityId = String(formData.get("opportunityId") ?? "");
    const payload = {
      title: String(formData.get("title") ?? "").trim(),
      type: String(formData.get("type") ?? "").trim(),
      organization: String(formData.get("organization") ?? "").trim(),
      summary: String(formData.get("summary") ?? "").trim(),
      deadline: String(formData.get("deadline") ?? "").trim(),
      status: String(formData.get("status") ?? "").trim(),
      visibility_status: String(formData.get("visibilityStatus") ?? "active").trim(),
      archived_at: String(formData.get("visibilityStatus") ?? "active").trim() === "archived" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const client = await getWriteClient();
    const { error } = await client.from("opportunities").update(payload).eq("id", opportunityId);
    if (error) {
      throw error;
    }

    revalidateAdminPages();
    revalidatePath("/opportunities");
    revalidateTag("opportunities", "max");
    return;
  } catch (error) {
    redirect(`/admin/opportunities?error=${encodeURIComponent(error instanceof Error ? error.message : "保存失败")}`);
  }
}

export async function updateAdminOpportunityVisibilityAction(formData: FormData) {
  try {
    await requireAdminAction();
    const opportunityId = String(formData.get("opportunityId") ?? "");
    const visibilityStatus = String(formData.get("visibilityStatus") ?? "active").trim();
    const client = await getWriteClient();
    const { error } = await client
      .from("opportunities")
      .update({
        visibility_status: visibilityStatus,
        archived_at: visibilityStatus === "archived" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opportunityId);

    if (error) {
      throw error;
    }

    revalidateAdminPages();
    revalidatePath("/opportunities");
    revalidateTag("opportunities", "max");
    return;
  } catch (error) {
    redirect(`/admin/opportunities?error=${encodeURIComponent(error instanceof Error ? error.message : "更新失败")}`);
  }
}

export async function updateAdminApplicationStatusAction(formData: FormData) {
  try {
    await requireAdminAction();
    const applicationId = String(formData.get("applicationId") ?? "");
    const status = String(formData.get("status") ?? "") as AdminApplicationStatus;
    if (!applicationStatuses.includes(status)) {
      throw new Error("请选择有效的报名状态。");
    }

    const client = await getWriteClient();
    const { error } = await client.from("applications").update({ status }).eq("id", applicationId);
    if (error) {
      throw error;
    }

    revalidateAdminPages();
    revalidatePath("/dashboard");
    return;
  } catch (error) {
    redirect(`/admin/applications?error=${encodeURIComponent(error instanceof Error ? error.message : "更新失败")}`);
  }
}

export async function updateOwnApplicationStatusAction(formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("请先登录后再处理报名。");
    }

    const applicationId = String(formData.get("applicationId") ?? "");
    const opportunityId = String(formData.get("opportunityId") ?? "");
    const status = String(formData.get("status") ?? "") as ApplicationStatus;

    if (!applicationStatuses.includes(status)) {
      throw new Error("请选择有效的报名状态。");
    }

    const client = await getWriteClient();
    const { data: opportunity, error: opportunityError } = await client
      .from("opportunities")
      .select("id, creator_id")
      .eq("id", opportunityId)
      .maybeSingle();

    if (opportunityError || !opportunity) {
      throw new Error("没有找到这条招募。");
    }

    if (String(opportunity.creator_id ?? "") !== currentUser.id) {
      throw new Error("你没有权限处理这条报名。");
    }

    const { error } = await client
      .from("applications")
      .update({ status })
      .eq("id", applicationId)
      .eq("opportunity_id", opportunityId);

    if (error) {
      throw error;
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/opportunities/${opportunityId}`);
    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath("/admin/applications");

    redirect(`/dashboard/opportunities/${opportunityId}?message=${encodeURIComponent("报名状态已更新。")}`);
  } catch (error) {
    const opportunityId = String(formData.get("opportunityId") ?? "");
    const target = opportunityId ? `/dashboard/opportunities/${opportunityId}` : "/dashboard";
    redirect(`${target}?error=${encodeURIComponent(error instanceof Error ? error.message : "更新失败")}`);
  }
}

export async function saveAdminUserAction(formData: FormData) {
  try {
    const { adminUser, client } = await requireAdminAction();
    if (!canManageAdmins(adminUser.role)) {
      throw new Error("只有超级管理员可以管理后台账号。");
    }

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const role = String(formData.get("role") ?? "operator") as AdminRole;
    const authUser = await findAuthUserByEmail(email);
    if (!authUser) {
      throw new Error("这个邮箱还没有注册平台账号，请先让对方登录一次。");
    }

    const { error } = await client.from("admin_users").upsert(
      {
        user_id: authUser.id,
        role,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw error;
    }

    revalidateAdminPages();
    return;
  } catch (error) {
    redirect(`/admin/admin-users?error=${encodeURIComponent(error instanceof Error ? error.message : "保存失败")}`);
  }
}

export async function toggleAdminUserActiveAction(formData: FormData) {
  try {
    const { currentUser, adminUser, client } = await requireAdminAction();
    if (!canManageAdmins(adminUser.role)) {
      throw new Error("只有超级管理员可以管理后台账号。");
    }

    const userId = String(formData.get("userId") ?? "");
    const isActive = formData.get("isActive") === "true";
    if (currentUser.id === userId && !isActive) {
      throw new Error("不能停用当前登录的超级管理员。");
    }

    const { error } = await client
      .from("admin_users")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    revalidateAdminPages();
    return;
  } catch (error) {
    redirect(`/admin/admin-users?error=${encodeURIComponent(error instanceof Error ? error.message : "更新失败")}`);
  }
}
