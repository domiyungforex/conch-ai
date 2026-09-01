"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSettings } from "@/hooks/useUserSettings";

export default function PrivacyPage() {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data: settings, isLoading, isError, update } = useUserSettings();

  const handleExport = async () => {
    try {
      const res = await fetch("/api/memory");
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conch-memories-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[export]", err);
      alert("Export failed. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await fetch("/api/user/account", { method: "DELETE" });
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.push("/");
    } catch (err) {
      console.error("[delete account]", err);
      alert("Account deletion failed. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-base font-semibold text-white mb-6">Privacy Controls</h2>
        {isLoading ? (
          <Skeleton className="h-10 rounded-lg bg-white/5" />
        ) : isError || !settings ? (
          <p className="text-sm text-red-400">Couldn&apos;t load your privacy settings. Try refreshing.</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-white">Public Profile</Label>
                <p className="text-xs text-slate-400 mt-0.5">Allow others to see your public agent personas.</p>
              </div>
              <Switch
                checked={settings.publicProfile}
                onCheckedChange={(checked) => update.mutate({ publicProfile: checked })}
              />
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-base font-semibold text-white mb-2">Export Your Memory</h2>
        <p className="text-sm text-slate-400 mb-4">Download every memory, conversation, and agent configuration. Your memory is yours to take anywhere.</p>
        <Button variant="secondary" onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" /> Export Memory
        </Button>
      </GlassCard>

      <GlassCard className="p-4 sm:p-6 border-red-500/20">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-white">Danger Zone</h2>
            <p className="text-sm text-slate-400 mt-0.5">These actions are permanent and cannot be undone.</p>
          </div>
        </div>
        {!confirmDelete ? (
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>Delete Account</Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-300">Are you sure? Every memory you&apos;ve made, all of it, will be permanently erased.</p>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting} className="gap-2">
                <Trash2 className="w-4 h-4" /> {deleting ? "Deleting…" : "Yes, delete my account"}
              </Button>
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
