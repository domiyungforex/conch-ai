import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Challenge Projects — Conch Creator Challenge",
  description:
    "Explore projects built with Conch's persistent memory and AI agent infrastructure.",
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
