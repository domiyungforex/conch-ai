"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getAuthErrorMessage } from "@/lib/auth/errors";

type Step = "request" | "reset";

export default function ForgotPasswordPage() {
  const clerk = useClerk();
  const { isLoaded, isSignedIn } = useUser();
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // This flow operates on a signed-OUT sign-in attempt — a signed-in user
  // has nothing to reset here.
  useEffect(() => {
    if (isLoaded && isSignedIn) window.location.href = "/dashboard";
  }, [isLoaded, isSignedIn]);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await clerk.client.signIn.create({ strategy: "reset_password_email_code", identifier });
      setStep("reset");
    } catch (err) {
      setError(getAuthErrorMessage(err, "Couldn't find an account with that email address."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const verified = await clerk.client.signIn.attemptFirstFactor({ strategy: "reset_password_email_code", code });
      const result = await verified.resetPassword({ password, signOutOfOtherSessions: true });
      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId, redirectUrl: "/dashboard" });
      } else {
        setError("Couldn't finish resetting your password. Please try again.");
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, "That code wasn't valid, or the new password didn't meet requirements."));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "reset") {
    return (
      <AuthShell title="Reset your password" subtitle={`Enter the code we sent to ${identifier} and choose a new password.`}>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <LoadingSpinner size="sm" />}
            Reset password
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("request")}>
            Back
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a code to reset it."
      footer={{ label: "Remembered it?", linkLabel: "Sign in", href: "/sign-in" }}
    >
      <form onSubmit={handleRequest} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">Email address</Label>
          <Input
            id="identifier"
            type="email"
            autoComplete="email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <LoadingSpinner size="sm" />}
          Send reset code
        </Button>
      </form>
    </AuthShell>
  );
}
