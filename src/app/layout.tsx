import type { Metadata } from "next";
import { Inter, Crimson_Text } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "THE WAY — Understand Scripture. Live it out.",
  description: "AI-powered Scripture companion for Bible study, Christian learning, teaching, prayer, and life application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${crimsonText.variable} font-sans antialiased bg-stone-50 text-stone-900`}>
        <TooltipProvider>
          <Navigation />
          <main className="min-h-screen pb-20 md:pb-0">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
