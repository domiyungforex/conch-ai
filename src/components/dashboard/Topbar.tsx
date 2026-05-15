"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileSidebar } from "./MobileSidebar";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/chat": "AI Chat",
  "/memory": "Memory",
  "/agents": "Agents",
  "/wallet": "Wallet",
  "/settings": "Settings",
  "/settings/profile": "Profile",
  "/settings/notifications": "Notifications",
  "/settings/api-keys": "API Keys",
  "/settings/privacy": "Privacy",
};

export function Topbar() {
  const pathname = usePathname();
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
      <Button variant="ghost" size="icon" className="text-slate-400">
        <Bell className="h-5 w-5" />
      </Button>
      <div className="md:hidden">
        <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
      </div>
    </header>
  );
}
