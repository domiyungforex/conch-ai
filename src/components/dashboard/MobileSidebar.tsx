"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";
import { LayoutDashboard, MessageSquare, Brain, Bot, Share2, Star, Wallet, Settings, Code2 } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Dashboard",       section: "WORKSPACE" },
  { href: "/chat",        icon: MessageSquare,   label: "Chat",            section: "WORKSPACE" },
  { href: "/memory",      icon: Brain,           label: "Memory",          section: "WORKSPACE" },
  { href: "/agents",      icon: Bot,             label: "Agents",          section: "WORKSPACE" },
  { href: "/shared",      icon: Share2,          label: "Shared Contexts", section: "SOCIAL" },
  { href: "/reputation",  icon: Star,            label: "Reputation",      section: "SOCIAL" },
  { href: "/wallet",      icon: Wallet,          label: "Wallet",          section: "SETTINGS" },
  { href: "/developers",  icon: Code2,           label: "API Docs",        section: "SETTINGS" },
  { href: "/settings",    icon: Settings,        label: "Settings",        section: "SETTINGS" },
];

export function MobileSidebar() {
  const pathname = usePathname();
  let lastSection: string | null = null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/8">
        <Logo size="sm" />
      </div>
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, section }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const showDivider = section !== lastSection;
          lastSection = section;

          return (
            <div key={href}>
              {showDivider && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                  {section}
                </p>
              )}
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active ? "bg-coral-600/20 text-coral-300" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active ? "text-coral-400" : "text-slate-500")} />
                <span>{label}</span>
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-white/8 flex items-center gap-3">
        <div className="relative">
          <UserMenu size="sm" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background pointer-events-none" />
        </div>
        <span className="text-sm text-slate-400">Account</span>
      </div>
    </div>
  );
}
