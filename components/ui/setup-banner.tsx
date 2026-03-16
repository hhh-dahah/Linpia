import Link from "next/link";

import { hasServiceRoleEnv, hasSupabaseEnv } from "@/lib/env";

export function SetupBanner() {
  const hasPublicEnv = hasSupabaseEnv();
  const hasAdminEnv = hasServiceRoleEnv();

  if (hasPublicEnv && hasAdminEnv) {
    return null;
  }

  return (
    <div className="relative border-y border-[var(--line)] bg-[rgba(255,255,255,0.64)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-sm text-[var(--muted)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>
          当前是离线演示模式：浏览页会优先展示 Mock 数据；登录、发布和后台录入需要补齐
          `.env.local` 里的 Supabase 配置。
        </p>
        <Link href="/login" className="ui-link font-semibold text-[var(--primary)]">
          配好后去测试登录
        </Link>
      </div>
    </div>
  );
}
