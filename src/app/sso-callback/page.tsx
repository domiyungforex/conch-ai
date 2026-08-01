"use client";

import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getAuthErrorMessage } from "@/lib/auth/errors";

export default function SSOCallbackPage() {
  const clerk = useClerk();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clerk
      .handleRedirectCallback({
        signInFallbackRedirectUrl: "/dashboard",
        signUpFallbackRedirectUrl: "/dashboard",
      })
      .catch((err) => setError(getAuthErrorMessage(err, "Couldn't complete sign-in. Please try again.")));
  }, [clerk]);

  return (
    <AuthShell title="Signing you in" subtitle="Just a moment while we finish connecting your account.">
      {error ? (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </AuthShell>
  );
}
