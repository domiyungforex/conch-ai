"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { Logo } from "@/components/shared/Logo";
import { ThemeCustomizer } from "@/components/shared/ThemeCustomizer";
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
    <header className="h-14 glass border-b border-white/8 flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="glass border-white/10 p-0 w-64">
          <MobileSidebar />
        </SheetContent>
      </Sheet>

      {/* Mobile logo */}
      <div className="md:hidden">
        <Logo size="sm" />
      </div>

      {/* Breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors">Home</Link>
        {segments.length > 0 && <span className="text-slate-700">/</span>}
        <span className="text-white font-medium">{currentPage}</span>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div
        className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500"
        title={realtimeStatus === "live" ? "Live sync connected" : "Live sync offline"}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            realtimeStatus === "live" ? "bg-teal-400" : realtimeStatus === "connecting" ? "bg-gold-500 animate-pulse" : "bg-slate-600"
          )}
        />
        Live
      </div>
      <ThemeCustomizer />
      <Button variant="ghost" size="icon" className="text-slate-400" asChild>
        <Link href="/settings/notifications" title="Notification settings">
          <Bell className="h-5 w-5" />
        </Link>
      </Button>
      <div className="md:hidden">
        <UserMenu size="sm" />
      </div>
    </header>
  );
}
