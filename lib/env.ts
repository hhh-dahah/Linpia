const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  requireEmailConfirmation: process.env.NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_CONFIRMATION ?? "false",
};

export function hasSupabaseEnv() {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

export function hasServiceRoleEnv() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && hasSupabaseEnv());
}

export function getSupabaseEnv() {
  if (!hasSupabaseEnv()) {
    throw new Error("缺少 Supabase 环境变量，请先配置 .env.local。");
  }

  return {
    url: publicEnv.supabaseUrl as string,
    anonKey: publicEnv.supabaseAnonKey as string,
  };
}

export function getServiceRoleKey() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("缺少 SUPABASE_SERVICE_ROLE_KEY。");
  }

  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getAppUrl() {
  return publicEnv.appUrl;
}

export function isEmailConfirmationRequired() {
  return publicEnv.requireEmailConfirmation !== "false";
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
