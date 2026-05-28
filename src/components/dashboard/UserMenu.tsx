"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";

type AppwriteUser = Awaited<ReturnType<typeof account.get>>;

export function UserMenu({ size = "md" }: { size?: "sm" | "md" }) {
  const router = useRouter();
  const [user, setUser] = useState<AppwriteUser | null>(null);

  useEffect(() => {
    account.get().then(setUser).catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/sign-in");
    router.refresh();
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const boxSize = size === "sm" ? "w-8 h-8" : "w-8 h-8";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-full">
          <div className={`${boxSize} rounded-full bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold`}>
            {initials}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 glass border-white/10">
        <DropdownMenuLabel className="text-slate-300">
          <p className="font-medium text-white truncate">{user?.name || "Account"}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild>
          <a href="/settings/profile" className="text-slate-300 cursor-pointer">
            <User className="w-4 h-4 mr-2" /> Profile
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/settings" className="text-slate-300 cursor-pointer">
            <Settings className="w-4 h-4 mr-2" /> Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-400 cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
