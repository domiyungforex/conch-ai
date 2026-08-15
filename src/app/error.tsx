"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#04060d] flex items-center justify-center p-6">
      <div className="flex flex-col items-center text-center gap-5 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            An unexpected error occurred. Your data is safe — refresh the page to try again.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-600 font-mono mt-2">Error ID: {error.digest}</p>
          )}
        </div>
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Try again
        </Button>
      </div>
    </div>
  );
}
