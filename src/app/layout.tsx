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
  "Conch is a memory layer for AI. Every conversation becomes memory, every memory stays yours. Portable across apps, devices, and chains, recalled whenever you need it.";

export const metadata: Metadata = {
  title: { default: "Conch | Own Your AI Memory", template: "%s | Conch" },
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
    other: [{ rel: "mask-icon", url: "/mask-icon.svg", color: "#c8891f" }],
  },
  other: {
    "msapplication-TileColor": "#c8891f",
    "msapplication-TileImage": "/mstile-150x150.png",
    "msapplication-config": "/browserconfig.xml",
  },
  openGraph: {
    title: "Conch | Own Your AI Memory",
    description: SITE_DESCRIPTION,
    type: "website",
    url: APP_URL,
    siteName: "Conch",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conch | Own Your AI Memory",
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
  themeColor: "#c8891f",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme + accent before first paint so there is no
            flash. Defaults to light / Smokey Amber when nothing is stored. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("conch-theme");if(t==="dark"){document.documentElement.classList.add("dark")}var a=localStorage.getItem("conch-accent");if(a){document.documentElement.classList.add("theme-"+a)}}catch(e){}})();`,
          }}
        />
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