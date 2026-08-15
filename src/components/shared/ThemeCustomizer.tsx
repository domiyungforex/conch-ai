"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, Sun, Moon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCENT_PRESETS, DEFAULT_ACCENT } from "@/lib/themePresets";

const THEME_KEY = "conch-theme";
const ACCENT_KEY = "conch-accent";

interface ThemeState {
  dark: boolean;
  accent: string;
}

function readState(): ThemeState {
  const el = document.documentElement;
  const accent = ACCENT_PRESETS.find((p) => el.classList.contains(`theme-${p.id}`))?.id ?? DEFAULT_ACCENT;
  return { dark: el.classList.contains("dark"), accent };
}

function setDark(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {
    // Private mode etc. — the class toggle still works for this session.
  }
}

function setAccent(id: string) {
  const el = document.documentElement;
  ACCENT_PRESETS.forEach((p) => el.classList.remove(`theme-${p.id}`));
  el.classList.add(`theme-${id}`);
  try {
    localStorage.setItem(ACCENT_KEY, id);
  } catch {
    // Persist is best-effort.
  }
}

export function ThemeCustomizer({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ThemeState>({ dark: false, accent: DEFAULT_ACCENT });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(readState());
  }, []);

  // Close when clicking outside the popover.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = (dark: boolean) => {
    setDark(dark);
    setState((s) => ({ ...s, dark }));
  };

  const choose = (id: string) => {
    setAccent(id);
    setState((s) => ({ ...s, accent: id }));
  };

  return (
    <div className={`relative ${className ?? ""}`} ref={rootRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-label="Customize theme"
        aria-expanded={open}
        title="Customize theme — colors and dark/light"
      >
        <Palette className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-white/10 bg-popover p-3 shadow-2xl">
          {/* Accent color swatches */}
          <p className="eyebrow text-slate-500 mb-2.5">Accent color</p>
          <div className="flex items-center gap-2 mb-4">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => choose(p.id)}
                aria-label={p.name}
                title={p.name}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                  state.accent === p.id ? "ring-2 ring-coral-500 ring-offset-2 ring-offset-popover" : ""
                }`}
                style={{ background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})` }}
              >
                {state.accent === p.id && <Check className="w-4 h-4 text-white drop-shadow" />}
              </button>
            ))}
          </div>

          {/* Dark / light */}
          <p className="eyebrow text-slate-500 mb-2">Appearance</p>
          <div className="flex rounded-lg border border-white/10 p-0.5 gap-0.5">
            <button
              onClick={() => toggle(false)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                !state.dark
                  ? "bg-coral-600/15 text-coral-600"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Light
            </button>
            <button
              onClick={() => toggle(true)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                state.dark
                  ? "bg-coral-600/15 text-coral-600"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
