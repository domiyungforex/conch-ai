"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function SetupRetry() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (attempt >= 5) {
      setTimedOut(true);
      return;
    }

    const delay = attempt === 0 ? 2000 : 3000;
    const timer = setTimeout(() => {
      router.refresh();
      setAttempt((n) => n + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [attempt, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-5">
      <motion.div
        animate={timedOut ? {} : { rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 rounded-full border-2 border-coral-500/30 border-t-coral-400"
      />
      <div>
        <h2 className="text-lg font-semibold text-white">
          {timedOut ? "Taking longer than expected…" : "Setting up your account…"}
        </h2>
        <p className="text-sm text-slate-400 max-w-sm mt-2">
          {timedOut
            ? "Your profile is still being created. Try refreshing manually or check back in a moment."
            : "Your profile is being created. This usually takes just a second."}
        </p>
      </div>
      {timedOut && (
        <button
          type="button"
          onClick={() => { setAttempt(0); setTimedOut(false); }}
          className="px-4 py-2 rounded-xl bg-coral-600 hover:bg-coral-500 text-white text-sm font-medium transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
