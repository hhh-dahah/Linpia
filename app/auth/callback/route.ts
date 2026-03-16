import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";

  if (code && hasSupabaseEnv()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
