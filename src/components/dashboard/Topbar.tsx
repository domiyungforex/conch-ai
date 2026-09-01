"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Bell, Search } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { Logo } from "@/components/shared/Logo";
import { UiThemeSelector } from "@/components/shared/UiThemeSelector";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileSidebar } from "./MobileSidebar";
import { useRealtimeStatus } from "@/providers/AppwriteRealtimeProvider";
import { cn } from "@/lib/utils";

const breadcrumbMap: Record<string, string> = {
  "/dashboard":             "Your Memory",
  "/chat":                  "Conversations",
  "/memory":                "Memory",
  "/agents":                "Agents",
  "/shared":                "Shared Memories",
  "/reputation":            "Reputation",
  "/features":              "Activate other features",
  "/business":              "Business Memory",
  "/financial":             "Financial Memory",
  "/opportunities":         "Opportunities",
  "/economic":              "Economic Memory",
  "/marketplace":           "Marketplace",
  "/wallet":                "Wallet",
  "/developers":            "Developers",
  "/developers/api":        "API Reference",
  "/developers/install":    "Install Conch",
  "/settings":              "Settings",
  "/settings/profile":      "Profile",
  "/settings/billing":      "Billing",
  "/settings/notifications":"Notifications",
  "/settings/api-keys":     "API Keys",
  "/settings/privacy":      "Privacy",
};

export function Topbar() {
  const pathname = usePathname();
  const realtimeStatus = useRealtimeStatus();
  const segments = pathname.split("/").filter(Boolean);
  const currentPage = breadcrumbMap[pathname] ?? segments[segments.length - 1] ?? "Dashboard";

  return (
    <header className="relative h-14 glass-strong border-b border-white/6 flex items-center px-4 gap-3 sticky top-0 z-30">
      {/* Subtle gradient line at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-coral-500/20 to-transparent" />

      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="glass-strong border-white/6 p-0 w-64">
          <MobileSidebar />
        </SheetContent>
      </Sheet>

      {/* Mobile logo */}
      <div className="md:hidden">
        <Logo size="sm" />
      </div>

      {/* Breadcrumb */}
      <div className="hidden md:flex items-center gap-1.5 text-[13px]">
        <Link href="/dashboard" className="text-slate-500 hover:text-foreground transition-colors">
          Home
        </Link>
        {segments.length > 0 && <span className="text-slate-700">/</span>}
        <span className="text-foreground font-medium">{currentPage}</span>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div
        className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500"
        title={realtimeStatus === "live" ? "Live sync connected" : "Live sync offline"}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            realtimeStatus === "live"
              ? "bg-teal-400 shadow-sm shadow-teal-400/50"
              : realtimeStatus === "connecting"
              ? "bg-gold-500 animate-pulse"
              : "bg-slate-600"
          )}
        />
        Live
      </div>
      {/* Search trigger — dispatches Cmd+K to open CmdKSearchDialog */}
      <button
        onClick={() => {
          document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
          );
        }}
        className="hidden sm:flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-1.5 text-[12px] text-slate-500 hover:text-foreground hover:bg-white/[0.05] hover:border-white/12 transition-all duration-200"
        title="Search (⌘K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search</span>
        <kbd className="ml-1 px-1 py-0.5 rounded bg-muted/50 border border-border text-[10px] font-mono">⌘K</kbd>
      </button>
      <UiThemeSelector />
      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-foreground" asChild>
        <Link href="/settings/notifications" title="Notification settings">
          <Bell className="h-4 w-4" />
        </Link>
      </Button>
      <div className="md:hidden">
        <UserMenu size="sm" />
      </div>
    </header>
  );
}
