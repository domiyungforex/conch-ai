"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserMenu } from "./UserMenu";
import {
  LayoutDashboard, MessageSquare, Brain, Bot, Share2, Star, Wallet, Settings, Code2,
  Building2, Landmark, Lightbulb, TrendingUp, Store, Sparkles, Music2, Layers, FolderOpen,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivatedModules } from "@/hooks/useActivatedModules";
import { MODULE_NAV_ITEMS, type ModuleKey } from "@/lib/modules";
import { useWalletState } from "@/providers/WalletStateProvider";
import { PLANS, type PlanId } from "@/lib/plans";
import { hasProAccess } from "@/lib/subscription";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  section: "main" | "social" | "modules" | "utility";
  badge?: string;
}

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

const baseItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard",  section: "main" },
  { href: "/chat",      icon: MessageSquare,   label: "Chat",       section: "main", badge: "AI" },
  { href: "/memory",    icon: Brain,           label: "Memory",     section: "main" },
  { href: "/agents",    icon: Bot,             label: "Agents",     section: "main" },
  { href: "/context",   icon: Layers,          label: "Context",    section: "main" },
  { href: "/projects",  icon: FolderOpen,      label: "Projects",   section: "main" },
];

const socialItems: NavItem[] = [
  { href: "/shared",     icon: Share2,   label: "Shared",     section: "social" },
  { href: "/reputation", icon: Star,     label: "Reputation",  section: "social" },
];

const utilityItems: NavItem[] = [
  { href: "/wallet",     icon: Wallet,   label: "Wallet",     section: "utility" },
  { href: "/developers", icon: Code2,    label: "Developers", section: "utility" },
  { href: "/settings",   icon: Settings, label: "Settings",   section: "utility" },
];

function NavButton({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
        active
          ? "text-foreground bg-primary/15"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.label : undefined}
    >
      {/* Active indicator */}
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-0 rounded-xl bg-primary/15"
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}

      <item.icon
        className={cn(
          "relative shrink-0 h-[18px] w-[18px] transition-colors",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      />

      {!collapsed && (
        <span className="relative truncate">{item.label}</span>
      )}

      {!collapsed && item.badge && (
        <span className="relative ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-coral-500/20 text-coral-400">
          {item.badge}
        </span>
      )}

      {!collapsed && active && (
        <div className="relative ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const { isActivated, hydrated } = useActivatedModules();
  const { wallet, subscriptionStatus, plan } = useWalletState();

  const activeModuleItems: NavItem[] = hydrated
    ? MODULE_NAV_ITEMS.filter((m) => isActivated(m.key)).map((m) => ({
        href: m.href,
        icon: MODULE_ICONS[m.key],
        label: m.label,
        section: "modules" as const,
      }))
    : [];

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  // Collapse sidebar on navigation
  const handleNavigate = useCallback(() => {
    setExpanded(false);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expanded]);

  // Close on Escape
  useEffect(() => {
    if (!expanded) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [expanded]);

  // Collapse on route change
  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

  return (
    <aside
      ref={sidebarRef}
      onClick={() => setExpanded((prev) => !prev)}
      className={cn(
        "relative flex flex-col h-full bg-background border-r border-border overflow-hidden z-20 cursor-pointer select-none transition-[width] duration-300 ease-out",
        expanded ? "w-[240px]" : "w-[68px]"
      )}
    >
      {/* Logo */}
      <div className="relative flex items-center px-4 h-16 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 pointer-events-auto" onClick={(e) => { e.stopPropagation(); handleNavigate(); }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
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
          <span
            className={cn(
              "text-sm font-semibold text-foreground whitespace-nowrap transition-opacity duration-200",
              expanded ? "opacity-100" : "opacity-0"
            )}
          >
            Conch
          </span>
        </Link>
      </div>

      {/* Search / Command */}
      <div className="px-2 mb-2">
        <Link
          href="/search"
          onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-muted-foreground pointer-events-auto",
            "hover:text-foreground hover:bg-muted/50 transition-all duration-200",
            "border border-transparent hover:border-border"
          )}
        >
          <Search className="w-[18px] h-[18px] shrink-0" />
          {expanded && (
            <>
              <span className="whitespace-nowrap">Search</span>
              <kbd className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border">
                ⌘K
              </kbd>
            </>
          )}
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto overflow-x-hidden">
        {/* Core */}
        <div className="mb-4">
          {expanded && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Core
            </p>
          )}
          {baseItems.map((item) => (
            <NavButton
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={!expanded}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {/* Modules (if activated) */}
        {activeModuleItems.length > 0 && (
          <div className="mb-4">
            {expanded && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Spaces
              </p>
            )}
            {activeModuleItems.map((item) => (
              <NavButton
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={!expanded}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}

        {/* Social */}
        <div className="mb-4">
          {expanded && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Social
            </p>
          )}
          {socialItems.map((item) => (
            <NavButton
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={!expanded}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {/* Utility */}
        <div className="mb-4">
          {expanded && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Account
            </p>
          )}
          {utilityItems.map((item) => (
            <NavButton
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={!expanded}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </nav>

      {/* Activate features */}
      <div className="px-2 mb-2">
        <Link
          href="/features"
          onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-primary hover:text-primary-hover hover:bg-primary/10 transition-all duration-200 pointer-events-auto",
            !expanded && "justify-center px-2"
          )}
          title={!expanded ? "Activate features" : undefined}
        >
          <Sparkles className="w-[18px] h-[18px] shrink-0" />
          {expanded && (
            <span className="whitespace-nowrap">Activate features</span>
          )}
        </Link>
      </div>

      {/* User */}
      <div className="px-2 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 pointer-events-auto">
          <UserMenu size="sm" />
          {expanded && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-foreground truncate">Account</p>
              {plan && plan !== "free" && subscriptionStatus && hasProAccess(subscriptionStatus) && (
                <p className="text-[11px] text-primary truncate">
                  {PLANS[plan as PlanId]?.label ?? plan.toUpperCase()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
