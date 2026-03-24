import Link from "next/link";

import { hasServiceRoleEnv, hasSupabaseEnv } from "@/lib/env";

export function SetupBanner() {
  const hasPublicEnv = hasSupabaseEnv();
  const hasAdminEnv = hasServiceRoleEnv();

  if (hasPublicEnv && hasAdminEnv) {
    return null;
  }

  return (
    <div className="relative border-y border-line bg-[rgba(255,255,255,0.64)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-sm text-muted sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>
          褰撳墠鏄绾挎紨绀烘ā寮忥細娴忚椤典細浼樺厛灞曠ず Mock 鏁版嵁锛涚櫥褰曘€佸彂甯冨拰鍚庡彴褰曞叆闇€瑕佽ˉ榻?          <span className="mx-1 font-mono">.env.local</span>
          閲岀殑 Supabase 閰嶇疆銆?        </p>
        <Link href="/login" className="ui-link font-semibold text-primary">
          閰嶅ソ鍚庡幓娴嬭瘯鐧诲綍
        </Link>
      </div>
    </div>
  );
}

