import { hasServiceRoleEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/supabase/admin";
import type {
  AdminApplication,
  AdminApplicationStatus,
  AdminDashboardSnapshot,
  AdminOpportunity,
  AdminUser,
  DirectoryPerson,
} from "@/types/admin";
import type { AccountRole } from "@/types/account";

function requireAdminClient() {
  if (!hasServiceRoleEnv()) {
    throw new Error("缺少 SUPABASE_SERVICE_ROLE_KEY，后台管理能力暂不可用。");
  }

  return createAdminSupabaseClient();
}

function normalizeTextArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function normalizeDirectoryPerson(row: Record<string, unknown>): DirectoryPerson {
  return {
    id: String(row.id),
    authUserId: (row.auth_user_id as string | null) ?? null,
    source: (row.source as DirectoryPerson["source"]) ?? "managed",
    role: (row.role as AccountRole) ?? "student",
    name: String(row.name ?? ""),
    school: String(row.school ?? ""),
    major: String(row.major ?? ""),
    grade: String(row.grade ?? ""),
    college: String(row.college ?? ""),
    lab: String(row.lab ?? ""),
    bio: String(row.bio ?? ""),
    skills: normalizeTextArray(row.skills),
    interestedDirections: normalizeTextArray(row.interested_directions),
    researchDirection: String(row.research_direction ?? ""),
    supportTypes: normalizeTextArray(row.support_types),
    supportMethod: String(row.support_method ?? ""),
    openStatus: Boolean(row.open_status ?? false),
    contact: String(row.contact ?? ""),
    avatarPath: (row.avatar_path as string | null) ?? null,
    portfolioUrl: (row.portfolio_url as string | null) ?? null,
    visibilityStatus: (row.visibility_status as DirectoryPerson["visibilityStatus"]) ?? "active",
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    archivedAt: (row.archived_at as string | null) ?? null,
  };
}

function normalizeAdminOpportunity(row: Record<string, unknown>): AdminOpportunity {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    type: String(row.type ?? "") as AdminOpportunity["type"],
    status: String(row.status ?? "") as AdminOpportunity["status"],
    visibilityStatus: String(row.visibility_status ?? "active") as AdminOpportunity["visibilityStatus"],
    creatorRole: (row.creator_role as AccountRole) ?? "student",
    creatorName: String(row.creator_name ?? ""),
    organization: String(row.organization ?? row.creator_org_name ?? ""),
    applicantCount: Number(row.applicant_count ?? 0),
    deadline: String(row.deadline ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

function normalizeAdminApplication(
  row: Record<string, unknown>,
  applicant?: Record<string, unknown> | null,
): AdminApplication {
  return {
    id: String(row.id),
    opportunityId: String(row.opportunity_id ?? ""),
    opportunityTitle: String(row.opportunity_title ?? ""),
    applicantId: String(row.applicant_id ?? ""),
    applicantName: String(applicant?.nickname ?? applicant?.name ?? applicant?.email ?? "未命名用户"),
    applicantRole: (applicant?.role as AccountRole | null) ?? null,
    note: String(row.note ?? ""),
    trialTaskUrl: String(row.trial_task_url ?? ""),
    status: (row.status as AdminApplicationStatus) ?? "待查看",
    createdAt: String(row.created_at ?? ""),
  };
}

async function listAuthUsersMapById() {
  const admin = requireAdminClient();
  const userMap = new Map<string, { email: string }>();
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(error.message);
    }

    data.users.forEach((user) => {
      userMap.set(user.id, { email: user.email || "" });
    });

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return userMap;
}

export async function findAuthUserByEmail(email: string) {
  const admin = requireAdminClient();
  const normalized = email.trim().toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(error.message);
    }

    const match = data.users.find((user) => (user.email || "").toLowerCase() === normalized);
    if (match) {
      return match;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const admin = requireAdminClient();

  const [
    { count: peopleCount },
    { count: activeOpportunityCount },
    { data: recentPeople },
    { data: recentOpportunities },
    { data: recentApplications },
  ] = await Promise.all([
    admin.from("directory_people").select("id", { count: "exact", head: true }),
    admin.from("opportunities").select("id", { count: "exact", head: true }).eq("visibility_status", "active"),
    admin.from("directory_people").select("*").order("updated_at", { ascending: false }).limit(5),
    admin.from("opportunities").select("*").order("created_at", { ascending: false }).limit(5),
    admin.from("applications").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const pendingApplicationCount =
    (
      await admin
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "待查看")
    ).count ?? 0;

  const applicantIds = (recentApplications ?? []).map((item) => String(item.applicant_id));
  const { data: applicants } = applicantIds.length
    ? await admin.from("profiles").select("id, name, nickname, role").in("id", applicantIds)
    : { data: [] as Record<string, unknown>[] };
  const applicantMap = new Map((applicants ?? []).map((item) => [String(item.id), item]));

  return {
    peopleCount: peopleCount ?? 0,
    activeOpportunityCount: activeOpportunityCount ?? 0,
    pendingApplicationCount,
    recentPeople: (recentPeople ?? []).map((item) => normalizeDirectoryPerson(item as Record<string, unknown>)),
    recentOpportunities: (recentOpportunities ?? []).map((item) =>
      normalizeAdminOpportunity(item as Record<string, unknown>),
    ),
    recentApplications: (recentApplications ?? []).map((item) =>
      normalizeAdminApplication(
        item as Record<string, unknown>,
        applicantMap.get(String((item as Record<string, unknown>).applicant_id)) ?? null,
      ),
    ),
  };
}

export async function listDirectoryPeopleAdmin(filters: {
  role?: string;
  query?: string;
  visibilityStatus?: string;
} = {}) {
  const admin = requireAdminClient();
  let request = admin.from("directory_people").select("*").order("updated_at", { ascending: false });

  if (filters.role === "student" || filters.role === "mentor") {
    request = request.eq("role", filters.role);
  }

  if (filters.visibilityStatus === "active" || filters.visibilityStatus === "hidden" || filters.visibilityStatus === "archived") {
    request = request.eq("visibility_status", filters.visibilityStatus);
  }

  if (filters.query?.trim()) {
    const pattern = `%${filters.query.trim()}%`;
    request = request.or(
      `name.ilike.${pattern},school.ilike.${pattern},major.ilike.${pattern},college.ilike.${pattern},lab.ilike.${pattern},research_direction.ilike.${pattern},bio.ilike.${pattern}`,
    );
  }

  const { data, error } = await request;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => normalizeDirectoryPerson(item as Record<string, unknown>));
}

export async function getDirectoryPersonAdminById(id: string) {
  const admin = requireAdminClient();
  const { data, error } = await admin.from("directory_people").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? normalizeDirectoryPerson(data as Record<string, unknown>) : null;
}

export async function listAdminOpportunities(filters: {
  status?: string;
  visibilityStatus?: string;
  creatorRole?: string;
  query?: string;
} = {}) {
  const admin = requireAdminClient();
  let request = admin.from("opportunities").select("*").order("created_at", { ascending: false });

  if (filters.status) {
    request = request.eq("status", filters.status);
  }

  if (filters.visibilityStatus === "active" || filters.visibilityStatus === "hidden" || filters.visibilityStatus === "archived") {
    request = request.eq("visibility_status", filters.visibilityStatus);
  }

  if (filters.creatorRole === "student" || filters.creatorRole === "mentor") {
    request = request.eq("creator_role", filters.creatorRole);
  }

  if (filters.query?.trim()) {
    const pattern = `%${filters.query.trim()}%`;
    request = request.or(`title.ilike.${pattern},organization.ilike.${pattern},creator_name.ilike.${pattern}`);
  }

  const { data, error } = await request;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => normalizeAdminOpportunity(item as Record<string, unknown>));
}

export async function getAdminOpportunityById(id: string) {
  const admin = requireAdminClient();
  const { data, error } = await admin.from("opportunities").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? normalizeAdminOpportunity(data as Record<string, unknown>) : null;
}

export async function listAdminApplications(filters: {
  status?: string;
  opportunityId?: string;
  query?: string;
} = {}) {
  const admin = requireAdminClient();
  let request = admin.from("applications").select("*").order("created_at", { ascending: false });

  if (filters.status) {
    request = request.eq("status", filters.status);
  }

  if (filters.opportunityId) {
    request = request.eq("opportunity_id", filters.opportunityId);
  }

  if (filters.query?.trim()) {
    const pattern = `%${filters.query.trim()}%`;
    request = request.or(`opportunity_title.ilike.${pattern},note.ilike.${pattern}`);
  }

  const { data, error } = await request;
  if (error) {
    throw new Error(error.message);
  }

  const applicantIds = (data ?? []).map((item) => String(item.applicant_id));
  const { data: applicants } = applicantIds.length
    ? await admin.from("profiles").select("id, name, nickname, role").in("id", applicantIds)
    : { data: [] as Record<string, unknown>[] };

  const applicantMap = new Map((applicants ?? []).map((item) => [String(item.id), item]));

  return (data ?? []).map((item) =>
    normalizeAdminApplication(
      item as Record<string, unknown>,
      applicantMap.get(String((item as Record<string, unknown>).applicant_id)) ?? null,
    ),
  );
}

export async function listAdminUsers() {
  const admin = requireAdminClient();
  const [userMap, { data, error }] = await Promise.all([
    listAuthUsersMapById(),
    admin.from("admin_users").select("*").order("created_at", { ascending: true }),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => {
    const row = item as AdminUserRow;
    return {
      id: row.id,
      userId: row.user_id,
      email: userMap.get(row.user_id)?.email ?? "",
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } satisfies AdminUser;
  });
}

type AdminUserRow = {
  id: string;
  user_id: string;
  role: AdminUser["role"];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
