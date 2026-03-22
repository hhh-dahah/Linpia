import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getAdminEmails, hasServiceRoleEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/supabase/admin";
import type { AdminRole, AdminUser } from "@/types/admin";

type AdminUserRow = {
  id: string;
  user_id: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function normalizeAdminUser(row: AdminUserRow, email: string): AdminUser {
  return {
    id: row.id,
    userId: row.user_id,
    email,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCurrentAdminUser() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (!hasServiceRoleEnv()) {
    const isBootstrapAdmin = getAdminEmails().includes((user.email || "").toLowerCase());
    if (!isBootstrapAdmin) {
      return null;
    }

    return {
      id: `env-${user.id}`,
      userId: user.id,
      email: user.email || "",
      role: "super_admin" as const,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    };
  }

  const admin = createAdminSupabaseClient();
  const normalizedEmail = (user.email || "").toLowerCase();
  const bootstrapEmails = getAdminEmails();

  if (bootstrapEmails.includes(normalizedEmail)) {
    const { data: existing } = await admin
      .from("admin_users")
      .select("id, user_id, role, is_active, created_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await admin.from("admin_users").insert({
        user_id: user.id,
        role: "super_admin",
        is_active: true,
      });
    }
  }

  const { data } = await admin
    .from("admin_users")
    .select("id, user_id, role, is_active, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data || !(data as AdminUserRow).is_active) {
    return null;
  }

  return normalizeAdminUser(data as AdminUserRow, user.email || "");
}

export async function requireAdminAccess(nextPath = "/admin") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const adminUser = await getCurrentAdminUser();
  if (!adminUser) {
    return { user, adminUser: null };
  }

  return { user, adminUser };
}

export function canManageAdmins(role?: AdminRole | null) {
  return role === "super_admin";
}
