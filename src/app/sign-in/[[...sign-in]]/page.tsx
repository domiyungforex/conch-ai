"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getAuthErrorMessage } from "@/lib/auth/errors";

export default function SignInPage() {
  const clerk = useClerk();
  const { isLoaded, isSignedIn } = useUser();
  const [step, setStep] = useState<"form" | "verify-2fa">("form");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Landing here with a session already active (a leftover tab, browser
  // back, or the create()/setActive() race this page used to have) should
  // land you in the app, not on a form that errors with "already signed in".
  useEffect(() => {
    if (isLoaded && isSignedIn) window.location.href = "/dashboard";
  }, [isLoaded, isSignedIn]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await clerk.client.signIn.create({ strategy: "password", identifier, password });
      if (result.status === "complete") {
        // redirectUrl (not a separate window.location.href after) lets Clerk
        // sequence the navigation with the session cookie write — doing it
        // as two steps races the cookie and can bounce /dashboard's auth()
        // check back to /sign-in before the cookie has actually landed.
        await clerk.setActive({ session: result.createdSessionId, redirectUrl: "/dashboard" });
      } else if (result.status === "needs_second_factor" || result.status === "needs_client_trust") {
        // needs_client_trust is Clerk's device-trust check (new browser/device,
        // auto-enabled on apps created after 2025-11-14) — resolved the same
        // way as a real second factor: prepare + attempt against email_code.
        const emailFactor = result.supportedSecondFactors?.find(
          (f): f is Extract<typeof f, { strategy: "email_code" }> => f.strategy === "email_code"
        );
        if (!emailFactor) {
          setError("This device needs extra verification, but no email code option is available for this account. Please contact support.");
          return;
        }
        await clerk.client.signIn.prepareSecondFactor({ strategy: "email_code", emailAddressId: emailFactor.emailAddressId });
        setStep("verify-2fa");
      } else {
        setError(`Additional verification is required (status: ${result.status}).`);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, "Couldn't sign in. Check your email/username and password."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify2FA(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await clerk.client.signIn.attemptSecondFactor({ strategy: "email_code", code });
      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId, redirectUrl: "/dashboard" });
      } else {
        setError(`Couldn't complete verification (status: ${result.status}).`);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, "That code wasn't valid. Please check it and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "verify-2fa") {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`Enter the verification code we sent to ${identifier}.`}
      >
        <form onSubmit={handleVerify2FA} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              autoFocus
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
            Verify and continue
          </Button>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors"
          >
            Back
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Sign in to Conch"
      subtitle="Welcome back — pick up right where you left off."
      footer={{ label: "Don't have an account?", linkLabel: "Sign up", href: "/sign-up" }}
    >
      <SocialAuthButtons mode="sign-in" onError={setError} />

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-500">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">Email address or username</Label>
          <Input
            id="identifier"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-coral-400 hover:text-coral-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
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
          Continue
        </Button>
      </form>
    </AuthShell>
  );
}
