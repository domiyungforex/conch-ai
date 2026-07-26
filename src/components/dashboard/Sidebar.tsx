"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserMenu } from "./UserMenu";
import {
  LayoutDashboard, MessageSquare, Brain, Bot, Share2, Star, Wallet, Settings, Code2,
  Building2, Landmark, Lightbulb, TrendingUp, Store, Sparkles,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useActivatedModules } from "@/hooks/useActivatedModules";
import { MODULE_NAV_ITEMS, type ModuleKey } from "@/lib/modules";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  section: "main" | "social" | "modules" | "utility";
}

const MODULE_ICONS: Record<ModuleKey, React.ElementType> = {
  personal_ai: Brain,
  developer_ai: Code2,
  memory_engine: Brain,
  agent_system: Bot,
  business_ai: Building2,
  financial_intelligence: Landmark,
  opportunity_engine: Lightbulb,
  economic_intelligence: TrendingUp,
  marketplace: Store,
  credit_intelligence: Landmark,
};

const baseItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard",       section: "main" },
  { href: "/chat",      icon: MessageSquare,   label: "Chat",            section: "main" },
  { href: "/memory",    icon: Brain,           label: "Memory",          section: "main" },
  { href: "/agents",    icon: Bot,             label: "Agents",          section: "main" },
  { href: "/shared",    icon: Share2,          label: "Shared Contexts", section: "social" },
  { href: "/reputation",icon: Star,            label: "Reputation",      section: "social" },
];

const utilityItems: NavItem[] = [
  { href: "/wallet",    icon: Wallet,          label: "Wallet",          section: "utility" },
  { href: "/developers",icon: Code2,           label: "API Docs",        section: "utility" },
  { href: "/settings",  icon: Settings,        label: "Settings",        section: "utility" },
];

const sectionLabels: Record<NavItem["section"], string> = {
  main:    "WORKSPACE",
  social:  "SOCIAL",
  modules: "MODULES",
  utility: "SETTINGS",
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isActivated, hydrated } = useActivatedModules();

  // Hidden until the user opts in via /features — see useActivatedModules
  // for why this is a per-browser nav preference, not an access control.
  const activeModuleItems: NavItem[] = hydrated
    ? MODULE_NAV_ITEMS.filter((m) => isActivated(m.key)).map((m) => ({
        href: m.href,
        icon: MODULE_ICONS[m.key],
        label: m.label,
        section: "modules" as const,
      }))
    : [];

  const navItems: NavItem[] = [...baseItems, ...activeModuleItems, ...utilityItems];

  let lastSection: NavItem["section"] | null = null;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="relative flex flex-col h-full glass border-r border-white/8 overflow-hidden"
    >
      {/* Logo + AI pulse */}
      <div className={cn("flex items-center px-4 py-5 border-b border-white/8 gap-2", collapsed && "justify-center px-2")}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-coral-600 to-gold-600 flex items-center justify-center shadow-lg shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path
                d="M13.2 20c-4.6 0-7.7-3.4-7.7-7.3 0-3.2 2.3-5.6 5.2-5.6 2.4 0 4.1 1.7 4.1 3.9 0 1.8-1.2 3.1-2.8 3.1-1.3 0-2.2-.9-2.2-2.1 0-.9.6-1.6 1.5-1.6"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        ) : (
          <>
            <Logo size="sm" />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="ml-auto w-2 h-2 rounded-full bg-coral-400 shrink-0"
            />
          </>
        )}
      </div>

      {/* Activate other features — always at the top, above the regular nav */}
      <div className={cn("px-2 pt-3", collapsed && "px-1")}>
        <Link
          href="/features"
          title={collapsed ? "Activate other features" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium border border-dashed border-coral-500/30 bg-coral-500/5 text-coral-300 hover:bg-coral-500/10 hover:border-coral-500/50 transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span className="truncate">Activate other features</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ href, icon: Icon, label, section }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          const showDivider = section !== lastSection;
          lastSection = section;

          return (
            <div key={href}>
              {/* Section divider */}
              {showDivider && (
                collapsed ? (
                  <div className="mx-auto w-6 border-t border-white/5 my-2" />
                ) : (
                  <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                    {sectionLabels[section]}
                  </p>
                )
              )}

              <Link
                href={href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors overflow-hidden group",
                  active
                    ? "text-coral-300"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? label : undefined}
              >
                {/* Sliding active background */}
                {active && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-xl bg-coral-600/15"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <Icon
                  className={cn(
                    "relative shrink-0 h-5 w-5 z-10",
                    active ? "text-coral-400" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />

                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.14 }}
                      className="relative z-10 truncate"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Active dot */}
                {!collapsed && active && (
                  <motion.div
                    layoutId="sidebar-active-dot"
                    className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-coral-400"
                  />
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Bottom: user + collapse */}
      <div className={cn("px-2 py-3 border-t border-white/8 flex items-center gap-2", collapsed && "justify-center")}>
        <div className="relative shrink-0">
          <UserMenu size="sm" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background pointer-events-none" />
        </div>

        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              key="account-label"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.14 }}
              className="text-sm text-slate-400 truncate"
            >
              Account
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-coral-500/50 transition-colors z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
