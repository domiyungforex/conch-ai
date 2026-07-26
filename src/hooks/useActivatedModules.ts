"use client";

import { useEffect, useState, useCallback } from "react";
import type { ModuleKey } from "@/lib/modules";

const STORAGE_KEY = "conch:activated-modules";

// Per-browser, not per-account — this is a pure nav-declutter preference,
// not an access boundary. The modules are already fully enabled server-side
// (see src/lib/moduleFlags.ts); this only controls whether their sidebar
// links are shown until the user opts in, so it's fine that it doesn't sync
// across devices. A user who knows a module's URL can always reach it
// directly regardless of this setting.
function readStored(): ModuleKey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ModuleKey[]) : [];
  } catch {
    return [];
  }
}

export function useActivatedModules() {
  const [activated, setActivated] = useState<ModuleKey[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setActivated(readStored());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: ModuleKey[]) => {
    setActivated(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private browsing, quota) — in-memory state still works for this tab.
    }
    // Same-tab listeners (Sidebar + the activation page) need to know too;
    // the native "storage" event only fires in *other* tabs.
    window.dispatchEvent(new Event("conch:activated-modules-changed"));
  }, []);

  const activate = useCallback((key: ModuleKey) => {
    persist(Array.from(new Set([...readStored(), key])));
  }, [persist]);

  const deactivate = useCallback((key: ModuleKey) => {
    persist(readStored().filter((k) => k !== key));
  }, [persist]);

  const isActivated = useCallback((key: ModuleKey) => activated.includes(key), [activated]);

  useEffect(() => {
    const onChange = () => setActivated(readStored());
    window.addEventListener("conch:activated-modules-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("conch:activated-modules-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return { activated, hydrated, activate, deactivate, isActivated };
}
