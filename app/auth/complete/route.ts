import { NextResponse } from "next/server";

import { resolvePostAuthRedirect } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/";
  const target = await resolvePostAuthRedirect(next);
  return NextResponse.redirect(new URL(target, url.origin));
}
