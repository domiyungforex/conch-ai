"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";
import {
  LayoutDashboard, MessageSquare, Brain, Bot, Share2, Star, Wallet, Settings, Code2,
  Building2, Landmark, Lightbulb, TrendingUp, Store, Sparkles, Music2,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import { useActivatedModules } from "@/hooks/useActivatedModules";
import { MODULE_NAV_ITEMS, type ModuleKey } from "@/lib/modules";

const MODULE_ICONS: Record<ModuleKey, React.ElementType> = {
  personal_ai: Brain,
  developer_ai: Code2,
  memory_engine: Brain,
  agent_system: Bot,
  business_ai: Building2,
  creator_ai: Music2,
  financial_intelligence: Landmark,
  opportunity_engine: Lightbulb,
  economic_intelligence: TrendingUp,
  marketplace: Store,
  credit_intelligence: Landmark,
};

const baseItems = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Dashboard",       section: "YOUR MEMORY" },
  { href: "/chat",        icon: MessageSquare,   label: "Chat",            section: "YOUR MEMORY" },
  { href: "/memory",      icon: Brain,           label: "Memory",          section: "YOUR MEMORY" },
  { href: "/agents",      icon: Bot,             label: "Agents",          section: "YOUR MEMORY" },
  { href: "/shared",      icon: Share2,          label: "Shared Contexts", section: "SHARED MEMORY" },
  { href: "/reputation",  icon: Star,            label: "Reputation",      section: "SHARED MEMORY" },
];

const utilityItems = [
  { href: "/wallet",      icon: Wallet,          label: "Wallet",          section: "ACCOUNT" },
  { href: "/developers",  icon: Code2,           label: "API Docs",        section: "ACCOUNT" },
  { href: "/settings",    icon: Settings,        label: "Settings",        section: "ACCOUNT" },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const { isActivated, hydrated } = useActivatedModules();
  let lastSection: string | null = null;

  const activeModuleItems = hydrated
    ? MODULE_NAV_ITEMS.filter((m) => isActivated(m.key)).map((m) => ({
        href: m.href,
        icon: MODULE_ICONS[m.key],
        label: m.label,
        section: "MEMORY SPACES",
      }))
    : [];

  const navItems = [...baseItems, ...activeModuleItems, ...utilityItems];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/8">
        <Logo size="sm" />
      </div>

      {/* Activate other features — always at the top, above the regular nav */}
      <div className="px-2 pt-3">
        <Link
          href="/features"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium border border-coral-500/30 bg-coral-500/5 text-coral-300 hover:bg-coral-500/10 hover:border-coral-500/50 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Activate other features</span>
        </Link>
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
