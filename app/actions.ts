"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  getCurrentAccountRole,
  getCurrentUser,
  isAdminEmail,
} from "@/lib/auth";
import { hasServiceRoleEnv, hasSupabaseEnv } from "@/lib/env";
import { uploadImage } from "@/lib/storage";
import { createAdminSupabaseClient } from "@/supabase/admin";
import { createServerSupabaseClient } from "@/supabase/server";
import type { ActionState } from "@/types/action";
import { applicationSchema } from "@/validators/application";
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
  return Boolean(
    payload.nickname ||
      payload.school ||
      payload.major ||
      payload.grade ||
      payload.bio ||
      payload.experience ||
      payload.contact ||
      payload.direction ||
      payload.supportMethod ||
      payload.organization ||
      (payload.supportScope?.length ?? 0) > 0,
  );
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
    const { error } = await client.from("profiles").upsert({
      id: user.id,
      role,
      nickname: user.email?.split("@")[0] || null,
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
      skill_tags: parsed.data.skillTags,
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
        skill_tags: parsed.data.skillTags,
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

    const studentProfileResult = await client.from("student_profiles").upsert({
      user_id: user.id,
      school: parsed.data.school || null,
      major: parsed.data.major || null,
      grade: parsed.data.grade || null,
      skills: parsed.data.skillTags,
      intro: parsed.data.bio || null,
      portfolio: parsed.data.portfolioExternalUrl || null,
      target_direction: parsed.data.interestedDirections.join("、") || null,
      contact: parsed.data.contact || null,
    });

    if (
      studentProfileResult.error &&
      !/relation .*student_profiles.* does not exist/i.test(studentProfileResult.error.message)
    ) {
      return { status: "error", message: "学生资料保存失败，请稍后再试。" };
    }

    await syncLegacyUserRole(user.id, "student");

    revalidatePath("/profile");
    revalidatePath("/profile/student");
    revalidatePath("/dashboard");
    revalidatePath("/talent");

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
      nickname: parsed.data.name,
      profile_completed: profileCompleted,
      updated_at: new Date().toISOString(),
    });

    if (profileResult.error && /column .*role|column .*profile_completed/i.test(profileResult.error.message)) {
      profileResult = await client.from("profiles").upsert({
        id: user.id,
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

    await syncLegacyUserRole(user.id, "mentor");

    revalidatePath("/profile");
    revalidatePath("/profile/mentor");
    revalidatePath("/dashboard");
    revalidatePath("/talent");
    revalidatePath("/mentors");

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
  const roles = formData.getAll("roleName").map((roleName, index) => ({
    roleName: String(roleName ?? ""),
    responsibility: String(formData.getAll("roleResponsibility")[index] ?? ""),
    requirements: String(formData.getAll("roleRequirements")[index] ?? ""),
    headcount: Number(formData.getAll("roleHeadcount")[index] ?? 1),
    weeklyHours: String(formData.getAll("roleWeeklyHours")[index] ?? ""),
  }));

  const payload =
    role === "mentor"
      ? {
          role: "mentor" as const,
          type: String(formData.get("type") ?? ""),
          title: String(formData.get("title") ?? ""),
          organization: String(formData.get("organization") ?? ""),
          summary: String(formData.get("summary") ?? ""),
          deadline: String(formData.get("deadline") ?? ""),
          weeklyHours: String(formData.get("weeklyHours") ?? ""),
          applicationRequirement: String(formData.get("applicationRequirement") ?? ""),
          contactInfo: String(formData.get("contactInfo") ?? ""),
          feishuUrl: String(formData.get("feishuUrl") ?? ""),
          presetTags: formData.getAll("presetTags").map(String),
          customTags: formData.getAll("customTags").map(String),
          roles,
          cover: formData.get("cover"),
          researchDirection: String(formData.get("researchDirection") ?? ""),
          targetAudience: String(formData.get("targetAudience") ?? ""),
          supportMethod: String(formData.get("supportMethod") ?? ""),
        }
      : {
          role: "student" as const,
          type: String(formData.get("type") ?? ""),
          title: String(formData.get("title") ?? ""),
          organization: String(formData.get("organization") ?? ""),
          summary: String(formData.get("summary") ?? ""),
          deadline: String(formData.get("deadline") ?? ""),
          weeklyHours: String(formData.get("weeklyHours") ?? ""),
          applicationRequirement: String(formData.get("applicationRequirement") ?? ""),
          contactInfo: String(formData.get("contactInfo") ?? ""),
          feishuUrl: String(formData.get("feishuUrl") ?? ""),
          presetTags: formData.getAll("presetTags").map(String),
          customTags: formData.getAll("customTags").map(String),
          roles,
          cover: formData.get("cover"),
          projectName: String(formData.get("projectName") ?? ""),
          peopleNeeded: String(formData.get("peopleNeeded") ?? ""),
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
    const progress =
      parsed.data.role === "student"
        ? `项目 / 比赛名称：${parsed.data.projectName}\n需要什么人：${parsed.data.peopleNeeded}`
        : `研究 / 指导方向：${parsed.data.researchDirection}\n面向对象：${parsed.data.targetAudience}\n支持方式：${parsed.data.supportMethod}`;
    const supplementaryItems =
      parsed.data.role === "student"
        ? [
            `项目 / 比赛名称：${parsed.data.projectName}`,
            `需要什么人：${parsed.data.peopleNeeded}`,
            `联系说明：${parsed.data.contactInfo}`,
          ]
        : [
            `面向对象：${parsed.data.targetAudience}`,
            `支持方式：${parsed.data.supportMethod}`,
            `联系说明：${parsed.data.contactInfo}`,
          ];

    const creatorName = user.email?.split("@")[0] || "邻派用户";
    const insertResult = await client.from("opportunities").insert({
      id: opportunityId,
      type: parsed.data.type,
      title: parsed.data.title,
      summary: parsed.data.summary,
      organization: parsed.data.organization,
      school_scope: parsed.data.organization,
      deadline: parsed.data.deadline,
      creator_id: user.id,
      creator_name: creatorName,
      creator_role: parsed.data.role,
      creator_org_name: parsed.data.organization,
      contact_info: parsed.data.contactInfo,
      cover_path: coverPath,
      feishu_url: parsed.data.feishuUrl || null,
      status: "开放申请",
      weekly_hours: parsed.data.weeklyHours,
      progress,
      trial_task: parsed.data.applicationRequirement || null,
      skill_tags: tags,
      preset_tags: parsed.data.presetTags,
      custom_tags: parsed.data.customTags,
      deliverables: supplementaryItems,
      project_name: parsed.data.role === "student" ? parsed.data.projectName : null,
      people_needed: parsed.data.role === "student" ? parsed.data.peopleNeeded : null,
      research_direction: parsed.data.role === "mentor" ? parsed.data.researchDirection : null,
      target_audience: parsed.data.role === "mentor" ? parsed.data.targetAudience : null,
      support_method: parsed.data.role === "mentor" ? parsed.data.supportMethod : null,
      applicant_count: 0,
    });

    if (insertResult.error) {
      return { status: "error", message: "招募发布失败，请稍后再试。" };
    }

    const rolesPayload = parsed.data.roles.map((item) => ({
      opportunity_id: opportunityId,
      role_name: item.roleName,
      responsibility: item.responsibility,
      requirements: item.requirements,
      headcount: item.headcount,
      weekly_hours: item.weeklyHours,
    }));

    const { error: rolesError } = await client.from("opportunity_roles").insert(rolesPayload);
    if (rolesError) {
      return { status: "error", message: "招募已创建，但角色信息保存失败，请稍后再试。" };
    }

    revalidatePath("/opportunities");
    revalidatePath("/publish");
    revalidatePath("/dashboard");

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
    note: String(formData.get("note") ?? ""),
    trialTaskUrl: String(formData.get("trialTaskUrl") ?? ""),
  };

  const parsed = applicationSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: "报名信息还有几项没填好，请按提示补充。",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

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
      .select("title")
      .eq("id", parsed.data.opportunityId)
      .maybeSingle();

    const { error } = await client.from("applications").upsert({
      opportunity_id: parsed.data.opportunityId,
      applicant_id: user.id,
      note: parsed.data.note,
      trial_task_url: parsed.data.trialTaskUrl || null,
      status: "待查看",
      opportunity_title: opportunity?.title ?? "未命名招募",
    });

    if (error) {
      return { status: "error", message: "报名提交失败，请稍后再试。" };
    }

    revalidatePath("/dashboard");

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
    return { status: "success", message: "案例已录入。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "案例录入失败，请稍后再试。",
    };
  }
}
