import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import type { AccountRole, DisplayIdentity, UserFlowStatus } from "@/types/account";
import { getAdminEmails, hasServiceRoleEnv, hasSupabaseEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/supabase/admin";
import { createServerSupabaseClient } from "@/supabase/server";

type ProfileRow = {
  id: string;
  role: string | null;
  nickname: string | null;
  name?: string | null;
  profile_completed: boolean | null;
};

type StudentProfileRow = {
  user_id: string;
  school: string | null;
  major: string | null;
  grade: string | null;
  skills: string[] | null;
  intro: string | null;
  portfolio: string | null;
  target_direction: string | null;
  contact: string | null;
};

type MentorProfileRow = {
  user_id: string;
  school: string | null;
  college: string | null;
  lab: string | null;
  research_direction: string | null;
  support_types: string[] | null;
  support_method: string | null;
  open_status: boolean | null;
  intro: string | null;
  contact: string | null;
  application_notes: string | null;
};

export type UserFlowState = {
  status: UserFlowStatus;
  user: User | null;
  role: AccountRole | null;
  profilePath?: string;
};

function parseAccountRole(value: unknown): AccountRole | null {
  return value === "student" || value === "mentor" ? value : null;
}

function sanitizeNextPath(nextPath?: string | null) {
  if (!nextPath || typeof nextPath !== "string") {
    return "/";
  }

  if (!nextPath.startsWith("/")) {
    return "/";
  }

  return nextPath;
}

function getEmailName(email?: string | null) {
  if (!email) {
    return "个人资料";
  }

  return email.split("@")[0] || "个人资料";
}

async function getReadClient() {
  if (hasServiceRoleEnv()) {
    return createAdminSupabaseClient();
  }

  return createServerSupabaseClient();
}

async function getProfileRow(userId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    const client = await getReadClient();
    const { data } = await client
      .from("profiles")
      .select("id, role, nickname, name, profile_completed")
      .eq("id", userId)
      .maybeSingle();

    return (data as ProfileRow | null) ?? null;
  } catch {
    return null;
  }
}

async function getStudentProfileCompletion(userId: string) {
  if (!hasSupabaseEnv()) {
    return false;
  }

  try {
    const client = await getReadClient();
    const { data } = await client
      .from("student_profiles")
      .select("user_id, school, major, grade, skills, intro, portfolio, target_direction, contact")
      .eq("user_id", userId)
      .maybeSingle();

    const student = data as StudentProfileRow | null;
    if (student) {
      return Boolean(
        student.school ||
          student.major ||
          student.grade ||
          student.intro ||
          student.portfolio ||
          student.target_direction ||
          student.contact ||
          (student.skills?.length ?? 0) > 0,
      );
    }
  } catch {
    // fall through to legacy compatibility
  }

  try {
    const client = await getReadClient();
    const { data } = await client
      .from("profiles")
      .select(
        "id, name, school, major, grade, bio, skill_tags, interested_directions, time_commitment, portfolio_external_url, experience, contact",
      )
      .eq("id", userId)
      .maybeSingle();

    const profile = data as Record<string, unknown> | null;
    return Boolean(
      profile?.name ||
        profile?.school ||
        profile?.major ||
        profile?.grade ||
        profile?.bio ||
        profile?.portfolio_external_url ||
        profile?.experience ||
        profile?.contact ||
        (Array.isArray(profile?.skill_tags) && (profile?.skill_tags as unknown[]).length > 0),
    );
  } catch {
    return false;
  }
}

