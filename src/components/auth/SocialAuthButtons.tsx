"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/lib/auth/errors";

type ProviderId = "discord" | "google" | "metamask" | "phantom";

const OAUTH_REDIRECT_URL = "/sso-callback";
const OAUTH_REDIRECT_COMPLETE_URL = "/dashboard";

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1A11.998 11.998 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  );
}

function ProviderIcon({ provider }: { provider: ProviderId }) {
  if (provider === "discord") return <DiscordIcon />;
  if (provider === "google") return <GoogleIcon />;
  if (provider === "metamask") return <span className="text-base leading-none">🦊</span>;
  return <span className="text-base leading-none">👻</span>;
}

const PROVIDER_LABEL: Record<ProviderId, string> = {
  discord: "Discord",
  google: "Google",
  metamask: "MetaMask",
  phantom: "Phantom",
};

interface PhantomProvider {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString(): string } }>;
}

function getPhantomProvider(): PhantomProvider | null {
  const w = window as unknown as { phantom?: { solana?: PhantomProvider }; solana?: PhantomProvider };
  if (w.phantom?.solana?.isPhantom) return w.phantom.solana;
  if (w.solana?.isPhantom) return w.solana;
  return null;
}

interface SocialAuthButtonsProps {
  mode: "sign-in" | "sign-up";
  onError: (message: string) => void;
}

export function SocialAuthButtons({ mode, onError }: SocialAuthButtonsProps) {
  const clerk = useClerk();
  const [pending, setPending] = useState<ProviderId | null>(null);

  async function handleOAuth(strategy: "oauth_discord" | "oauth_google") {
    const resource = mode === "sign-in" ? clerk.client.signIn : clerk.client.signUp;
    try {
      await resource.authenticateWithRedirect({
        strategy,
        redirectUrl: OAUTH_REDIRECT_URL,
        redirectUrlComplete: OAUTH_REDIRECT_COMPLETE_URL,
      });
    } catch (err) {
      onError(getAuthErrorMessage(err));
      setPending(null);
    }
  }

  async function handleMetamask() {
    try {
      if (mode === "sign-in") {
        const result = await clerk.client.signIn.authenticateWithMetamask();
        if (result.status === "complete") {
          await clerk.setActive({ session: result.createdSessionId });
          window.location.href = OAUTH_REDIRECT_COMPLETE_URL;
        } else {
          onError("Couldn't complete sign-in with MetaMask. Please try again.");
        }
      } else {
        const result = await clerk.client.signUp.authenticateWithMetamask();
        if (result.status === "complete" && result.createdSessionId) {
          await clerk.setActive({ session: result.createdSessionId });
          window.location.href = OAUTH_REDIRECT_COMPLETE_URL;
        } else {
          onError("Couldn't complete sign-up with MetaMask. Please try again.");
        }
      }
    } catch (err) {
      onError(getAuthErrorMessage(err, "No MetaMask wallet found, or the connection was cancelled."));
    }
  }

  async function handlePhantom() {
    if (!getPhantomProvider()) {
      onError("Phantom wallet not found. Install the Phantom browser extension to continue.");
      return;
    }
    try {
      // authenticateWithSolana connects to the named wallet and handles signing internally —
      // same convenience-method shape as authenticateWithMetamask(), no manual signature needed.
      if (mode === "sign-in") {
        const result = await clerk.client.signIn.authenticateWithSolana({ walletName: "Phantom" });
        if (result.status === "complete") {
          await clerk.setActive({ session: result.createdSessionId });
          window.location.href = OAUTH_REDIRECT_COMPLETE_URL;
        } else {
          onError("Couldn't complete sign-in with Phantom. Please try again.");
        }
      } else {
        const result = await clerk.client.signUp.authenticateWithSolana({ walletName: "Phantom" });
        if (result.status === "complete" && result.createdSessionId) {
          await clerk.setActive({ session: result.createdSessionId });
          window.location.href = OAUTH_REDIRECT_COMPLETE_URL;
        } else {
          onError("Couldn't complete sign-up with Phantom. Please try again.");
        }
      }
    } catch (err) {
      onError(getAuthErrorMessage(err, "Couldn't connect to Phantom. Please try again."));
    }
  }

  async function handleClick(provider: ProviderId) {
    if (pending) return;
    setPending(provider);
    if (provider === "discord") await handleOAuth("oauth_discord");
    else if (provider === "google") await handleOAuth("oauth_google");
    else if (provider === "metamask") await handleMetamask();
    else await handlePhantom();
    // Redirect strategies navigate away; wallet strategies reset on error only (success navigates away).
    setPending(null);
  }

  const providers: ProviderId[] = ["discord", "google", "metamask", "phantom"];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {providers.map((provider) => (
        <Button
          key={provider}
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending !== null}
          onClick={() => handleClick(provider)}
          className="h-10 gap-2 justify-center text-xs font-medium"
        >
          <ProviderIcon provider={provider} />
          {pending === provider ? "Connecting…" : PROVIDER_LABEL[provider]}
        </Button>
      ))}
    </div>
  );
}
