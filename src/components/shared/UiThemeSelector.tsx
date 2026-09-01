"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, Check, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UI_THEME_PRESETS, DEFAULT_UI_THEME, type UiThemePreset } from "@/lib/uiThemePresets";

const UI_THEME_KEY = "conch-ui-theme";
const UI_MODE_KEY = "conch-ui-mode"; // "light" | "dark" | "system"

function applyUiTheme(themeId: string, mode: "light" | "dark" | "system") {
  const preset = UI_THEME_PRESETS.find((p) => p.id === themeId);
  if (!preset) return;

  const root = document.documentElement;
  const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Remove all theme classes
  UI_THEME_PRESETS.forEach((p) => root.classList.remove(`ui-theme-${p.id}`));

  // Apply selected theme class
  root.classList.add(`ui-theme-${themeId}`);

  // Apply dark/light mode
  root.classList.toggle("dark", isDark);

  // Apply CSS custom properties
  const vars = isDark ? preset.dark : preset.light;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  // Save preference
  try {
    localStorage.setItem(UI_THEME_KEY, themeId);
    localStorage.setItem(UI_MODE_KEY, mode);
  } catch {
    // Private mode etc.
  }
}

function getSavedTheme(): { themeId: string; mode: "light" | "dark" | "system" } {
  if (typeof window === "undefined") return { themeId: DEFAULT_UI_THEME, mode: "dark" };
  try {
    const themeId = localStorage.getItem(UI_THEME_KEY) || DEFAULT_UI_THEME;
    const mode = (localStorage.getItem(UI_MODE_KEY) as "light" | "dark" | "system") || "dark";
    return { themeId, mode };
  } catch {
    return { themeId: DEFAULT_UI_THEME, mode: "dark" };
  }
}

function ThemePreviewCard({ preset, isActive, onClick }: {
  preset: UiThemePreset;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full text-left rounded-xl p-3 transition-all duration-200
        border ${isActive
          ? "border-coral-500/40 bg-coral-500/10 shadow-lg shadow-coral-500/10"
          : "border-white/6 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
        }
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-coral-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Preview swatch */}
      <div className="flex gap-1.5 mb-2.5">
        <div
          className="w-8 h-8 rounded-lg border border-white/10"
          style={{ background: preset.preview.bg }}
        />
        <div className="flex flex-col gap-1">
          <div
            className="w-8 h-3 rounded-md border border-white/10"
            style={{ background: preset.preview.primary }}
          />
          <div
            className="w-8 h-3 rounded-md border border-white/10"
            style={{ background: preset.preview.secondary }}
          />
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1 ml-1">
          <div
            className="h-1.5 rounded-full"
            style={{ background: preset.preview.text, opacity: 0.3 }}
          />
          <div
            className="h-1.5 rounded-full w-3/4"
            style={{ background: preset.preview.text, opacity: 0.2 }}
          />
        </div>
      </div>

      {/* Name + description */}
      <p className="text-[13px] font-medium text-foreground">{preset.name}</p>
      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{preset.description}</p>
    </button>
  );
}

export function UiThemeSelector({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [themeId, setThemeId] = useState(DEFAULT_UI_THEME);
  const [mode, setMode] = useState<"light" | "dark" | "system">("dark");
  const rootRef = useRef<HTMLDivElement>(null);

  // Load saved theme on mount
  useEffect(() => {
    const saved = getSavedTheme();
    setThemeId(saved.themeId);
    setMode(saved.mode);
    applyUiTheme(saved.themeId, saved.mode);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyUiTheme(themeId, "system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode, themeId]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const chooseTheme = (id: string) => {
    setThemeId(id);
    applyUiTheme(id, mode);
  };

  const chooseMode = (m: "light" | "dark" | "system") => {
    setMode(m);
    applyUiTheme(themeId, m);
  };

  const modeButtons = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <div className={`relative ${className ?? ""}`} ref={rootRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose UI theme"
        aria-expanded={open}
        title="Choose your preferred UI theme"
      >
        <Palette className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl glass-strong border border-white/10 p-4 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">UI Theme</p>
              <p className="text-[11px] text-slate-500">Choose your preferred look</p>
            </div>
          </div>

          {/* Mode selector */}
          <div className="flex rounded-xl border border-white/8 p-0.5 gap-0.5 mb-4 bg-white/[0.02]">
            {modeButtons.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => chooseMode(value)}
                className={`
                  flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-200
                  ${mode === value
                    ? "bg-coral-500/15 text-coral-400 shadow-sm"
                    : "text-slate-500 hover:text-foreground hover:bg-white/[0.04]"
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Theme cards */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {UI_THEME_PRESETS.map((preset) => (
              <ThemePreviewCard
                key={preset.id}
                preset={preset}
                isActive={themeId === preset.id}
                onClick={() => chooseTheme(preset.id)}
              />
            ))}
          </div>

          {/* Footer hint */}
          <p className="text-[10px] text-slate-600 mt-3 text-center">
            Theme is saved locally in your browser
          </p>
        </div>
      )}
    </div>
  );
}
