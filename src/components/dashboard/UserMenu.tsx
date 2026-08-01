"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, User, LogOut } from "lucide-react";

export function UserMenu({ size = "md" }: { size?: "sm" | "md" }) {
  const boxSize = size === "sm" ? "w-8 h-8" : "w-8 h-8";
  const { user } = useUser();
  const { signOut } = useClerk();

  const name = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "Account";
  const email = user?.primaryEmailAddress?.emailAddress;
  const initial = (user?.firstName?.[0] || user?.username?.[0] || name[0] || "C").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative focus:outline-none focus:ring-2 focus:ring-coral-500 rounded-full">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt=""
              className={`${boxSize} rounded-full object-cover`}
            />
          ) : (
            <div className={`${boxSize} rounded-full bg-linear-to-br from-coral-600 to-gold-600 flex items-center justify-center text-white text-sm font-bold`}>
              {initial}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass border-white/10">
        <DropdownMenuLabel className="text-slate-300">
          <p className="font-medium text-white truncate">{name}</p>
          {email && <p className="text-xs text-slate-500 truncate mt-0.5">{email}</p>}
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
        <DropdownMenuItem
          className="text-red-400 focus:text-red-300 cursor-pointer"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
