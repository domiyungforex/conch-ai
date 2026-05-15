"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, MessageSquare, Brain, Bot, Wallet, Settings } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/memory", icon: Brain, label: "Memory" },
  { href: "/agents", icon: Bot, label: "Agents" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/8">
        <Logo size="sm" />
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active ? "bg-violet-600/20 text-violet-300" : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-violet-400" : "text-slate-500")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-white/8 flex items-center gap-3">
        <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
        <span className="text-sm text-slate-400">Account</span>
      </div>
    </div>
  );
}
