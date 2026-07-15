import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Web3Provider } from "@/providers/Web3Provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://conchportal.com";
const SITE_DESCRIPTION =
  "Conch is an AI with persistent memory — it remembers what you tell it, carries agents that can do real math and keep business records, and gives you a portable AI identity you own across apps, devices, and chains.";

export const metadata: Metadata = {
  title: { default: "Conch — Own Your AI Memory", template: "%s | Conch" },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  applicationName: "Conch",
  openGraph: {
    title: "Conch — Own Your AI Memory",
    description: SITE_DESCRIPTION,
    type: "website",
    url: APP_URL,
    siteName: "Conch",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conch — Own Your AI Memory",
    description: SITE_DESCRIPTION,
  },
  keywords: [
    "Conch",
    "Conch AI",
    "AI memory",
    "AI agent with memory",
    "persistent AI memory",
    "AI identity",
    "decentralized identity",
    "AI agents",
    "Web3 AI",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Conch",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: APP_URL,
  description: SITE_DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}>
        <ClerkProvider>
          <Web3Provider>
          {children}
          <Toaster />
          </Web3Provider>
        </ClerkProvider>
      </body>
    </html>
  );
}