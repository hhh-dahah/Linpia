import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { siteNavigation } from "@/constants";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(255,255,255,0.72)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(135deg,_#4a8bff,_#245bdb)] text-base font-bold text-white shadow-[0_10px_22px_rgba(51,112,255,0.24)] sm:h-12 sm:w-12 sm:text-lg">
              MC
            </div>
            <div>
              <div className="font-display text-base font-bold tracking-tight text-[var(--foreground)] sm:text-lg">
                Match Campus
              </div>
              <p className="text-xs text-[var(--muted)] sm:text-sm">机会、人才、导师协作的校园连接平台</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {user ? (
              <>
                <Link href="/dashboard" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
                  控制台
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(255,159,74,0.2)]"
                  >
                    退出登录
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="ui-button-secondary px-4 py-2 text-sm font-semibold">
                  登录
                </Link>
                <Link href="/publish" className="ui-button-primary px-4 py-2 text-sm font-semibold">
                  发布机会
                </Link>
              </>
            )}
          </div>
        </div>

        <nav className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <div className="flex min-w-max items-center gap-2 text-sm font-medium text-[var(--muted)]">
            {siteNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2.5 transition duration-200 hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
