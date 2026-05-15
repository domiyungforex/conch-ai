"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isLoaded) return <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>;

  const handleSave = async () => {
    setSaving(true);
    try {
      await user?.update({ firstName, lastName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-6">Profile Information</h2>
        <div className="flex items-start gap-6 mb-6">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ""} />
            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xl font-bold">
              {user?.firstName?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white">{user?.fullName}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user?.primaryEmailAddress?.emailAddress}</p>
            <p className="text-xs text-slate-600 mt-2">To update your profile photo, use the account button in the sidebar.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300 mb-1.5 block">First Name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="bg-white/5 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Last Name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="bg-white/5 border-white/10 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-2">Email Address</h2>
        <p className="text-sm text-slate-400 mb-4">Your primary email for account communications.</p>
        <p className="text-sm font-mono text-white bg-white/5 rounded-xl px-4 py-2.5 border border-white/8">
          {user?.primaryEmailAddress?.emailAddress}
        </p>
      </GlassCard>
    </div>
  );
}
