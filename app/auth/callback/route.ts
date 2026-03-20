import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { resolvePostAuthRedirect } from "@/lib/auth";
import { createServerSupabaseClient } from "@/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = typeof url.searchParams.get("next") === "string" ? url.searchParams.get("next") : "/";

  if (code && hasSupabaseEnv()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const target = next === "/reset-password" ? "/reset-password" : await resolvePostAuthRedirect(next || "/");
  return NextResponse.redirect(new URL(target, url.origin));
}
