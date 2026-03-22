import path from "node:path";
import { randomUUID } from "node:crypto";

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type SeededUser = {
  id: string;
  email: string;
  password: string;
};

export function makeTestEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
}

export async function createConfirmedUser(options?: {
  email?: string;
  password?: string;
}): Promise<SeededUser> {
  const email = options?.email ?? makeTestEmail("linpai-user");
  const password = options?.password ?? "Passw0rd!";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(error?.message || "Failed to create confirmed test user");
  }

  return {
    id: data.user.id,
    email,
    password,
  };
}

export async function generateSignupOtp(email: string, password: string) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
  });

  if (error || !data.properties.email_otp) {
    throw new Error(error?.message || "Failed to generate signup OTP");
  }

  return data.properties.email_otp;
}

export async function seedStudentProfile(user: SeededUser, options?: { completed?: boolean }) {
  const completed = options?.completed ?? true;
  const now = new Date().toISOString();

  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    role: "student",
    profile_completed: completed,
    name: "测试学生",
    nickname: "测试学生",
    school: completed ? "兰州交通大学" : null,
    major: completed ? "软件工程" : null,
    grade: completed ? "大三" : null,
    bio: completed ? "自动化测试学生资料" : null,
    skill_tags: completed ? ["前端", "设计"] : [],
    interested_directions: completed ? ["比赛组队"] : [],
    experience: completed ? "参加过项目协作" : null,
    contact: completed ? "平台内联系" : null,
    updated_at: now,
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: studentError } = await admin.from("student_profiles").upsert({
    user_id: user.id,
    school: completed ? "兰州交通大学" : null,
    major: completed ? "软件工程" : null,
    grade: completed ? "大三" : null,
    skills: completed ? ["前端", "设计"] : [],
    intro: completed ? "自动化测试学生资料" : null,
    portfolio: completed ? "https://example.com/student-portfolio" : null,
    target_direction: completed ? "比赛组队" : null,
    contact: completed ? "平台内联系" : null,
    updated_at: now,
  });

  if (studentError && !/relation .*student_profiles.* does not exist/i.test(studentError.message)) {
    throw new Error(studentError.message);
  }

  await admin.from("directory_people").upsert({
    id: user.id,
    auth_user_id: user.id,
    source: "registered",
    role: "student",
    name: "测试学生",
    school: completed ? "兰州交通大学" : null,
    major: completed ? "软件工程" : null,
    grade: completed ? "大三" : null,
    bio: completed ? "自动化测试学生资料" : null,
    skills: completed ? ["前端", "设计"] : [],
    interested_directions: completed ? ["比赛组队"] : [],
    contact: completed ? "平台内联系" : null,
    visibility_status: "active",
  });
}

export async function seedMentorProfile(user: SeededUser, options?: { completed?: boolean }) {
  const completed = options?.completed ?? true;
  const now = new Date().toISOString();

  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    role: "mentor",
    profile_completed: completed,
    name: "测试导师",
    nickname: "测试导师",
    updated_at: now,
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: mentorProfileError } = await admin.from("mentor_profiles").upsert({
    user_id: user.id,
    school: completed ? "兰州交通大学" : null,
    college: completed ? "计算机学院" : null,
    lab: completed ? "AI实验室" : null,
    research_direction: completed ? "AI内容工具" : null,
    support_types: completed ? ["项目指导"] : [],
    support_method: completed ? "周期指导" : null,
    open_status: true,
    intro: completed ? "自动化测试导师资料" : null,
    contact: completed ? "平台内联系" : null,
    application_notes: completed ? "请先说明你的项目方向" : null,
    updated_at: now,
  });

  if (mentorProfileError && !/relation .*mentor_profiles.* does not exist/i.test(mentorProfileError.message)) {
    throw new Error(mentorProfileError.message);
  }

  const { error: legacyMentorError } = await admin.from("mentors").upsert({
    id: user.id,
    user_id: user.id,
    name: "测试导师",
    school: "兰州交通大学",
    college: "计算机学院",
    lab: "AI实验室",
    organization: "兰州交通大学 / AI实验室",
    direction: "AI内容工具",
    direction_tags: ["AI"],
    support_scope: ["项目指导"],
    support_method: "周期指导",
    application_notes: "请先说明你的项目方向",
    contact_mode: "平台内联系",
    is_open: true,
  });

  if (legacyMentorError) {
    throw new Error(legacyMentorError.message);
  }

  await admin.from("directory_people").upsert({
    id: user.id,
    auth_user_id: user.id,
    source: "registered",
    role: "mentor",
    name: "测试导师",
    school: completed ? "兰州交通大学" : null,
    college: completed ? "计算机学院" : null,
    lab: completed ? "AI实验室" : null,
    bio: completed ? "自动化测试导师资料" : null,
    skills: completed ? ["AI"] : [],
    research_direction: completed ? "AI内容工具" : null,
    support_types: completed ? ["项目指导"] : [],
    support_method: completed ? "周期指导" : null,
    open_status: true,
    contact: completed ? "平台内联系" : null,
    visibility_status: "active",
  });
}

