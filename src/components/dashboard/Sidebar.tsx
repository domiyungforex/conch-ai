"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard, MessageSquare, Brain, Bot, Wallet, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/memory", icon: Brain, label: "Memory" },
  { href: "/agents", icon: Bot, label: "Agents" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col h-full glass border-r border-white/8 overflow-hidden"
    >
      {/* Logo */}
      <div className={cn("flex items-center px-4 py-5 border-b border-white/8", collapsed && "justify-center px-2")}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm-1 13V8l7 4-7 4z" fill="white" />
            </svg>
          </div>
        ) : (
          <Logo size="sm" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                active
                  ? "bg-violet-600/20 text-violet-300 shadow-sm shadow-violet-500/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn("shrink-0 h-5 w-5", active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300")} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + collapse */}
      <div className={cn("px-2 py-3 border-t border-white/8 flex items-center gap-2", collapsed && "justify-center")}>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
              userButtonTrigger: "focus:shadow-none",
            },
          }}
        />
        {!collapsed && <span className="text-sm text-slate-400 truncate">Account</span>}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-violet-500/50 transition-colors z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
