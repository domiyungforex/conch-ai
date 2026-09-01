import type { Metadata } from "next";
import { ChallengePageClient } from "@/components/challenge/challenge-page";

export const metadata: Metadata = {
  title: "Conch Creator Challenge — Build Something Worth Remembering",
  description:
    "The $5,000 Conch Creator Challenge. Build meaningful projects using Conch's persistent memory and AI agent infrastructure. Join builders worldwide.",
  openGraph: {
    title: "Conch Creator Challenge — $5,000 Creator Fund",
    description:
      "Build something worth remembering. The Conch Creator Challenge invites builders to create with persistent AI memory.",
    type: "website",
    siteName: "Conch",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conch Creator Challenge — $5,000 Creator Fund",
    description:
      "Build something worth remembering. Persistent AI memory meets creative builders.",
  },
};

export default function ChallengePage() {
  return <ChallengePageClient />;
}
