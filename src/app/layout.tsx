import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Web3Provider } from "@/providers/Web3Provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Conch — Own Your AI Memory", template: "%s | Conch" },
  description:
    "Conch is a decentralized AI identity and memory platform. Own, manage, and carry your AI memory across apps, devices, chains, and agents.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://conch.ai"),
  openGraph: {
    title: "Conch — Own Your AI Memory",
    description: "A decentralized AI identity and memory platform.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conch — Own Your AI Memory",
    description: "A decentralized AI identity and memory platform.",
    images: ["/og-image.png"],
  },
  keywords: ["AI memory", "decentralized identity", "AI agents", "Web3 AI"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider
          clerkJsUrl="https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
          proxyUrl="https://conchportal.com/api/clerk-proxy"
        >
          <Web3Provider>
            {children}
            <Toaster />
          </Web3Provider>
        </ClerkProvider>
      </body>
    </html>
  );
}
