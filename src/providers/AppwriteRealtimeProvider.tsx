"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { appwriteClient, appwriteAccount } from "@/lib/appwriteClient";

type RealtimeStatus = "connecting" | "live" | "offline";

const RealtimeStatusContext = createContext<RealtimeStatus>("offline");

export function useRealtimeStatus() {
  return useContext(RealtimeStatusContext);
}

// Establishes a real Appwrite browser session (bridged from the Clerk session
// via /api/appwrite-token) and subscribes to the signed-in user's own memory
// documents over Appwrite Realtime, so a memory saved in one tab/device shows
// up live in every other one. See the "Live sync" section of the implementation
// plan for why this bridge exists — Appwrite Realtime only authorizes
// subscriptions against a live Appwrite Auth session, and this app's only
// identity provider is Clerk.
export function AppwriteRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useUser();
  const qc = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>("offline");
  const statusRef = useRef<RealtimeStatus>("offline");
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const hasConnectedRef = useRef(false);

  const setStatusBoth = useCallback((s: RealtimeStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const connect = useCallback(async () => {
    setStatusBoth("connecting");
    try {
      const res = await fetch("/api/appwrite-token", { method: "POST" });
      if (!res.ok) throw new Error("token exchange failed");
      const { userId, secret, databaseId } = await res.json();

      await appwriteAccount.createSession(userId, secret);
      hasConnectedRef.current = true;

      unsubscribeRef.current?.();
      unsubscribeRef.current = appwriteClient.subscribe(
        `databases.${databaseId}.collections.memories.documents`,
        () => qc.invalidateQueries({ queryKey: ["memories"] })
      );
      setStatusBoth("live");
    } catch {
      setStatusBoth("offline");
    }
  }, [qc, setStatusBoth]);

  useEffect(() => {
    if (!isSignedIn || !user) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setStatusBoth("offline");
      // Only tear down a session we actually established — an anonymous
      // visitor who was never signed in has nothing to delete, and the
      // request fails with a CORS error since Appwrite has no session to act on.
      if (hasConnectedRef.current) {
        hasConnectedRef.current = false;
        appwriteAccount.deleteSession("current").catch(() => {});
      }
      return;
    }

    connect();

    const rearm = () => {
      if (document.visibilityState === "visible" && statusRef.current === "offline") connect();
    };
    document.addEventListener("visibilitychange", rearm);
    const interval = setInterval(() => {
      if (statusRef.current === "offline") connect();
    }, 6 * 60 * 60 * 1000);

    return () => {
      document.removeEventListener("visibilitychange", rearm);
      clearInterval(interval);
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [isSignedIn, user, connect, setStatusBoth]);

  return (
    <RealtimeStatusContext.Provider value={status}>
      {children}
    </RealtimeStatusContext.Provider>
  );
}
