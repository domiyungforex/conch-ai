"use client";

import { useEffect, useState } from "react";
import { useAuth, SignUp } from "@clerk/nextjs";

const APPEARANCE = {
  elements: {
    rootBox: "w-full",
    card: "glass border border-white/10 shadow-2xl rounded-2xl",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "glass border border-white/10 text-white hover:bg-white/10 transition-colors rounded-xl",
    formFieldInput:
      "bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:border-violet-500 focus:ring-violet-500/20",
    formButtonPrimary:
      "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all",
    footerActionLink: "text-violet-400 hover:text-violet-300",
    formFieldLabel: "text-slate-300",
    dividerLine: "bg-white/10",
    dividerText: "text-slate-500",
  },
};

export default function SignUpPage() {
  const { isLoaded } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3500);
    return () => clearTimeout(t);
  }, []);

  const showFallback = timedOut && !isLoaded;

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-white">Conch</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-1">Own your AI memory. Forever.</p>
        </div>

        {showFallback ? (
          <div className="glass border border-white/10 rounded-2xl p-8 text-center space-y-4">
            <p className="text-slate-300 text-sm">
              Auth is not configured for this domain.
            </p>
            <a
              href="https://conchportal.com/sign-up"
              className="inline-block text-violet-400 hover:text-violet-300 text-sm underline transition-colors"
            >
              Sign up at conchportal.com →
            </a>
          </div>
        ) : (
          <SignUp appearance={APPEARANCE} forceRedirectUrl="/dashboard" />
        )}
      </div>
    </div>
  );
}
