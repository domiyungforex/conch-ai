"use client";

import { GlassCard } from "@/components/shared/GlassCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-6">Profile Information</h2>
        <div className="flex items-start gap-6">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-linear-to-br from-violet-600 to-indigo-600 text-white text-xl font-bold">
              C
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white">Conch User</p>
            <p className="text-xs text-slate-400 mt-0.5">Demo mode — no account required</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
