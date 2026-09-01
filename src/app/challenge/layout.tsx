import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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

export default function ChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased`}
        style={{
          background: "#050508",
          color: "#e8e8ec",
        }}
      >
        {children}
      </body>
    </html>
  );
}
