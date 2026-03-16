"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getAppUrl, hasServiceRoleEnv, hasSupabaseEnv } from "@/lib/env";
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
    throw new Error("当前尚未配置 Supabase 环境变量，请先补齐 .env.local");
  }

  return createServerSupabaseClient();
}

export async function logoutAction() {
  if (hasSupabaseEnv()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return offlineState("当前是离线演示模式，请先配置 Supabase 环境变量后再测试登录");
  }

  const email = String(formData.get("email") ?? "").trim();
  const nextPath = String(formData.get("next") ?? "/dashboard");

  if (!email || !email.includes("@")) {
    return {
      status: "error",
      message: "请输入有效邮箱地址",
      fieldErrors: {
        email: ["请输入有效邮箱地址"],
      },
    };
  }

  try {
    const supabase = await requireConfiguredSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    return { status: "success", message: "登录链接已发送到你的邮箱，请在同一设备完成验证" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "发送登录链接失败",
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
    avatar: formData.get("avatar"),
    portfolioCover: formData.get("portfolioCover"),
  };

  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: "请先修正资料表单中的问题",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (!hasSupabaseEnv()) {
    return offlineState("资料校验已通过。配置 Supabase 后即可保存到真实数据库。");
  }

  try {
    const supabase = await requireConfiguredSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return offlineState("请先登录后再保存人才卡");
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

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      name: parsed.data.name,
      school: parsed.data.school,
      major: parsed.data.major,
      grade: parsed.data.grade,
      bio: parsed.data.bio,
      skill_tags: parsed.data.skillTags,
      interested_directions: parsed.data.interestedDirections,
      time_commitment: parsed.data.timeCommitment,
      portfolio_external_url: parsed.data.portfolioExternalUrl || null,
      avatar_path: avatarPath,
      portfolio_cover_path: portfolioCoverPath,
      achievements: [],
      contact_hint: "登录后可查看完整资料并进一步联系",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/talent");

    return { status: "success", message: "人才卡已保存" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "保存人才卡失败",
    };
  }
}

export async function publishOpportunityAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const roles = formData.getAll("roleName").map((roleName, index) => ({
    roleName: String(roleName ?? ""),
    responsibility: String(formData.getAll("roleResponsibility")[index] ?? ""),
    requirements: String(formData.getAll("roleRequirements")[index] ?? ""),
    headcount: Number(formData.getAll("roleHeadcount")[index] ?? 1),
    weeklyHours: String(formData.getAll("roleWeeklyHours")[index] ?? ""),
  }));

  const deliverables = formData
    .getAll("deliverables")
    .map(String)
    .map((item) => item.trim())
    .filter(Boolean);

  const payload = {
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    schoolScope: String(formData.get("schoolScope") ?? ""),
    deadline: String(formData.get("deadline") ?? ""),
    weeklyHours: String(formData.get("weeklyHours") ?? ""),
    progress: String(formData.get("progress") ?? ""),
    trialTask: String(formData.get("trialTask") ?? ""),
    feishuUrl: String(formData.get("feishuUrl") ?? ""),
    skillTags: formData.getAll("skillTags").map(String),
    deliverables,
    roles,
    cover: formData.get("cover"),
  };

  const parsed = opportunitySchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: "发布表单还有必填项未完成",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (!hasSupabaseEnv()) {
    return offlineState("机会表单校验已通过。配置 Supabase 后即可正式发布。");
  }

  try {
    const supabase = await requireConfiguredSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return offlineState("请先登录后再发布机会");
    }

    const opportunityId = crypto.randomUUID();
    const coverPath = await uploadImage({
      supabase,
      bucket: "opportunity-covers",
      folder: "opportunity-covers",
      file: parsed.data.cover,
      ownerId: opportunityId,
    });

    const { error } = await supabase.from("opportunities").insert({
      id: opportunityId,
      type: parsed.data.type,
      title: parsed.data.title,
      summary: parsed.data.summary,
      school_scope: parsed.data.schoolScope,
      deadline: parsed.data.deadline,
      creator_id: user.id,
      creator_name: user.email || "项目发起人",
      cover_path: coverPath,
      feishu_url: parsed.data.feishuUrl || null,
      status: "开放报名",
      weekly_hours: parsed.data.weeklyHours,
      progress: parsed.data.progress,
      trial_task: parsed.data.trialTask,
      skill_tags: parsed.data.skillTags,
      deliverables: parsed.data.deliverables,
      applicant_count: 0,
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    const rolesPayload = parsed.data.roles.map((role) => ({
      opportunity_id: opportunityId,
      role_name: role.roleName,
      responsibility: role.responsibility,
      requirements: role.requirements,
      headcount: role.headcount,
      weekly_hours: role.weeklyHours,
    }));

    const { error: rolesError } = await supabase.from("opportunity_roles").insert(rolesPayload);
    if (rolesError) {
      return { status: "error", message: rolesError.message };
    }

    revalidatePath("/opportunities");
    revalidatePath("/dashboard");

    return { status: "success", message: "机会已发布" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "发布失败",
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
      message: "报名信息还不完整",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (!hasSupabaseEnv()) {
    return offlineState("报名内容已校验通过。配置 Supabase 后即可写入报名记录。");
  }

  try {
    const supabase = await requireConfiguredSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return offlineState("请先登录后再报名");
    }

    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("title")
      .eq("id", parsed.data.opportunityId)
      .maybeSingle();

    const { error } = await supabase.from("applications").upsert({
      opportunity_id: parsed.data.opportunityId,
      applicant_id: user.id,
      note: parsed.data.note,
      trial_task_url: parsed.data.trialTaskUrl || null,
      status: "待查看",
      opportunity_title: opportunity?.title ?? "未命名机会",
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    revalidatePath("/dashboard");

    return { status: "success", message: "报名已提交，请等待项目方查看" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "报名失败",
    };
  }
}

export async function saveMentorAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const payload = {
    name: String(formData.get("name") ?? ""),
    organization: String(formData.get("organization") ?? ""),
    direction: String(formData.get("direction") ?? ""),
    directionTags: formData.getAll("directionTags").map(String).filter(Boolean),
    supportScope: formData.getAll("supportScope").map(String).filter(Boolean),
    contactMode: String(formData.get("contactMode") ?? ""),
    avatarPath: String(formData.get("avatarPath") ?? ""),
    isOpen: formData.get("isOpen") === "on",
  };

  const parsed = mentorSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: "导师表单还有未完成项",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || !isAdminEmail(currentUser.email)) {
    return offlineState("只有管理员白名单邮箱可以录入导师");
  }

  if (!hasServiceRoleEnv()) {
    return offlineState("请先配置 SUPABASE_SERVICE_ROLE_KEY 后再进行后台录入");
  }

  try {
    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("mentors").insert({
      name: parsed.data.name,
      organization: parsed.data.organization,
      direction: parsed.data.direction,
      direction_tags: parsed.data.directionTags,
      support_scope: parsed.data.supportScope,
      contact_mode: parsed.data.contactMode,
      avatar_path: parsed.data.avatarPath || null,
      is_open: parsed.data.isOpen,
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    revalidatePath("/mentors");
    revalidatePath("/dashboard/admin");
    return { status: "success", message: "导师资料已录入" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "导师录入失败",
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
      message: "案例表单还有未完成项",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || !isAdminEmail(currentUser.email)) {
    return offlineState("只有管理员白名单邮箱可以录入案例");
  }

  if (!hasServiceRoleEnv()) {
    return offlineState("请先配置 SUPABASE_SERVICE_ROLE_KEY 后再进行后台录入");
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
      return { status: "error", message: error.message };
    }

    revalidatePath("/cases");
    revalidatePath("/dashboard/admin");
    return { status: "success", message: "案例已录入" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "案例录入失败",
    };
  }
}
