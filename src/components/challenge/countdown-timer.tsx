"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Timer } from "lucide-react";

interface CountdownTimerProps {
  deadline: string | null;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(deadline: string): TimeLeft {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function DigitBlock({ value, label, size }: { value: number; label: string; size: "sm" | "md" | "lg" }) {
  const [prevValue, setPrevValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setPrevValue(value);
        setIsFlipping(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  const sizeClasses = {
    sm: "w-14 h-16 text-2xl",
    md: "w-20 h-24 text-3xl md:text-4xl",
    lg: "w-24 h-28 text-4xl md:text-5xl",
  };

  const labelSizeClasses = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  const displayValue = String(value).padStart(2, "0");

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center relative overflow-hidden`}
        style={{
          background: "var(--conch-surface-2)",
          border: "1px solid var(--conch-border)",
        }}
      >
        {/* Top half — shows previous digit */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ clipPath: "inset(0 0 50% 0)" }}
        >
          <span
            className="font-bold countdown-digit text-[var(--conch-text)]"
            style={{
              transition: isFlipping ? "transform 0.3s ease-in" : "none",
              transform: isFlipping ? "translateY(-2px)" : "translateY(0)",
            }}
          >
            {displayValue}
          </span>
        </div>

        {/* Bottom half — shows new digit */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ clipPath: "inset(50% 0 0 0)" }}
        >
          <span
            className="font-bold countdown-digit text-[var(--conch-text)]"
            style={{
              transition: isFlipping ? "transform 0.3s ease-out" : "none",
              transform: isFlipping ? "translateY(2px)" : "translateY(0)",
            }}
          >
            {displayValue}
          </span>
        </div>

        {/* Center line */}
        <div
          className="absolute left-0 right-0 h-px z-10"
          style={{ top: "50%", background: "var(--conch-border)" }}
        />

        {/* Pulse on change */}
        {isFlipping && (
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background: "rgba(124, 58, 237, 0.08)",
              animation: "pulse-ring 0.4s ease-out",
            }}
          />
        )}
      </div>
      <span
        className={`${labelSizeClasses[size]} text-[var(--conch-text-dim)] uppercase tracking-widest mt-2 font-medium`}
      >
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({
  deadline,
  label = "Time Remaining",
  className = "",
  size = "md",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const updateTimer = useCallback(() => {
    if (!deadline) return;
    const tl = calculateTimeLeft(deadline);
    setTimeLeft(tl);
    if (tl.days === 0 && tl.hours === 0 && tl.minutes === 0 && tl.seconds === 0) {
      setIsExpired(true);
    }
  }, [deadline]);

  useEffect(() => {
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [updateTimer]);

  if (!deadline) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{ background: "rgba(124, 58, 237, 0.08)", border: "1px solid var(--conch-border)" }}>
          <Timer className="w-4 h-4 text-[var(--conch-purple-light)]" />
          <span className="text-sm text-[var(--conch-text-muted)]">Dates to be announced</span>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl"
          style={{ background: "rgba(124, 58, 237, 0.12)", border: "1px solid var(--conch-border)" }}>
          <Clock className="w-5 h-5 text-[var(--conch-purple-light)]" />
          <span className="text-lg font-semibold text-[var(--conch-text)]">
            {label} — Deadline Passed
          </span>
        </div>
      </div>
    );
  }

  if (!timeLeft) return null;

  const spacing = size === "lg" ? "gap-3 md:gap-4" : size === "md" ? "gap-2 md:gap-3" : "gap-1.5 md:gap-2";

  return (
    <div className={`text-center ${className}`}>
      <p className="text-xs text-[var(--conch-text-dim)] uppercase tracking-widest mb-4 font-medium">
        {label}
      </p>
      <div className={`inline-flex items-center ${spacing}`}>
        <DigitBlock value={timeLeft.days} label="Days" size={size} />
        <span className={`text-2xl font-bold text-[var(--conch-text-dim)] mt-[-20px] ${size === "sm" ? "text-lg" : ""}`}>:</span>
        <DigitBlock value={timeLeft.hours} label="Hours" size={size} />
        <span className={`text-2xl font-bold text-[var(--conch-text-dim)] mt-[-20px] ${size === "sm" ? "text-lg" : ""}`}>:</span>
        <DigitBlock value={timeLeft.minutes} label="Minutes" size={size} />
        <span className={`text-2xl font-bold text-[var(--conch-text-dim)] mt-[-20px] ${size === "sm" ? "text-lg" : ""}`}>:</span>
        <DigitBlock value={timeLeft.seconds} label="Seconds" size={size} />
      </div>
    </div>
  );
}
