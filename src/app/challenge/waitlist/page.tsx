import type { Metadata } from "next";
import { WaitlistPage } from "@/components/challenge/waitlist-page";

export const metadata: Metadata = {
  title: "Conch Creator Challenge Waitlist — AI That Remembers",
  description:
    "Join the Conch Creator Challenge waitlist. Conch is building AI with persistent memory, intelligent agents, and continuous context. Applications opening soon.",
  openGraph: {
    title: "Conch Creator Challenge Waitlist — $5,000 Creator Fund",
    description:
      "AI can generate. AI can reason. But can it remember? Join builders everywhere for the Conch Creator Challenge.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conch Creator Challenge Waitlist",
    description:
      "AI that remembers. Join the waitlist for the $5,000 Conch Creator Challenge.",
  },
};

export default function ChallengeWaitlistPage() {
  return <WaitlistPage />;
}
