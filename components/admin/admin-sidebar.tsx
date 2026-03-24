"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "总览" },
  { href: "/admin/people", label: "人员管理" },
  { href: "/admin/opportunities", label: "招募管理" },
  { href: "/admin/applications", label: "报名管理" },
  { href: "/admin/admin-users", label: "管理员管理" },
];

export function AdminSidebar({ canManageAdmins }: { canManageAdmins: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems
        .filter((item) => canManageAdmins || item.href !== "/admin/admin-users")
        .map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-[rgba(51,112,255,0.12)] text-primary-strong"
                  : "text-muted hover:bg-[rgba(51,112,255,0.06)] hover-text-foreground"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-xs">{active ? "当前" : "进入"}</span>
            </Link>
          );
        })}
    </nav>
  );
}
