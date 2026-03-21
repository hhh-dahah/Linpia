"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteNavigation } from "@/constants";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href.includes("#")) {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <div className="flex min-w-max items-center gap-2 text-sm font-medium text-[var(--muted)]">
        {siteNavigation.map((item) => {
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2.5 transition-[transform,background-color,color,box-shadow] duration-150 ease-out",
                "active:scale-[0.96] active:bg-[rgba(36,91,219,0.12)] active:text-[var(--primary)]",
                "hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]",
                "motion-reduce:transition-none",
                isActive
                  ? "bg-[var(--primary-soft)] text-[var(--primary)] shadow-[inset_0_0_0_1px_rgba(36,91,219,0.08)]"
                  : "bg-transparent",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