async function getMentorProfileCompletion(userId: string) {
  if (!hasSupabaseEnv()) {
    return false;
  }

  try {
    const client = await getReadClient();
    const { data } = await client
      .from("mentor_profiles")
      .select(
        "user_id, school, college, lab, research_direction, support_types, support_method, open_status, intro, contact, application_notes",
      )
      .eq("user_id", userId)
      .maybeSingle();

    const mentor = data as MentorProfileRow | null;
    if (mentor) {
      return Boolean(
        mentor.school ||
          mentor.college ||
          mentor.lab ||
          mentor.research_direction ||
          mentor.support_method ||
          mentor.intro ||
          mentor.contact ||
          mentor.application_notes ||
          (mentor.support_types?.length ?? 0) > 0,
      );
    }
  } catch {
    // fall through to legacy compatibility
  }

  try {
    const client = await getReadClient();
    let query = await client
      .from("mentors")
      .select("id, user_id, name, organization, direction, support_scope, support_method, contact_mode")
      .eq("user_id", userId)
      .maybeSingle();

    if (query.error) {
      query = await client
        .from("mentors")
        .select("id, user_id, name, organization, direction, support_scope, support_method, contact_mode")
        .eq("id", userId)
        .maybeSingle();
    }

    const mentor = query.data as Record<string, unknown> | null;

    return Boolean(
      mentor?.name ||
        mentor?.organization ||
        mentor?.direction ||
        mentor?.support_method ||
        mentor?.contact_mode ||
        (Array.isArray(mentor?.support_scope) && (mentor?.support_scope as unknown[]).length > 0),
    );
  } catch {
    return false;
  }
}

export async function getCurrentUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export function getAccountRole(user?: User | null, profileRole?: unknown): AccountRole | null {
  return parseAccountRole(profileRole) ?? parseAccountRole(user?.user_metadata?.role);
}

export function getProfilePath(role: AccountRole) {
  return role === "student" ? "/profile/student" : "/profile/mentor";
}

export function withNext(path: string, nextPath: string) {
  return `${path}?next=${encodeURIComponent(sanitizeNextPath(nextPath))}`;
}

export async function getCurrentAccountRole(user?: User | null) {
  const currentUser = user ?? (await getCurrentUser());
  if (!currentUser) {
    return null;
  }

  const profile = await getProfileRow(currentUser.id);
  return getAccountRole(currentUser, profile?.role);
}

export async function getProfileCompletionState(userId: string, role: AccountRole) {
  const profile = await getProfileRow(userId);

  if (profile?.profile_completed) {
    return {
      role,
      completed: true,
      profilePath: getProfilePath(role),
    };
  }

  const completed =
    role === "student"
      ? await getStudentProfileCompletion(userId)
      : await getMentorProfileCompletion(userId);

  return {
    role,
    completed,
    profilePath: getProfilePath(role),
  };
}

export async function getUserFlowState(): Promise<UserFlowState> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "needs_login", user: null, role: null };
  }

  const profile = await getProfileRow(user.id);
  const role = getAccountRole(user, profile?.role);

  if (!role) {
    return { status: "needs_role", user, role: null };
  }

  const completion = await getProfileCompletionState(user.id, role);

  if (!completion.completed) {
    return {
      status: "needs_profile",
      user,
      role,
      profilePath: completion.profilePath,
    };
  }

  return { status: "ready", user, role };
}

export async function resolvePostAuthRedirect(nextPath = "/") {
  const normalizedNext = sanitizeNextPath(nextPath);

  if (normalizedNext.startsWith("/reset-password")) {
    return normalizedNext;
  }

  const flow = await getUserFlowState();

  if (flow.status === "needs_login") {
    return withNext("/login", normalizedNext);
  }

  if (flow.status === "needs_role") {
    return withNext("/onboarding/role", normalizedNext);
  }

  if (flow.status === "needs_profile" && flow.profilePath) {
    return withNext(flow.profilePath, normalizedNext);
  }

  return normalizedNext;
}

export function redirectForUserFlow(flow: UserFlowState, nextPath: string) {
  if (flow.status === "needs_login") {
    redirect(withNext("/login", nextPath));
  }

  if (flow.status === "needs_role") {
    redirect(withNext("/onboarding/role", nextPath));
  }

  if (flow.status === "needs_profile" && flow.profilePath) {
    redirect(withNext(flow.profilePath, nextPath));
  }
}

export async function getDisplayIdentity(user?: User | null): Promise<DisplayIdentity | null> {
  const currentUser = user ?? (await getCurrentUser());
  if (!currentUser) {
    return null;
  }

  const profile = await getProfileRow(currentUser.id);
  const nickname = profile?.nickname?.trim() || profile?.name?.trim() || getEmailName(currentUser.email);

  return {
    label: nickname || "个人资料",
    nickname: nickname || null,
    role: getAccountRole(currentUser, profile?.role),
  };
}

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.toLowerCase());
}

export async function requireUser(nextPath = "/") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(withNext("/login", nextPath));
  }

  return user;
}
