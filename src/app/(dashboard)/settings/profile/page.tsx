"use client";

import { useState, useEffect } from "react";
import { account } from "@/lib/appwrite-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CheckCircle2, AlertCircle } from "lucide-react";

type AppwriteUser = Awaited<ReturnType<typeof account.get>>;

export default function ProfilePage() {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    account.get()
      .then((u) => {
        setUser(u);
        const parts = (u.name ?? "").split(" ");
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-40">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-40 gap-3 text-slate-400">
        <AlertCircle className="w-5 h-5 text-red-400" />
        <span className="text-sm">Session not found. Please sign in again.</span>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      await account.updateName(fullName);
      setUser((prev) => prev ? { ...prev, name: fullName } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to save. Please try again.");
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
            <AvatarFallback className="bg-linear-to-br from-violet-600 to-indigo-600 text-white text-xl font-bold">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300 mb-1.5 block">First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300 mb-1.5 block">Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-400 mt-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}

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
          {user.email}
        </p>
      </GlassCard>
    </div>
  );
}
