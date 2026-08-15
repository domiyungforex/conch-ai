"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "conch-theme";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // Private mode etc. — the class toggle still works for this session.
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  // Read the current state after hydration (the no-flash script already
  // applied the stored theme before paint).
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(next);
    setIsDark(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={className}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
