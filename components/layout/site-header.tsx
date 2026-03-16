import Image from "next/image";
import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";

import { SiteNav } from "./site-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(255,255,255,0.72)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="overflow-hidden rounded-[1.1rem] shadow-[0_10px_22px_rgba(51,112,255,0.24)]">
              <Image
                src="/branding/linpai-option-1.svg"
                alt="邻派 Linpai"
                width={48}
                height={48}
                className="h-11 w-11 sm:h-12 sm:w-12"
              />
            </div>
            <div>
              <div className="font-display text-base font-bold tracking-tight text-[var(--foreground)] sm:text-lg">
                邻派 Linpai
              </div>
              <p className="text-xs text-[var(--muted)] sm:text-sm">校园合作与招募平台</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {user ? (
              <>
                <Link href="/dashboard" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
                  我的发布
                </Link>
                <Link
                  href="/publish"
                  className="ui-button-primary px-4 py-2 text-sm font-semibold active:scale-[0.97]"
                >
                  发布招募
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(255,159,74,0.2)] active:scale-[0.97]"
                  >
                    退出登录
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="ui-button-secondary px-4 py-2 text-sm font-semibold active:scale-[0.97]"
                >
                  登录
                </Link>
                <Link
                  href="/publish"
                  className="ui-button-primary px-4 py-2 text-sm font-semibold active:scale-[0.97]"
                >
                  发布招募
                </Link>
              </>
            )}
          </div>
        </div>

        <SiteNav />
      </div>
    </header>
  );
}
