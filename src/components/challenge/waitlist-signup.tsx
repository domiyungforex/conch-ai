"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { X, CheckCircle, Share2, Copy, ExternalLink, LogIn, Loader2 } from "lucide-react";

interface WaitlistSignupProps {
  onClose: () => void;
}

const roles = [
  { value: "developer", label: "Developer" },
  { value: "creator", label: "Creator" },
  { value: "founder", label: "Founder" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
];

const countries = [
  "United States", "United Kingdom", "Canada", "Germany", "France",
  "Japan", "Australia", "India", "Brazil", "Nigeria", "Netherlands",
  "Sweden", "South Korea", "Singapore", "Other",
];

export function WaitlistSignup({ onClose }: WaitlistSignupProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    twitterHandle: "",
    discordUsername: "",
    role: "",
    buildIdea: "",
    country: "",
    referralCode: "",
  });

  // Auto-fill from Clerk user profile
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "";
      const email = user.emailAddresses?.[0]?.emailAddress || "";
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || name,
        email: prev.email || email,
      }));
    }
  }, [isLoaded, isSignedIn, user]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSignInRedirect = () => {
    const currentUrl = window.location.pathname + window.location.search;
    router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      handleSignInRedirect();
      return;
    }
    if (!form.fullName || !form.email || !form.role) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/challenge/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      setReferralCode(data.referralCode);
      setStep("success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const url = `${window.location.origin}/challenge/waitlist?ref=${referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnX = () => {
    const text = encodeURIComponent(
      `I just joined the @ConchAI Creator Challenge waitlist! 🐚\n\nConch gives AI persistent memory and agents.\n\n$5,000 Creator Challenge coming soon.\n\n${window.location.origin}/challenge/waitlist?ref=${referralCode}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto conch-scroll rounded-2xl border border-[var(--conch-border)]"
        style={{ background: "var(--conch-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--conch-text-muted)] hover:text-[var(--conch-text)] transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-[var(--conch-text)] mb-2">
              Join the Waitlist
            </h2>
            <p className="text-sm text-[var(--conch-text-muted)] mb-6">
              {isSignedIn
                ? "You&apos;re signed in. Complete your details to join the waitlist."
                : "Sign in to join the waitlist. We&apos;ll notify you when applications open."}
            </p>

            {/* Auth status */}
            {!isLoaded ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[var(--conch-purple)] animate-spin" />
              </div>
            ) : !isSignedIn ? (
              /* Not signed in — show sign-in prompt */
              <div className="py-8 text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "rgba(124, 58, 237, 0.1)", border: "1px solid rgba(124, 58, 237, 0.2)" }}>
                  <LogIn className="w-8 h-8 text-[var(--conch-purple)]" />
                </div>
                <p className="text-[var(--conch-text)] font-medium mb-2">
                  Sign in to join the waitlist
                </p>
                <p className="text-sm text-[var(--conch-text-muted)] mb-6">
                  We&apos;ll send you a welcome email with your referral code once you&apos;re in.
                </p>
                <button
                  type="button"
                  onClick={handleSignInRedirect}
                  className="px-8 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 conch-glow"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)",
                  }}
                >
                  Sign In / Create Account
                </button>
                <p className="text-xs text-[var(--conch-text-dim)] mt-4">
                  Don&apos;t have an account? One will be created for you automatically.
                </p>
              </div>
            ) : (
              /* Signed in — show form */
              <div className="space-y-5">
                {/* Signed in as badge */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-green-400 font-medium">
                    Signed in as {user?.emailAddresses?.[0]?.emailAddress}
                  </span>
                </div>

                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--conch-text)] mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => updateForm("fullName", e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl text-[var(--conch-text)] text-sm border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none transition-colors"
                    style={{ background: "var(--conch-surface-2)" }}
                    required
                  />
                </div>

                {/* Email (readonly from Clerk) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--conch-text)] mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl text-[var(--conch-text)] text-sm border border-[var(--conch-border)] opacity-70 cursor-not-allowed"
                    style={{ background: "var(--conch-surface-2)" }}
                  />
                  <p className="text-xs text-[var(--conch-text-dim)] mt-1">
                    Email from your Conch account
                  </p>
                </div>

                {/* Twitter */}
                <div>
                  <label className="block text-sm font-medium text-[var(--conch-text)] mb-1.5">
                    X / Twitter Username
                  </label>
                  <input
                    type="text"
                    value={form.twitterHandle}
                    onChange={(e) => updateForm("twitterHandle", e.target.value)}
                    placeholder="@yourusername"
                    className="w-full px-4 py-3 rounded-xl text-[var(--conch-text)] text-sm border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none transition-colors"
                    style={{ background: "var(--conch-surface-2)" }}
                  />
                </div>

                {/* Discord */}
                <div>
                  <label className="block text-sm font-medium text-[var(--conch-text)] mb-1.5">
                    Discord Username <span className="text-[var(--conch-text-dim)]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.discordUsername}
                    onChange={(e) => updateForm("discordUsername", e.target.value)}
                    placeholder="username#0000"
                    className="w-full px-4 py-3 rounded-xl text-[var(--conch-text)] text-sm border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none transition-colors"
                    style={{ background: "var(--conch-surface-2)" }}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-[var(--conch-text)] mb-1.5">
                    Role <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => updateForm("role", r.value)}
                        className="px-3 py-2.5 rounded-lg text-sm font-medium transition-all border"
                        style={{
                          background:
                            form.role === r.value
                              ? "rgba(124, 58, 237, 0.15)"
                              : "var(--conch-surface-2)",
                          borderColor:
                            form.role === r.value
                              ? "#7c3aed"
                              : "var(--conch-border)",
                          color:
                            form.role === r.value
                              ? "#a78bfa"
                              : "var(--conch-text-muted)",
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Build idea */}
                <div>
                  <label className="block text-sm font-medium text-[var(--conch-text)] mb-1.5">
                    What would you build with Conch?
                  </label>
                  <textarea
                    value={form.buildIdea}
                    onChange={(e) => updateForm("buildIdea", e.target.value)}
                    placeholder="Tell us about your idea..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-[var(--conch-text)] text-sm border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none transition-colors resize-none"
                    style={{ background: "var(--conch-surface-2)" }}
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-[var(--conch-text)] mb-1.5">
                    Country
                  </label>
                  <select
                    value={form.country}
                    onChange={(e) => updateForm("country", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-[var(--conch-text)] text-sm border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none transition-colors"
                    style={{ background: "var(--conch-surface-2)" }}
                  >
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Referral code */}
                <div>
                  <label className="block text-sm font-medium text-[var(--conch-text)] mb-1.5">
                    Referral Code <span className="text-[var(--conch-text-dim)]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.referralCode}
                    onChange={(e) => updateForm("referralCode", e.target.value)}
                    placeholder="Enter a referral code"
                    className="w-full px-4 py-3 rounded-xl text-[var(--conch-text)] text-sm border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none transition-colors"
                    style={{ background: "var(--conch-surface-2)" }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="mt-4 text-sm text-red-400">{error}</p>
            )}

            {/* Submit */}
            {isSignedIn && (
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 conch-glow"
                style={{
                  background:
                    "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)",
                }}
              >
                {loading ? "Joining..." : "Join the Waitlist"}
              </button>
            )}
          </form>
        ) : (
          /* Success state */
          <div className="p-6 md:p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[var(--conch-text)] mb-2">
              You&apos;re In. 🐚
            </h2>
            <p className="text-[var(--conch-text-muted)] mb-2">
              You&apos;re officially on the Conch Creator Challenge waitlist.
            </p>
            <p className="text-sm text-[var(--conch-purple-light)] mb-8">
              Check your inbox — we&apos;ve sent you a welcome email!
            </p>

            {/* Referral share */}
            <div className="conch-glass rounded-xl p-6 mb-4">
              <p className="text-sm font-medium text-[var(--conch-text)] mb-4">
                Know someone who should build with Conch?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={shareOnX}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border border-[var(--conch-border)] hover:border-[var(--conch-border-hover)]"
                  style={{ background: "var(--conch-surface-2)", color: "var(--conch-text)" }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Share on X
                </button>
                <button
                  onClick={copyReferralLink}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border border-[var(--conch-border)] hover:border-[var(--conch-border-hover)]"
                  style={{ background: "var(--conch-surface-2)", color: "var(--conch-text)" }}
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy Invite Link"}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-sm text-[var(--conch-text-muted)] hover:text-[var(--conch-text)] transition-colors mt-4"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