export async function grantAdminUser(userId: string, role: "super_admin" | "operator" = "super_admin") {
  const { error } = await admin.from("admin_users").upsert(
    {
      user_id: userId,
      role,
      is_active: true,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function createOpportunity(options: {
  creator: SeededUser;
  creatorRole: "student" | "mentor";
  title?: string;
}) {
  const opportunityId = randomUUID();
  const title = options.title ?? `自动化测试招募-${randomUUID().slice(0, 6)}`;

  const { error: opportunityError } = await admin.from("opportunities").insert({
    id: opportunityId,
    type: options.creatorRole === "student" ? "比赛组队" : "导师支持",
    title,
    summary: "这是自动化测试生成的招募记录。",
    organization: options.creatorRole === "student" ? "兰州交通大学 / 测试队伍" : "兰州交通大学 / AI实验室",
    school_scope: "全国高校",
    deadline: "2030-12-31",
    creator_id: options.creator.id,
    creator_name: options.creatorRole === "student" ? "测试学生" : "测试导师",
    creator_role: options.creatorRole,
    creator_org_name: options.creatorRole === "student" ? "测试队伍" : "AI实验室",
    contact_info: "平台内联系",
    status: "开放申请",
    weekly_hours: "每周 6 小时",
    progress: "测试用招募",
    trial_task: "请附上你的简单介绍",
    preset_tags: ["AI"],
    custom_tags: ["自动化"],
    skill_tags: ["AI"],
    deliverables: ["完成一次自动化回归"],
    project_name: options.creatorRole === "student" ? "自动化测试项目" : null,
    people_needed: options.creatorRole === "student" ? "前端同学" : null,
    research_direction: options.creatorRole === "mentor" ? "AI内容工具" : null,
    target_audience: options.creatorRole === "mentor" ? "对 AI 感兴趣的学生" : null,
    support_method: options.creatorRole === "mentor" ? "周期指导" : null,
  });

  if (opportunityError) {
    throw new Error(opportunityError.message);
  }

  const { error: roleError } = await admin.from("opportunity_roles").insert({
    opportunity_id: opportunityId,
    role_name: "前端同学",
    responsibility: "负责页面实现",
    requirements: "有基础前端能力",
    headcount: 1,
    weekly_hours: "每周 6 小时",
  });

  if (roleError) {
    throw new Error(roleError.message);
  }

  return opportunityId;
}

export async function deleteOpportunity(opportunityId: string) {
  await admin.from("opportunity_roles").delete().eq("opportunity_id", opportunityId);
  await admin.from("applications").delete().eq("opportunity_id", opportunityId);
  await admin.from("opportunities").delete().eq("id", opportunityId);
}

export async function deleteUser(userId: string) {
  await admin.from("admin_users").delete().eq("user_id", userId);
  await admin.from("directory_people").delete().or(`id.eq.${userId},auth_user_id.eq.${userId}`);
  await admin.from("student_profiles").delete().eq("user_id", userId);
  await admin.from("mentor_profiles").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.from("mentors").delete().eq("user_id", userId);
  await admin.auth.admin.deleteUser(userId);
}

export async function deleteUserByEmail(email: string) {
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());

    if (user) {
      await deleteUser(user.id);
      return;
    }

    if (data.users.length < 200) {
      return;
    }

    page += 1;
  }
}

export async function signUpUser(email: string, password: string) {
  const { data, error } = await anon.auth.signUp({ email, password });
  if (error) {
    throw new Error(error.message);
  }

  return data;
}
