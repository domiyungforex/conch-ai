"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { getAuthErrorMessage } from "@/lib/auth/errors";

export default function SignUpPage() {
  const clerk = useClerk();
  const { isLoaded, isSignedIn } = useUser();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Same guard as /sign-in — a leftover session here should land you in the
  // app instead of erroring on a form you can't actually submit.
  useEffect(() => {
    if (isLoaded && isSignedIn) window.location.href = "/dashboard";
  }, [isLoaded, isSignedIn]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await clerk.client.signUp.create({ firstName, lastName, username, emailAddress: email, password });
      await clerk.client.signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err) {
      setError(getAuthErrorMessage(err, "Couldn't create your account. Please check your details."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await clerk.client.signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete" && result.createdSessionId) {
        await clerk.setActive({ session: result.createdSessionId, redirectUrl: "/dashboard" });
      } else {
        setError("That code didn't complete verification. Please try again.");
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, "That code wasn't valid. Please check it and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "verify") {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a verification code to ${email}.`}>
        <form onSubmit={handleVerify} className="space-y-4">
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

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <LoadingSpinner size="sm" />}
            Verify and continue
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("form")}>
            Back
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Begin your memory"
      subtitle="Create an account and start a memory that stays yours — portable, persistent, recalled everywhere."
      footer={{ label: "Already have an account?", linkLabel: "Sign in to your memory", href: "/sign-in" }}
    >
      <SocialAuthButtons mode="sign-up" onError={setError} />

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-500">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>

        {/* Clerk's bot-protection widget mounts here automatically when CAPTCHA is enabled for the instance. */}
        <div id="clerk-captcha" />

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <LoadingSpinner size="sm" />}
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
