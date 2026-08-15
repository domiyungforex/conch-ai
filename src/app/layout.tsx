import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
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
  "Conch is a memory layer for AI — every conversation becomes memory, every memory stays yours. Portable across apps, devices, and chains, recalled whenever you need it.";

export const metadata: Metadata = {
  title: { default: "Conch — Own Your AI Memory", template: "%s | Conch" },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  applicationName: "Conch",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/mask-icon.svg", color: "#6d5cff" }],
  },
  other: {
    "msapplication-TileColor": "#6d5cff",
    "msapplication-TileImage": "/mstile-150x150.png",
    "msapplication-config": "/browserconfig.xml",
  },
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
    "persistent AI memory",
    "portable memory",
    "AI that remembers",
    "memory layer for AI",
    "AI agents",
    "Web3 AI",
  ],
};

export const viewport: Viewport = {
  themeColor: "#6d5cff",
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
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}