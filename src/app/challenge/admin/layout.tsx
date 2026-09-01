"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FolderOpen, FileCheck, Trophy,
  Settings, BarChart3, Bell, Activity
} from "lucide-react";

const adminNav = [
  { label: "Dashboard", href: "/challenge/admin", icon: LayoutDashboard },
  { label: "Waitlist", href: "/challenge/admin/waitlist", icon: Users },
  { label: "Participants", href: "/challenge/admin/participants", icon: Users },
  { label: "Submissions", href: "/challenge/admin/submissions", icon: FileCheck },
  { label: "Projects", href: "/challenge/admin/projects", icon: FolderOpen },
  { label: "Winners", href: "/challenge/admin/winners", icon: Trophy },
  { label: "Events", href: "/challenge/admin/events", icon: Activity },
  { label: "Settings", href: "/challenge/admin/settings", icon: Settings },
  { label: "Analytics", href: "/challenge/admin/analytics", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex" style={{ background: "var(--conch-surface)" }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[var(--conch-border)] sticky top-0 h-screen"
        style={{ background: "var(--conch-bg)" }}>
        <div className="p-4 border-b border-[var(--conch-border)]">
          <Link href="/challenge" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="text-[var(--conch-text)] font-semibold">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[rgba(124,58,237,0.15)] text-[var(--conch-purple-light)]"
                    : "text-[var(--conch-text-muted)] hover:text-[var(--conch-text)] hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--conch-border)]">
          <Link href="/challenge" className="text-xs text-[var(--conch-text-dim)] hover:text-[var(--conch-text-muted)] transition-colors">
            ← Back to Challenge
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 h-14 border-b border-[var(--conch-border)] flex items-center justify-between px-6"
          style={{ background: "rgba(10,10,16,0.8)", backdropFilter: "blur(20px)" }}>
          <div className="lg:hidden">
            <Link href="/challenge" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <span className="text-[var(--conch-text)] font-semibold text-sm">Admin</span>
            </Link>
          </div>
          <h1 className="text-sm font-medium text-[var(--conch-text-muted)] hidden lg:block">Challenge Admin</h1>
          <div className="flex items-center gap-4">
            <button className="relative text-[var(--conch-text-muted)] hover:text-[var(--conch-text)]">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--conch-purple)] rounded-full" />
            </button>
          </div>
        </div>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
