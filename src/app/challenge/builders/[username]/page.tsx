import type { Metadata } from "next";
import { BuilderProfile } from "@/components/challenge/builder-profile";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} — Conch Creator Challenge Builder`,
    description: `View ${username}'s profile and projects from the Conch Creator Challenge.`,
    twitter: {
      card: "summary_large_image",
      title: `${username} | Conch Creator Challenge`,
      description: `Builder on the Conch Creator Challenge.`,
    },
  };
}

export default async function BuilderPage({ params }: Props) {
  const { username } = await params;
  return <BuilderProfile username={username} />;
}
