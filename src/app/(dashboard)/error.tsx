"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-5 p-6">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">Page failed to load</h2>
        <p className="text-sm text-slate-400 max-w-sm mt-2 leading-relaxed">
          {error?.message ?? "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
        <Button variant="secondary" asChild className="gap-2">
          <Link href="/dashboard">
            <Home className="w-4 h-4" /> Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
