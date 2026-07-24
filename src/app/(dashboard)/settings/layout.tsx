"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Bell, Lock, Key, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/privacy", label: "Privacy", icon: Lock },
  { href: "/settings/api-keys", label: "API Keys", icon: Key },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-normal text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage your account and preferences</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <nav className="md:w-48 flex-shrink-0 overflow-x-auto">
          <div className="flex md:flex-col gap-1 min-w-max md:min-w-0">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={cn("flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    active ? "bg-coral-600/20 text-coral-300" : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}>
                  <Icon className={cn("w-4 h-4", active ? "text-coral-400" : "text-slate-500")} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
