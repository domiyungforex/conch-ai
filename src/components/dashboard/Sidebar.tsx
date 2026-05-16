"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard, MessageSquare, Brain, Bot, Share2, Star, Wallet, Settings,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  section: "main" | "social" | "utility";
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard",       section: "main" },
  { href: "/chat",      icon: MessageSquare,   label: "Chat",            section: "main" },
  { href: "/memory",    icon: Brain,           label: "Memory",          section: "main" },
  { href: "/agents",    icon: Bot,             label: "Agents",          section: "main" },
  { href: "/shared",    icon: Share2,          label: "Shared Contexts", section: "social" },
  { href: "/reputation",icon: Star,            label: "Reputation",      section: "social" },
  { href: "/wallet",    icon: Wallet,          label: "Wallet",          section: "utility" },
  { href: "/settings",  icon: Settings,        label: "Settings",        section: "utility" },
];

const sectionLabels: Record<NavItem["section"], string> = {
  main:    "WORKSPACE",
  social:  "SOCIAL",
  utility: "SETTINGS",
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm-1 13V8l7 4-7 4z" fill="white" />
            </svg>
          </div>
        ) : (
          <>
            <Logo size="sm" />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="ml-auto w-2 h-2 rounded-full bg-violet-400 shrink-0"
            />
          </>
        )}
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
                    ? "text-violet-300"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? label : undefined}
              >
                {/* Sliding active background */}
                {active && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-xl bg-violet-600/15"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <Icon
                  className={cn(
                    "relative shrink-0 h-5 w-5 z-10",
                    active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"
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
                    className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-violet-400"
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
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonTrigger: "focus:shadow-none",
              },
            }}
          />
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
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-violet-500/50 transition-colors z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
