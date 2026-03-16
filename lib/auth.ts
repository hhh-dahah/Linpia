import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import type { AccountRole, UserFlowStatus } from "@/types/account";
import { hasServiceRoleEnv, hasSupabaseEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/supabase/admin";
import { createServerSupabaseClient } from "@/supabase/server";

import { getAdminEmails } from "./env";

type UserFlowState = {
  status: UserFlowStatus;
  user: User | null;
  role: AccountRole | null;
  profilePath?: string;
};

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

export function getAccountRole(user?: User | null): AccountRole | null {
  const role = user?.user_metadata?.role;
  return role === "student" || role === "mentor" ? role : null;
}

export function getProfilePath(role: AccountRole) {
  return role === "student" ? "/profile/student" : "/profile/mentor";
}

export function withNext(path: string, nextPath: string) {
  return `${path}?next=${encodeURIComponent(nextPath)}`;
}

export async function getUserFlowState(): Promise<UserFlowState> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "needs_login", user: null, role: null };
  }

  const role = getAccountRole(user);
  if (!role) {
    return { status: "needs_role", user, role: null };
  }

  if (!hasSupabaseEnv()) {
    return { status: "ready", user, role };
  }

  const client = hasServiceRoleEnv()
    ? createAdminSupabaseClient()
    : await createServerSupabaseClient();

  if (role === "student") {
    const { data } = await client.from("profiles").select("id, name").eq("id", user.id).maybeSingle();
    if (!data?.name) {
      return { status: "needs_profile", user, role, profilePath: getProfilePath(role) };
    }
  }

  if (role === "mentor") {
    const { data } = await client
      .from("mentors")
      .select("id, name, organization, direction")
      .eq("id", user.id)
      .maybeSingle();

    if (!data?.name || !data.organization || !data.direction) {
      return { status: "needs_profile", user, role, profilePath: getProfilePath(role) };
    }
  }

  return { status: "ready", user, role };
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

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.toLowerCase());
}

export async function requireUser(nextPath = "/dashboard") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(withNext("/login", nextPath));
  }

  return user;
}
